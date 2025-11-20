const express = require('express');
const router = express.Router();
const db = require ('../db');
const {checkPermissions} = require ('../middlewares/auth');


//pedido GET de todos los componentes checkRole(['administrador']),
router.get('/', checkPermissions([{ tipo: 'administrador', nivel: 0 }]),
    async (req, res) => {
        try{
            const [rows] = await db.query('SELECT * FROM componentes');
            res.json(rows);
        }catch (error){
            console.error(error);
            return res.status(500).json({message: 'Error al obtener los componentes'});
        }
    }
);

//POST para crear checkRole(['administrador']),
router.post('/', checkPermissions([{ tipo: 'administrador', nivel: 0 }]),
    async (req, res) => {
        try{
            const {nombre_componente, cantidad, descripcion, estado, id_imagen, id_subcategoria} = req.body;

            if (!nombre_componente || !id_subcategoria){
                return res.status(400).json({message: 'Se requiere el nombre del componente'});
            }
            const [result] = await db.query(
            'INSERT INTO componentes (nombre_componente, cantidad, descripcion, estado, id_imagen, id_subcategoria) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre_componente, cantidad || 0, descripcion || null, estado || 'disponible', id_imagen || null, id_subcategoria || null]
            );

            res.status(201).json(
                {
                    id: result.insertId,
                    nombre_componente,
                    cantidad,
                    descripcion,
                    estado,
                    id_imagen,
                    id_subcategoria
                }

            );
        }catch (error){
            console.error(error);
            return res.status(500).json({message: 'Error al crear el componente'})
        }
    }
);

// Put para la actualizacion checkRole(['administrador']),
router.put('/:id', checkPermissions([{ tipo: 'administrador', nivel: 0 }]),
    async (req, res) => {
        try{
            const {id} = req.params;
            const {nombre_componente, cantidad, descripcion, estado, id_imagen, id_subcategoria} = req.body;

            const [result] =
            await db.query('UPDATE componentes SET nombre_componente=?, cantidad=?, descripcion=?, estado=?, id_imagen=?, id_subcategoria=? WHERE id_componente=?',
                [nombre_componente, cantidad, descripcion, estado, id_imagen, id_subcategoria, id]);

                if (result.affectedRows ===0){
                    return res.status(404).json({message: 'Error al actualizar el componente'});
                }

             res.json({message: 'Componente actualizado'});

        }catch (error){
            console.error(error);
            return res.status(500).json({message: 'Error al actualizar'});
        }
    }
);

//Delete checkRole(['administrador']),
router.delete('/:id', checkPermissions([{ tipo: 'administrador', nivel: 0 }]),
    async (req,res) => {
        try{
            const {id} = req.params;
            const [result] = await db.query('DELETE FROM componentes WHERE id_componente = ?', [id]);
                
            if (result.affectedRows === 0){
                return res.status(404).json({message: ''});
            }

            res.json({massage: 'componente eliminado'});

        }catch (error){
            console.error(error);
            return res.status(500).json({message: 'Error al eliminar el componente'});
        }
    } 
);

module.exports = router;