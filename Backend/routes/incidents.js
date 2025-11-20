const express = require('express');
const router = express.Router();
const db = require('../db');
const { checkPermissions } = require('../middlewares/auth');

//get  checkRole(['administrador']),
router.get('/', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]),
    async (req, res) => {
        try{
            const query =
            `SELECT 
                i.id_incidente,
                i.titulo,
                i.descripcion,
                i.fecha_reporte,
                i.estado,
                CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno) AS nombre_usuario,
                COALESCE(e.nombre_equipo, c.nombre_componente) AS item_afectado
            FROM incidentes i
            LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
            LEFT JOIN equipos e ON i.id_equipo = e.id_equipo
            LEFT JOIN componentes c ON i.id_componente = c.id_componente
            ORDER BY i.fecha_reporte DESC`;
            const [rows] = await db.query(query);
            res.json(rows);

        } catch (error){
            console.error('Error al obtener los incidentes', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
);

//post admin y usuario
router.post('/', checkPermissions([ { tipo: 'administrador', nivel: 0 }, { tipo: 'usuario', nivel: 0} ]),
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
router.put('/:id', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]),
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
router.delete('/:id', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]),
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