const express = require ('express');
const router = express.Router();
const db = require ('../db');
const { checkPermissions } = require('../middlewares/auth');

//Get (admin) checkRole(['administrador']),
router.get('/', checkPermissions([{ tipo: 'administrador', nivel: 0 }]),
    async (req, res) => {
        try{
            const [rows] = await db.query(
            `SELECT 
                pc.id_prestamoC, 
                pc.cantidad, 
                pc.fecha_prestamo, 
                pc.estado_aprobacion,
                pc.devuelto,
                pc.id_componente,
                CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno) as nombre_usuario,
                u.matricula as matricula,
                u.carrera,
                c.nombre_componente
            FROM prestamo_componente pc
            JOIN usuarios u ON pc.id_usuario = u.id_usuario
            JOIN componentes c ON pc.id_componente = c.id_componente
            ORDER BY pc.fecha_prestamo DESC`
            );
            res.json(rows);
        } catch (error){
            console.error(error);
            res.status(500).json({message: 'Error: no se obtuvieron los prestamos'})
        }
    }
);

//Post prestamo (tanto usuario como administrador) checkRole(['administrador', 'alumno', 'profesor']),
router.post('/', checkPermissions([{ tipo: 'administrador', nivel: 0 }, { tipo: 'usuario', nivel: 0 }]),
    async (req, res) => {
        const user = req.user;
        const { id_componente, cantidad, motivo } = req.body;

        if (!id_componente || !cantidad <= 0){
            return res.status(400).json({ error: 'Faltan datos o la cantidad no es válida.' });
        }

        const conn = await db.getConnection();

        try{
            await conn.beginTransaction();
            const [comp] = await conn.query('SELECT cantidad FROM componentes WHERE id_componente=? FOR UPDATE', [id_componente]);
            if (!comp.length) throw new Error('Componente no existe');
            if (comp[0].cantidad < cantidad) throw new Error('Stock insuficiente');

            const [result] = await conn.query(
            'INSERT INTO prestamo_componente (id_usuario, id_componente, cantidad, motivo) VALUES (?, ?, ?, ?)',
            [user.id_usuario, id_componente, cantidad, motivo]);

            await conn.commit();
            res.status(201).json({
                message: 'Solicitud de préstamo enviada exitosamente.',
                id_prestamoC: result.insertId
            });
            
        } catch (err) {
            await conn.rollback();
            console.error("Error en transacción de préstamo de componente:", err);
            res.status(400).json({ error: err.message });} 
                
            finally {
                    conn.release();
                }
    }    
);

//PUT aprobar el prestamo checkRole(['administrador']),
router.put('/approve/:id', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]),
    async (req, res) => {
        const {estado_aprobacion} = req.body;
        const { id: id_prestamoC } = req.params;
        const admin = req.user;

        if (![1, 2].includes(estado_aprobacion)){
            return res.status(400).json({message: 'El estado de la aprobación no es válido'});
        }

        const conn = await db.getConnection();

        try {
            await conn.beginTransaction();

            const [prestamoRows] = await conn.query('SELECT * FROM prestamo_componente WHERE id_prestamoC = ? FOR UPDATE', 
                [id_prestamoC]);
            if (!prestamoRows.length) throw new Error('El préstamo no existe.');

            const prestamo = prestamoRows[0];
            if (prestamo.estado_aprobacion !== 0) throw new Error('Este préstamo ya ha sido procesado.');

            await conn.query('UPDATE prestamo_componente SET estado_aprobacion=? WHERE id_prestamoC=?', 
                [estado_aprobacion, id_prestamoC]);
            
            if (estado_aprobacion === 1){
                const [comp] = await conn.query('SELECT cantidad FROM componentes WHERE id_componente = ? FOR UPDATE', 
                    [prestamo.id_componente]);
                if (comp[0].cantidad < prestamo.cantidad) throw new Error('Stock insuficiente en el momento de la aprobación.');

                await conn.query('UPDATE componentes SET cantidad = cantidad - ? WHERE id_componente = ?', 
                    [prestamo.cantidad, prestamo.id_componente]);
                await conn.query('INSERT INTO log_movimientos (tipo_movimiento, detalle, id_usuario) VALUES (?, ?, ?)',
                    ['aprobacion_prestamo_comp', `Aprobado préstamo ID=${id_prestamoC}, ${prestamo.cantidad} unidades`, admin.id_usuario]
                );
            } else if (estado_aprobacion === 2) {
                // No se afecta el stock, solo se registra el rechazo en el log
                await conn.query('INSERT INTO log_movimientos (tipo_movimiento, detalle, id_usuario) VALUES (?, ?, ?)',
                    ['rechazo_prestamo_comp', `Rechazado préstamo ID=${id_prestamoC}`, admin.id_usuario]
                );
            }

            await conn.commit();
            res.json({ message: 'El estado del préstamo fue actualizado correctamente.' });

        } catch (error){
            await conn.rollback();
            console.error(error);
            res.status(500).json({error: error.message});
        } finally {
            if (conn) conn.release();
        }
    }
);

// GET para que un usuario vea solo sus préstamos
router.get('/mis-prestamos', checkPermissions([ { tipo: 'administrador', nivel: 0 }, { tipo: 'usuario', nivel: 0 } ]), 
    async (req, res) => {
        try {
            const user = req.user;
            const [rows] = await db.query(
            `SELECT 
                pc.id_prestamoC,
                pc.cantidad,
                pc.motivo,
                pc.fecha_prestamo,
                pc.estado_aprobacion,
                c.nombre_componente 
            FROM prestamo_componente pc
            JOIN componentes c ON pc.id_componente = c.id_componente
            WHERE pc.id_usuario = ?
            ORDER BY pc.fecha_prestamo DESC`, 
                [user.id_usuario]
            );
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener tus préstamos' });
        }
    }
);

// DELETE para que un usuario cancele su propia solicitud de préstamo de componente
router.delete('/cancel/:id', checkPermissions([ { tipo: 'administrador', nivel: 0 }, { tipo: 'usuario', nivel: 0 } ]), 
    async (req, res) => {
        try {
            const { id: id_prestamoC } = req.params;
            const user = req.user;

            // 1. Buscamos el préstamo para verificar su estado y dueño
            const [prestamoRows] = await db.query(
                'SELECT id_usuario, estado_aprobacion FROM prestamo_componente WHERE id_prestamoC = ?',
                [id_prestamoC]
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
            await db.query('DELETE FROM prestamo_componente WHERE id_prestamoC = ?', [id_prestamoC]);

            res.json({ message: 'La solicitud de préstamo ha sido cancelada exitosamente.' });

        } catch (error) {
            console.error("Error al cancelar el préstamo de componente:", error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
);

// PUT para confirmar la devolución de un préstamo (solo admin)
router.put('/return/:id', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]),
    async (req, res) => {
        const { id: id_prestamoC } = req.params;
        const admin = req.user;

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [prestamoRows] = await conn.query('SELECT * FROM prestamo_componente WHERE id_prestamoC = ? FOR UPDATE', [id_prestamoC]);
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
            await conn.query('UPDATE prestamo_componente SET devuelto = 1, fecha_devolucion = NOW() WHERE id_prestamoC = ?', [id_prestamoC]);
            
            //Registra el movimiento en el log
            await conn.query('INSERT INTO log_movimientos (tipo_movimiento, detalle, id_usuario) VALUES (?, ?, ?)',
                ['devolucion', `Devolución confirmada para préstamo ID=${id_prestamoC}`, admin.id_usuario]
            );

            await conn.commit();
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
