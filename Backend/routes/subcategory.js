const express = require('express');
const router = express.Router();
const db = require ('../db');
const {checkPermissions} = require('../middlewares/auth');

//petición GET
router.get('/', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]),

    async (req, res) => {
        try {
            const [rows] = await db.query('SELECT id_subcategoria, nombre_subcategoria FROM subcategorias ORDER BY nombre_subcategoria ASC');
            res.json(rows);
        } catch (error) {
            console.error('Error al obtener las subcategorías:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
);

//peticion POST
router.post('/', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]),
    async (req, res) => {
        try{
            const {nombre_subcategoria, id_categoria} = req.body;
            if (!nombre_subcategoria || !id_categoria) {
                return res.status(400).json({ error: 'Nombre y categoría son requeridos' });
            }

            const [result] = await db.query('INSERT INTO subcategorias (nombre_subcategoria, id_categoria) VALUES (?, ?)'
                , [nombre_subcategoria, id_categoria]);
                res.status(201).json({ id_subcategoria: result.insertId, nombre_subcategoria, id_categoria });
        } catch (error) {
            console.error (error)
            res.status(500).json({error: 'No se pudo crear la subcategoria'})
        }
    }
);

module.exports = router;