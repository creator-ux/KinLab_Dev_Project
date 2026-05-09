const express = require('express');
const router = express.Router();
const db = require('../db');
const {checkPermissions} = require('../middlewares/auth');

//Get de los equipos ADMIN checkRole(['administrador']),
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
            //Aquí se maneja los usa¿uarios, se agreggo aquí ya que es vital para que los
            //usuarios vean el contenido que desean solicitar
            { tipo: 'usuario', nivel: 0 },
        ]
    ),

    async (req,res) => {
        try{
            const user = req.user; // adjuntado por checkPermissions

            // Admin nivel 0: ve todos los equipos
            if (user.tipo === 'administrador' && user.nivel === 0) {
                const [rows] = await db.query('SELECT * FROM equipos');
                return res.json(rows);
            }

            // Admin de laboratorio (nivel != 0): filtra por laboratorio asignado
            if (user.tipo === 'administrador' && user.nivel !== 0) {
                // Buscar laboratorio(s) donde es encargado
                const [labs] = await db.query('SELECT id_laboratorio FROM laboratorios WHERE id_usuario_encargado = ?', [user.id_usuario]);
                const labIds = labs.map(l => l.id_laboratorio);

                if (labIds.length === 0) {
                    // Sin laboratorios asignados: no debe visualizar equipos
                    return res.json([]);
                }

                const placeholders = labIds.map(() => '?').join(',');
                const [rows] = await db.query(`SELECT * FROM equipos WHERE id_laboratorio IN (${placeholders})`, labIds);
                return res.json(rows);
            }

            // Usuarios (solicitantes) u otros: por ahora mostramos todos (comportamiento original)
            // Si deseas también filtrar por laboratorio para usuarios, cambia esta sección.
            const [rows] = await db.query('SELECT * FROM equipos');
            return res.json(rows);
        }catch (error){
            console.error(error);
            res.status(500).json({ message: 'Error al obtener los equipos' });
        }
    }
);

//Post de los equipos ADMIN checkRole(['administrador']),
router.post('/', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 }, 
            { tipo: 'administrador', nivel: 1 }
        ]
    ),

    async (req,res) => {
        try{
        const {nombre_equipo, descripcion, estado, id_imagen, id_laboratorio, cantidad} = req.body;
        const user = req.user; // Usuario autenticado que realiza la acción

        if (!nombre_equipo || !id_laboratorio) {
            return res.status(400).json({ message: 'El nombre del equipo y el id del laboratorio son requeridos.' });
        }

        const [result] = await db.query ('INSERT INTO equipos (nombre_equipo, cantidad, descripcion, estado, id_imagen, id_laboratorio) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre_equipo, cantidad || 1, descripcion || null, estado || 'disponible', id_imagen || null, id_laboratorio]);

            // Registrar en el historial con el usuario que agregó el equipo
            try {
                const actorId = Number(user.id_usuario);
                await db.query(
                    'INSERT INTO log_movimientos (tipo_movimiento, detalle, id_usuario) VALUES (?, ?, ?)',
                    [
                        'alta_equipo',
                        `Nuevo equipo agregado ID=${result.insertId}, cantidad=${cantidad || 1}`,
                        actorId
                    ]
                );
            } catch (logErr) {
                // No interrumpe la creación si falla el log; solo se reporta en servidor
                console.error('No se pudo registrar el movimiento de alta de equipo:', logErr);
            }

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
router.put('/:id', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 }, 
            { tipo: 'administrador', nivel: 1 }
        ]
    ),

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
router.delete('/:id', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 }, 
            { tipo: 'administrador', nivel: 1 }
        ]
    ),

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
