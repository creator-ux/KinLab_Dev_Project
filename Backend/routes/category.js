const express = require('express');
const router = express.Router();
const db = require('../db')
const {checkPermissions} = require('../middlewares/auth');

//peticion GET
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
        try{
            const user = req.user;

            // Admin global: todas las categorías
            if (user.tipo === 'administrador' && user.nivel === 0) {
                const [rows]  = await db.query('SELECT * FROM categorias ORDER BY nombre_categoria');
                return res.json(rows);
            }

            // Admin de laboratorio: solo categorías de sus laboratorios
            if (user.tipo === 'administrador' && user.nivel !== 0) {
                const [labs] = await db.query('SELECT id_laboratorio FROM laboratorios WHERE id_usuario_encargado = ?', [user.id_usuario]);
                const labIds = labs.map(l => l.id_laboratorio);
                if (labIds.length === 0) return res.json([]);
                const placeholders = labIds.map(() => '?').join(',');

                const [rows] = await db.query(
                    `SELECT * FROM categorias WHERE id_laboratorio IN (${placeholders}) ORDER BY nombre_categoria`,
                    labIds
                );
                return res.json(rows);
            }

            return res.json([]);
        } catch (error){
            console.error(error);
            res.status(500).json({error: 'No se pudo obtener las categorias'});
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
