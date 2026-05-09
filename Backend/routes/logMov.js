const express = require('express');
const router = express.Router();
const db = require('../db');
const {checkPermissions} = require ('../middlewares/auth');

//peteción GET
router.get('/', 
    checkPermissions(
        [
            // Historial visible sólo para administrador de nivel 0
            { tipo: 'administrador', nivel: 0 },

        ]
    ),

    async (req, res) => {
        try{
            const query = 
           `SELECT 
                l.id_log,
                l.tipo_movimiento,
                l.detalle,
                l.fecha,
                -- Construye nombre completo y evita cadena vacía; si no hay nombre, usa 'Usuario <id>'
                COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno)), ''), CONCAT('Usuario ', u.id_usuario)) AS nombre_usuario
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


