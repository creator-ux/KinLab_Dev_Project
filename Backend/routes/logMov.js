const express = require('express');
const router = express.Router();
const db = require('../db');
const {checkPermissions} = require ('../middlewares/auth');

//peteción GET
router.get('/', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]),
    async (req, res) => {
        try{
            const query = 
           `SELECT 
                l.id_log,
                l.tipo_movimiento,
                l.detalle,
                l.fecha,
                u.nombre AS nombre_usuario
            FROM log_movimientos l
            LEFT JOIN usuarios u ON l.id_usuario = u.id_usuario
            ORDER BY l.fecha DESC`;

            const [rows] = await db.query(query);
            res.json(rows);

        } catch (error){
            console.error('Error al obtener el historial de movimientos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
);

module.exports = router;


