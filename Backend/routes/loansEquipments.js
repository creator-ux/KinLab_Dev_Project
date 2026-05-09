const express = require('express');
const router = express.Router();
const db = require('../db')
const {checkPermissions} = require('../middlewares/auth');
const sse = require('../sse');

//petición Get,
router.get('/', 
    checkPermissions(
        [
            //En este apartado se agrega los niveles de los administradores segun sea el caso
            //y los que pueden existir
            //en dado caso de si a futuro desean usar el sistema para la gestión de los 
            //demás laboratirios
            //Deberá agregar a los demas usuarios en la API cuando vaya a crecer
            //es por cada ruta
            { tipo: 'administrador', nivel: 0 },
            { tipo: 'administrador', nivel: 1 },
            //
        ]
    ),

    async (req, res) => {
        try{
            const user = req.user;

            // Admin global: ve todos los préstamos
            if (user.tipo === 'administrador' && user.nivel === 0) {
                const [rows] = await db.query(
                    `SELECT 
                        pe.id_prestamoE, 
                        pe.motivo,
                        pe.fecha_prestamo, 
                        pe.estado_aprobacion,
                        pe.cantidad,
                        pe.devuelto,
                        pe.id_equipo,
                        CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno) as nombre_usuario,
                        u.matricula as matricula,
                        u.correo as correo,
                        u.carrera, 
                        e.nombre_equipo,
                        e.id_laboratorio
                    FROM prestamo_equipo pe
                    JOIN usuarios u ON pe.id_usuario = u.id_usuario
                    JOIN equipos e ON pe.id_equipo = e.id_equipo
                    ORDER BY pe.fecha_prestamo DESC`
                );
                return res.json(rows);
            }

            // Admin de laboratorio: limitar a sus laboratorios
            if (user.tipo === 'administrador' && user.nivel !== 0) {
                const [labs] = await db.query('SELECT id_laboratorio FROM laboratorios WHERE id_usuario_encargado = ?', [user.id_usuario]);
                const labIds = labs.map(l => l.id_laboratorio);
                if (labIds.length === 0) {
                    // Sin laboratorios asignados: no debe visualizar préstamos
                    return res.json([]);
                }
                const placeholders = labIds.map(() => '?').join(',');

                const [rows] = await db.query(
                    `SELECT 
                        pe.id_prestamoE, 
                        pe.motivo,
                        pe.fecha_prestamo, 
                        pe.estado_aprobacion,
                        pe.cantidad,
                        pe.devuelto,
                        pe.id_equipo,
                        CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno) as nombre_usuario,
                        u.matricula as matricula,
                        u.correo as correo,
                        u.carrera, 
                        e.nombre_equipo,
                        e.id_laboratorio
                    FROM prestamo_equipo pe
                    JOIN usuarios u ON pe.id_usuario = u.id_usuario
                    JOIN equipos e ON pe.id_equipo = e.id_equipo
                    WHERE e.id_laboratorio IN (${placeholders})
                    ORDER BY pe.fecha_prestamo ASC`,
                    labIds
                );
                return res.json(rows);
            }

            // En esta ruta solo hay administradores; por seguridad devolvemos vacío si cae aquí
            return res.json([]);
        } catch (error){
            console.error(error);
            res.status(500).json({message: 'Error: No se obtuvieron los prestamos'});
        }
    }
);

//Post admin y usuario 
router.post('/', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 }, 
            { tipo: 'administrador', nivel: 1 },
            //
            {tipo: 'usuario', nivel: 0},
        ]
    ),

    async(req, res)=>{
        const {id_equipo, motivo} = req.body;

        if (!id_equipo){
            return res.status(400).json({error: 'Falta datos del equipo'});
        }

        const user = req.user;
        const conn = await db.getConnection();

            try{
                await conn.beginTransaction();
                const [equipoRows] = await conn.query('SELECT estado FROM equipos WHERE id_equipo=? FOR UPDATE', [id_equipo]);
                if (!equipoRows.length) {
                    throw new Error('Equipo no existente');
                }
                if (equipoRows[0].estado !== 'disponible') {
                    throw new Error('Equipo no disponible');
                }

                const [result] = await conn.query('INSERT INTO prestamo_equipo (id_usuario, id_equipo, motivo, estado_aprobacion) VALUES (?, ?, ?, ?)',
                    [user.id_usuario, id_equipo, motivo, 0]);

                await conn.commit();
                // Notificar a clientes SSE
                sse.sendEvent({ topic: 'loansEquipment', action: 'created', id_prestamoE: result.insertId, id_equipo });
                res.status(201).json({
                    message: 'Solicitud de préstamo enviada exitosamente.',
                    id_prestamoE: result.insertId
                });                
            }

            catch (err){
                await conn.rollback();
                console.error("Error en la transacción de préstamo:", err);
                res.status(400).json({ error: err.message });
            }
            finally{
                conn.release();
                    }
    }

);

// Put de aprobacion checkRole(['administrador']),
router.put('/approve/:id', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 }, 
            { tipo: 'administrador', nivel: 1 },
        ]
    ),

    async(req, res) =>{
        const {estado_aprobacion} = req.body;
        const { id: id_prestamoE } = req.params;
        const admin = req.user;

        if (estado_aprobacion === undefined || ![1, 2].includes(estado_aprobacion)){
            return res.status(400).json({ message: 'El estado de aprobación no es válido.' });
        }

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [prestamo] = await conn.query('SELECT id_equipo FROM prestamo_equipo WHERE id_prestamoE = ?', [id_prestamoE]);
            if (!prestamo.length){
                throw new Error('El préstamo no existe.');
            }
            const id_equipo = prestamo[0].id_equipo;
            await conn.query('UPDATE prestamo_equipo SET estado_aprobacion = ? WHERE id_prestamoE = ?', [estado_aprobacion, id_prestamoE]);
            
            if (estado_aprobacion === 1) {
                await conn.query('UPDATE equipos SET estado = "en_uso" WHERE id_equipo = ?', [id_equipo]);
                await conn.query('INSERT INTO log_movimientos (tipo_movimiento, detalle, id_usuario) VALUES (?, ?, ?)',
                    ['aprobacion_prestamo_equipo', `Aprobado préstamo ID=${id_prestamoE} para equipo ID=${id_equipo}`, admin.id_usuario]
                );
                sse.sendEvent({ topic: 'loansEquipment', action: 'approved', id_prestamoE, id_equipo });
            } else if (estado_aprobacion === 2) {
                // No se afecta el stock, solo se registra el rechazo en el log
                await conn.query('INSERT INTO log_movimientos (tipo_movimiento, detalle, id_usuario) VALUES (?, ?, ?)',
                    ['rechazo_prestamo_equipo', `Rechazado préstamo ID=${id_prestamoE}`, admin.id_usuario]
                );
                sse.sendEvent({ topic: 'loansEquipment', action: 'rejected', id_prestamoE, id_equipo });
            }

            await conn.commit();
            res.json({ message: 'El estado del préstamo fue actualizado correctamente.' });
        } catch (error){
            await conn.rollback();
            console.error(error);
            res.status(500).json({message: 'Error: no se pudo actualizar'});
        } finally {
            conn.release();
        }
    }
);

// GET para que un usuario vea solo sus préstamos
router.get('/mis-prestamos', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 },
            { tipo: 'administrador', nivel: 1 },
            //
            { tipo: 'usuario', nivel: 0},
        ]
    ),

    async (req, res) => {
        try {
            const user = req.user;
            const [rows] = await db.query(
            `SELECT 
                pe.id_prestamoE,
                pe.motivo,
                pe.fecha_prestamo,
                pe.estado_aprobacion,
                e.nombre_equipo 
            FROM prestamo_equipo pe
            JOIN equipos e ON pe.id_equipo = e.id_equipo
            WHERE pe.id_usuario = ?
            ORDER BY pe.fecha_prestamo DESC`, 
                [user.id_usuario]
            );
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener tus préstamos' });
        }
    }
);

// DELETE para que un usuario cancele su propia solicitud de préstamo
router.delete('/cancel/:id', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 },
            { tipo: 'administrador', nivel: 1 },//
            { tipo: 'usuario', nivel:0},
        ]
    ),

    async (req, res) => {
        try {
            const { id: id_prestamoE } = req.params;
            const user = req.user;

            // 1. Buscamos el préstamo para verificar su estado y dueño
            const [prestamoRows] = await db.query(
                'SELECT id_usuario, estado_aprobacion FROM prestamo_equipo WHERE id_prestamoE = ?',
                [id_prestamoE]
            );

            if (prestamoRows.length === 0) {
                return res.status(404).json({ message: 'Solicitud de préstamo no encontrada.' });
            }

            const prestamo = prestamoRows[0];

            // 2. Verificamos que el usuario sea el dueño (o un admin)
            if (prestamo.id_usuario !== user.id_usuario && user.nivel !== 0) {
                return res.status(403).json({ message: 'No tienes permiso para cancelar esta solicitud.' });
            }

            // 3. Verificamos que el préstamo esté pendiente (estado 0)
            if (prestamo.estado_aprobacion !== 0) {
                return res.status(400).json({ message: 'Esta solicitud ya ha sido procesada y no puede ser cancelada.' });
            }

            // Si todas las verificaciones pasan, procedemos a eliminar
            await db.query('DELETE FROM prestamo_equipo WHERE id_prestamoE = ?', [id_prestamoE]);

            res.json({ message: 'La solicitud de préstamo ha sido cancelada exitosamente.' });
            try { sse.sendEvent({ topic: 'loansEquipment', action: 'canceled', id_prestamoE }); } catch(_) {}

        } catch (error) {
            console.error("Error al cancelar el préstamo de equipo:", error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
);

// PUT para confirmar la devolución de un préstamo (solo admin)
router.put('/return/:id', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 },
            { tipo: 'administrador', nivel: 1 },
        ]
    ),

    async (req, res) => {
        const { id: id_prestamoE } = req.params;
        const admin = req.user;

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [prestamoRows] = await conn.query('SELECT * FROM prestamo_equipo WHERE id_prestamoE = ? FOR UPDATE', [id_prestamoE]);
            if (!prestamoRows.length) {
                throw new Error('El préstamo no existe.');
            }

            const prestamo = prestamoRows[0];
            if (prestamo.devuelto === 1) {
                throw new Error('Este préstamo ya ha sido marcado como devuelto.');
            }
            if (prestamo.estado_aprobacion !== 1) {
                throw new Error('No se puede devolver un préstamo que no fue aprobado.');
            }

            //Marca el préstamo como devuelto y establece la fecha de devolución
            await conn.query('UPDATE prestamo_equipo SET devuelto = 1, fecha_devolucion = NOW() WHERE id_prestamoE = ?', [id_prestamoE]);

            //Restituye el estado del equipo a 'disponible'
            await conn.query('UPDATE equipos SET estado = "disponible" WHERE id_equipo = ?', [prestamo.id_equipo]);

            //Registra el movimiento en el log
            await conn.query('INSERT INTO log_movimientos (tipo_movimiento, detalle, id_usuario) VALUES (?, ?, ?)',
                ['devolucion', `Devolución confirmada para préstamo ID=${id_prestamoE}`, admin.id_usuario]
            );

            await conn.commit();
            sse.sendEvent({ topic: 'loansEquipment', action: 'returned', id_prestamoE, id_equipo: prestamo.id_equipo });
            res.json({ message: 'Devolución confirmada exitosamente.' });

        } catch (error) {
            await conn.rollback();
            console.error(error);
            res.status(500).json({ error: error.message });
        } finally {
            conn.release();
        }
    }
);

module.exports = router;
