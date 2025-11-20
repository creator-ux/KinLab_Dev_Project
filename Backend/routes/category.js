const express = require('express');
const router = express.Router();
const db = require('../db')
const {checkPermissions} = require('../middlewares/auth');

//peticion GET
router.get('/', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]),
    async (req, res) => {
        try{
            const [rows]  = await db.query('SELECT * FROM categorias ORDER BY nombre_categoria');
            res.json(rows);
        } catch (error){
            console.error(error);
            res.status(500).json({error: 'No se pudo obtener las categorias'});
        }
    }
);

//peticion POST
router.post('/', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]),
    async (req, res) => {
        try{
            const {nombre_categoria, id_laboratorio} = req.body;
            if (!nombre_categoria || !id_laboratorio) {
                return res.status(400).json({ error: 'Nombre y laboratorio son requeridos' });
            }

            const [result] = await db.query('INSERT INTO categorias (nombre_categoria, id_laboratorio) VALUES (?, ?)'
                , [nombre_categoria, id_laboratorio]);
                res.status(201).json({ id_categoria: result.insertId, nombre_categoria, id_laboratorio });
        } catch (error) {
            console.error (error);
            res.status(500).json({error: 'No se pudo crear la categoria'})
        }
    }
);

module.exports = router;