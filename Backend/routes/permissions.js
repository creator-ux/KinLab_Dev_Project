const express = require('express');
const router = express.Router();
const db = require('../db');
const { checkPermissions } = require('../middlewares/auth');

// --- GET TODOS LOS PERMISOS ---
router.get('/', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 }
        ]
    ),

    async (req, res) => {
        try {
            const [rows] = await db.query('SELECT * FROM permisos ORDER BY tipo, nivel');
            res.json(rows);
        } catch (error) {
            console.error('Error al obtener permisos:', error);
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }
);

// --- POST ---
router.post('/', 
    checkPermissions(
        
        [
            { tipo: 'administrador', nivel: 0 }
        ]
    ),

    async (req, res) => {
        try {
            const { tipo, nivel } = req.body;

            // Validación de entrada
            if (!tipo || nivel === undefined) {
                return res.status(400).json({ message: 'Los campos "tipo" y "nivel" son requeridos.' });
            }
            
            if (typeof nivel !== 'number') {
                return res.status(400).json({ message: 'El campo "nivel" debe ser un número.' });
            }

            const [result] = await db.query(
                'INSERT INTO permisos (tipo, nivel) VALUES (?, ?)',
                [tipo, nivel]
            );

            res.status(201).json({ 
                id_permiso: result.insertId, 
                tipo, 
                nivel 
            });

        } catch (error) {
            console.error('Error al crear permiso:', error);
            // Manejar error si el 'tipo' es UNIQUE y ya existe
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Ese tipo de permiso ya existe.' });
            }
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }
);

// --- PUT ---
router.put('/:id', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 }
        ]
    ),

    async (req, res) => {
        try {
            const { id } = req.params;
            const { tipo, nivel } = req.body;

            // Validación de entrada
            if (!tipo || nivel === undefined) {
                return res.status(400).json({ message: 'Los campos "tipo" y "nivel" son requeridos.' });
            }
            if (typeof nivel !== 'number') {
                return res.status(400).json({ message: 'El campo "nivel" debe ser un número.' });
            }

            const [result] = await db.query(
                'UPDATE permisos SET tipo = ?, nivel = ? WHERE id_permiso = ?',
                [tipo, nivel, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Permiso no encontrado.' });
            }

            res.json({ message: 'Permiso actualizado correctamente' });
        } catch (error) {
            console.error('Error al actualizar permiso:', error);
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }
);

// --- DELETE ---
router.delete('/:id', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 }
        ]
    ),
     
    async (req, res) => {
        try {
            const { id } = req.params;

            const [result] = await db.query(
                'DELETE FROM permisos WHERE id_permiso = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Permiso no encontrado.' });
            }

            res.json({ message: 'Permiso eliminado correctamente' });
        } catch (error) {
            console.error('Error al eliminar permiso:', error);
            // Manejar error si el permiso está en uso (ej. por usuarios)
            // ER_ROW_IS_REFERENCED_2 es el código de error para FK constraint
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ message: 'No se puede eliminar este permiso porque está asignado a uno o más usuarios.' });
            }
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }
);

module.exports = router;