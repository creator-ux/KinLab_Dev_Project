const express = require('express');
const router = express.Router();
const db = require('../db');
const { checkPermissions } = require('../middlewares/auth');

//get  checkRole(['administrador']),
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
            // Usuarios pueden ver sus propios incidentes (cualquier nivel)
            { tipo: 'usuario', nivel: '*' },
        ]
    ),

    async (req, res) => {
        try{
            const user = req.user;
            // Diagnóstico: registrar usuario y flujo
            console.log('[incidents] GET called by', { id_usuario: user.id_usuario, tipo: user.tipo, nivel: user.nivel });

            // Admin global: ve todos los incidentes
            if (user.tipo === 'administrador' && user.nivel === 0) {
                console.log('[incidents] Branch: admin nivel 0 (global)');
                const [rows] = await db.query(
                    `SELECT 
                        i.id_incidente,
                        i.titulo,
                        i.descripcion,
                        i.fecha_reporte,
                        i.estado,
                        i.id_laboratorio,
                        CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno) AS nombre_usuario,
                        COALESCE(e.nombre_equipo, c.nombre_componente) AS item_afectado
                    FROM incidentes i
                    LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
                    LEFT JOIN equipos e ON i.id_equipo = e.id_equipo
                    LEFT JOIN componentes c ON i.id_componente = c.id_componente
                    ORDER BY i.fecha_reporte DESC`
                );
                console.log('[incidents] Rows found (admin 0):', rows.length);
                return res.json(rows);
            }

            // Admin de laboratorio: limitar a sus laboratorios y siempre incluir los que él reportó
            if (user.tipo === 'administrador' && user.nivel !== 0) {
                const [labs] = await db.query('SELECT id_laboratorio FROM laboratorios WHERE id_usuario_encargado = ?', [user.id_usuario]);
                const labIds = labs.map(l => l.id_laboratorio);
                console.log('[incidents] Branch: admin nivel 1+; labIds:', labIds);

                // Sin laboratorios asignados: no debe visualizar incidentes
                if (labIds.length === 0) {
                    console.log('[incidents] No labs assigned; returning empty list for admin nivel 1');
                    return res.json([]);
                }

                const placeholders = labIds.map(() => '?').join(',');

                const [rows] = await db.query(
                    `SELECT 
                        i.id_incidente,
                        i.titulo,
                        i.descripcion,
                        i.fecha_reporte,
                        i.estado,
                        COALESCE(i.id_laboratorio, e.id_laboratorio, cat.id_laboratorio) AS id_laboratorio,
                        CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno) AS nombre_usuario,
                        COALESCE(e.nombre_equipo, c.nombre_componente) AS item_afectado
                    FROM incidentes i
                    LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
                    LEFT JOIN equipos e ON i.id_equipo = e.id_equipo
                    LEFT JOIN componentes c ON i.id_componente = c.id_componente
                    LEFT JOIN subcategorias s ON c.id_subcategoria = s.id_subcategoria
                    LEFT JOIN categorias cat ON s.id_categoria = cat.id_categoria
                    WHERE COALESCE(i.id_laboratorio, e.id_laboratorio, cat.id_laboratorio) IN (${placeholders})
                    ORDER BY i.fecha_reporte DESC`,
                    labIds
                );
                console.log('[incidents] Rows found (labs only):', rows.length, 'labIds:', labIds);
                return res.json(rows);
            }

            // Usuario solicitante: sólo ver sus propios incidentes
            if (user.tipo === 'usuario') {
                console.log('[incidents] Branch: usuario; fetching own incidents');
                const [rows] = await db.query(
                    `SELECT 
                        i.id_incidente,
                        i.titulo,
                        i.descripcion,
                        i.fecha_reporte,
                        i.estado,
                        i.id_laboratorio,
                        CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno) AS nombre_usuario,
                        COALESCE(e.nombre_equipo, c.nombre_componente) AS item_afectado
                    FROM incidentes i
                    LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
                    LEFT JOIN equipos e ON i.id_equipo = e.id_equipo
                    LEFT JOIN componentes c ON i.id_componente = c.id_componente
                    WHERE i.id_usuario = ?
                    ORDER BY i.fecha_reporte DESC`,
                    [user.id_usuario]
                );
                console.log('[incidents] Rows found (usuario own):', rows.length);
                return res.json(rows);
            }

            console.log('[incidents] No matching branch for user; returning empty array');
            return res.json([]);

        } catch (error){
            console.error('Error al obtener los incidentes', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
);

//post admin y usuario
router.post('/', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 },
            { tipo: 'administrador', nivel: 1 },
            
            //Se agrego al usuario ya que si sufren algun daño
            //de igual manera se le puede reportar al adminstrador
            //antes de su entrega
            { tipo: 'usuario', nivel: 0},
        ]
    ),

    async(req, res) => {
        try{
            const { titulo, descripcion, id_laboratorio, id_equipo, id_componente, accion_tomada } = req.body;
            const user = req.user;

            const [result] = await db.query(
                'INSERT INTO incidentes (titulo, descripcion, id_laboratorio, id_equipo, id_componente, id_usuario, accion_tomada) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [titulo, descripcion, id_laboratorio, id_equipo, id_componente, user.id_usuario, accion_tomada || null]
            );

            await db.query('INSERT INTO log_movimientos (tipo_movimiento, detalle, id_usuario) VALUES (?, ?, ?)',
                ['incidente', `Incidente ID=${result.insertId} reportado`, user.id_usuario]
            );

            res.json({ id: result.insertId });

        } catch (error){
            console.error('Error al registrar incidente:', error);
            res.status(500).json({ message: 'Error en el servidor al registrar el incidente' });
        }
    }
);

//Put actualizar admin  checkRole(['administrador']),
router.put('/:id', 
    checkPermissions(
        [ 
            { tipo: 'administrador', nivel: 0 },
            { tipo: 'administrador', nivel: 1 },
        ]
    ),

    async (req, res) => {
        try{
            const {estado, accion_tomada} = req.body;
            const { id } = req.params;

            await db.query('UPDATE incidentes SET estado=?, accion_tomada=? WHERE id_incidente=?',
                [estado, accion_tomada, id]);

            res.json({message: 'Incidente actualizado'});

        } catch (error){
            console.error('Error al actualizar el incidente:', error);
            res.status(500).json({message: 'Error en el servidor al actualizar el incidente'});
        }
    }
);

//Delete de incidente admin  checkRole(['administrador']),
router.delete('/:id', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 },
            { tipo: 'administrador', nivel: 1 },
            //
            { tipo: 'usuario', nivel: 0 },
        ]
    ),
    async (req, res) => {
        try{
            const { id } = req.params;
            await db.query('DELETE FROM incidentes WHERE id_incidente=?', [id]);

            res.json({message: 'Incidente eliminado'});

        } catch (error){
            console.error('Error al eliminar incidente:', error);
            res.status(500).json({message: 'Error en el servidor al eliminar el incidente'});
        }
    }
);

module.exports = router;
