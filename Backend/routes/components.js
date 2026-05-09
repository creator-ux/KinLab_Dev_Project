const express = require('express');
const router = express.Router();
const db = require ('../db');
const {checkPermissions} = require ('../middlewares/auth');


//pedido GET de todos los componentes checkRole(['administrador']),
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

            //Usuarios solicitantes mantienen comportamiento original por ahora
            { tipo: 'usuario', nivel: 0},
        ]
    ),

    async (req, res) => {
        try{
            const user = req.user;

            // Admin nivel 0: ve todos los componentes
            if (user.tipo === 'administrador' && user.nivel === 0) {
                const [rows] = await db.query('SELECT * FROM componentes');
                return res.json(rows);
            }

            // Admin de laboratorio (nivel != 0): filtra por laboratorio asignado
            if (user.tipo === 'administrador' && user.nivel !== 0) {
                // Buscar laboratorio(s) donde es encargado
                const [labs] = await db.query('SELECT id_laboratorio FROM laboratorios WHERE id_usuario_encargado = ?', [user.id_usuario]);
                const labIds = labs.map(l => l.id_laboratorio);

                if (labIds.length === 0) {
                    // Sin laboratorios asignados: no debe visualizar componentes
                    return res.json([]);
                }

                const placeholders = labIds.map(() => '?').join(',');
                // Filtrar componentes por laboratorio mediante joins a subcategorías y categorías
                const [rows] = await db.query(
                    `SELECT comp.*
                     FROM componentes comp
                     JOIN subcategorias s ON comp.id_subcategoria = s.id_subcategoria
                     JOIN categorias c ON s.id_categoria = c.id_categoria
                     WHERE c.id_laboratorio IN (${placeholders})`,
                    labIds
                );
                return res.json(rows);
            }

            // Usuarios (solicitantes) u otros: por ahora mostramos todos
            const [rows] = await db.query('SELECT * FROM componentes');
            return res.json(rows);
        }catch (error){
            console.error(error);
            return res.status(500).json({message: 'Error al obtener los componentes'});
        }
    }
);

//POST para crear checkRole(['administrador']),
router.post('/', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 },
            { tipo: 'administrador', nivel: 1 },
        ]
    ),

    async (req, res) => {
        try{
            const {nombre_componente, cantidad, descripcion, estado, id_imagen, id_subcategoria} = req.body;
            const user = req.user; // Usuario autenticado que realiza la acción

            if (!nombre_componente || !id_subcategoria){
                return res.status(400).json({message: 'Se requiere el nombre del componente'});
            }
            const [result] = await db.query(
            'INSERT INTO componentes (nombre_componente, cantidad, descripcion, estado, id_imagen, id_subcategoria) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre_componente, cantidad || 0, descripcion || null, estado || 'disponible', id_imagen || null, id_subcategoria || null]
            );

            // Registrar en el historial con el usuario que agregó el componente
            try {
                const actorId = Number(user.id_usuario);
                await db.query(
                    'INSERT INTO log_movimientos (tipo_movimiento, detalle, id_usuario) VALUES (?, ?, ?)',
                    [
                        'alta_componente',
                        `Nuevo componente agregado ID=${result.insertId}, cantidad=${cantidad || 0}`,
                        actorId
                    ]
                );
            } catch (logErr) {
                // No interrumpe la creación si falla el log; solo se reporta en servidor
                console.error('No se pudo registrar el movimiento de alta de componente:', logErr);
            }

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
router.put('/:id', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 },
            { tipo: 'administrador', nivel: 1 },

        ]
    ),

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
router.delete('/:id', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 }, 
            { tipo: 'administrador', nivel: 1 },
        ]
    ),

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
