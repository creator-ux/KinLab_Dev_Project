const express = require('express');
const router = express.Router();
const db = require('../db');
const {checkPermissions} = require('../middlewares/auth');

//petición GET
router.get('/', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]), 

    async (req, res) => {
        try {
            const [rows] = await db.query('SELECT id_laboratorio, nombre_laboratorio, id_usuario_encargado FROM laboratorios ORDER BY id_laboratorio ASC');
            res.json(rows);
        } catch (error) {
            console.error('Error al obtener los laboratorios:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
);

// peticion POST 
router.post('/', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]), 
    async (req, res) => {
        try {
            const { nombre_laboratorio, id_usuario_encargado } = req.body;
            
            // Verificación: Asegura que el nombre no venga vacío
            if (!nombre_laboratorio) {
                return res.status(400).json({ message: 'El nombre del laboratorio es requerido.' });
            }

            const [result] = await db.query(
                'INSERT INTO laboratorios (nombre_laboratorio, id_usuario_encargado) VALUES (?, ?)', 
                [nombre_laboratorio, id_usuario_encargado ?? null]
            );

            // Devuelve el nuevo laboratorio creado con su ID
            res.status(201).json({ 
                id_laboratorio: result.insertId, 
                nombre_laboratorio,
                id_usuario_encargado: id_usuario_encargado ?? null 
            });

        } catch (error) {
            console.error('Error al crear el laboratorio:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
);

// petición PUT
router.put('/:id', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]), 
    async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre_laboratorio, id_usuario_encargado } = req.body;

            if (!nombre_laboratorio) {
                return res.status(400).json({ message: 'El nombre del laboratorio es requerido.' });
            }

            const [result] = await db.query(
                'UPDATE laboratorios SET nombre_laboratorio = ?, id_usuario_encargado = ? WHERE id_laboratorio = ?',
                [nombre_laboratorio, id_usuario_encargado ?? null, id]
            );

            // Verifica si se actualizó alguna fila. Si no, el ID no existía.
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Laboratorio no encontrado.' });
            }

            res.json({ message: 'Laboratorio actualizado exitosamente.' });

        } catch (error) {
            console.error('Error al actualizar el laboratorio:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
);

//muestra los detalles de loslaboratoiros y sus encargados
router.get('/:id/detalles', checkPermissions([{ tipo: 'administrador', nivel: 0 }]),
    async (req, res) => {
        try {
            const { id } = req.params;

            const [rows] = await db.query(
                `SELECT 
                    l.id_laboratorio,
                    l.nombre_laboratorio,
                    u.id_usuario,
                    u.nombre,
                    u.apellido_paterno,
                    u.apellido_materno
                FROM laboratorios l
                LEFT JOIN usuarios u 
                    ON l.id_usuario_encargado = u.id_usuario
                WHERE l.id_laboratorio = ?
                ORDER BY l.id_laboratorio ASC`,
                [id]
            );

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Laboratorio no encontrado.' });
            }

            res.json(rows[0]);

        } catch (error) {
            console.error('Error al obtener detalles del laboratorio:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
);


// DELETE
router.delete('/:id', checkPermissions([ { tipo: 'administrador', nivel: 0 } ]), 
    async (req, res) => {
        try {
            const { id } = req.params;

            const [result] = await db.query(
                'DELETE FROM laboratorios WHERE id_laboratorio = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Laboratorio no encontrado.' });
            }

            res.json({ message: 'Laboratorio eliminado exitosamente.' });

        } catch (error) {
            console.error('Error al eliminar el laboratorio:', error);
            // Manejo de error específico si el laboratorio no se puede borrar por estar en uso
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ message: 'No se puede eliminar el laboratorio porque está siendo utilizado por equipos o categorías.' });
            }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
);

module.exports = router;