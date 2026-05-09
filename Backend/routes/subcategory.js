const express = require('express');
const router = express.Router();
const db = require ('../db');
const {checkPermissions} = require('../middlewares/auth');

//petición GET
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
        ]
    ),

    async (req, res) => {
        try {
            const user = req.user;

            // Admin global: todas las subcategorías
            if (user.tipo === 'administrador' && user.nivel === 0) {
                const [rows] = await db.query('SELECT id_subcategoria, nombre_subcategoria FROM subcategorias ORDER BY nombre_subcategoria ASC');
                return res.json(rows);
            }

            // Admin de laboratorio: subcategorías de categorías dentro de sus laboratorios
            if (user.tipo === 'administrador' && user.nivel !== 0) {
                const [labs] = await db.query('SELECT id_laboratorio FROM laboratorios WHERE id_usuario_encargado = ?', [user.id_usuario]);
                const labIds = labs.map(l => l.id_laboratorio);
                if (labIds.length === 0) return res.json([]);
                const placeholders = labIds.map(() => '?').join(',');

                const [rows] = await db.query(
                    `SELECT s.id_subcategoria, s.nombre_subcategoria
                     FROM subcategorias s
                     JOIN categorias c ON s.id_categoria = c.id_categoria
                     WHERE c.id_laboratorio IN (${placeholders})
                     ORDER BY s.nombre_subcategoria ASC`,
                    labIds
                );
                return res.json(rows);
            }

            return res.json([]);
        } catch (error) {
            console.error('Error al obtener las subcategorías:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
);

//peticion POST
router.post('/', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 },
            { tipo: 'administrador', nivel: 1 },
        ]
    ),

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
