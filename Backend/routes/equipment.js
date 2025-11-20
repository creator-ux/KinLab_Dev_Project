const express = require('express');
const router = express.Router();
const db = require('../db');
const {checkPermissions} = require('../middlewares/auth');

//Get de los equipos ADMIN checkRole(['administrador']),
router.get('/', checkPermissions([{ tipo: 'administrador', nivel: 0 }]),
    async (req,res) => {
        try{
            const [rows] = await db.query('SELECT * FROM equipos');
            res.json(rows);
        }catch (error){
            console.error(error);
            res.status(500).json({ message: 'Error al obtener los equipos' });
        }
    }
);

//Post de los equipos ADMIN checkRole(['administrador']),
router.post('/', checkPermissions([{ tipo: 'administrador', nivel: 0 }]),
    async (req,res) => {
        try{
        const {nombre_equipo, descripcion, estado, id_imagen, id_laboratorio, cantidad} = req.body;

        if (!nombre_equipo || !id_laboratorio) {
            return res.status(400).json({ message: 'El nombre del equipo y el id del laboratorio son requeridos.' });
        }

        const [result] = await db.query ('INSERT INTO equipos (nombre_equipo, cantidad, descripcion, estado, id_imagen, id_laboratorio) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre_equipo, cantidad || 1, descripcion || null, estado || 'disponible', id_imagen || null, id_laboratorio]);

            res.status(201).json(
                {
                    id: result.insertId,
                    nombre_equipo,
                    cantidad,
                    descripcion,
                    estado,
                    id_imagen,
                    id_laboratorio,
                    
                }
            );
        }catch (error){
            console.error(error);
            res.status(500).json({message: 'Error al crear el equipo'})
        }
    }
);

//Put para actualizar los equipos  checkRole(['administrador']),
router.put('/:id', checkPermissions([{ tipo: 'administrador', nivel: 0 }]),
    async (req, res) => {
        try{
            const {id} = req.params;
            const {nombre_equipo, cantidad, descripcion, estado, id_imagen, id_laboratorio} = req.body;

            const [result] = 
            await db.query('UPDATE equipos SET nombre_equipo = ?, cantidad = ?, descripcion = ?, estado = ?, id_imagen = ?, id_laboratorio = ? WHERE id_equipo = ?',
            [nombre_equipo, cantidad, descripcion, estado, id_imagen, id_laboratorio, id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({message:'Equipo no encontrado'});
            }

            res.json({message: 'Equipo actualizado'});

        }catch (error) {
            console.error(error);
            return res.status(500).json({message: 'Hubo un error al actualizar'});
        }
    }
);

//Delete de los equipos checkRole(['administrador']),
router.delete('/:id', checkPermissions([{ tipo: 'administrador', nivel: 0 }]),
    async (req, res) => {
        try{
            const {id} = req.params;
            const [result] =
            await db.query('DELETE FROM equipos WHERE id_equipo=?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({message: 'Equipo no encontrado'});
            }

                res.json({message: 'Equipos eliminado'});
        }catch (error){
            console.error(error);
            return res.status(500).json({message:'Error al eliminar'});
        }
    }
);

module.exports = router;
