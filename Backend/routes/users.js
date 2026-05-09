//Este codigo es del crud para el admin

const express = require('express');
const router = express.Router(); 
const db = require('../db');
const bcrypt = require('bcrypt');
const { checkPermissions } = require('../middlewares/auth');

// Pedido GET de los usuarios (incluye tipo y nivel desde permisos)
router.get('/', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: '*' }
        ]
    ),

    async (req, res) => {
        try{
            const query = `
                SELECT u.*, p.tipo, p.nivel
                FROM usuarios u
                JOIN permisos p ON u.id_permiso = p.id_permiso
            `;
            const [rows] = await db.query(query);
            res.json(rows);
        } catch (error){
            console.error('Error al obtener usuarios', error);
            res.status(500).json({message: 'Error en el servidor'});
        }
    }
);

// POST para crear a los usuarios (sólo admin nivel 0; extensible por nivel)
router.post('/', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 }
        ]
    ),

    async (req, res) => {
        try{
            const {nombre, apellido_paterno, apellido_materno, tipo, id_permiso, matricula, 
                correo, telefono, contrasena} = req.body;

            // Resolver permiso: si viene id_permiso, validar; si no, mapear por tipo (usa el de menor nivel)
            let permisoId = id_permiso;
            if (permisoId) {
                const [exists] = await db.query('SELECT 1 FROM permisos WHERE id_permiso = ?', [permisoId]);
                if (!exists || exists.length === 0) {
                    return res.status(400).json({ message: 'id_permiso no existe en la tabla permisos.' });
                }
            } else {
                // Validar tipos permitidos: solo 'administrador' y 'usuario'
                const ALLOWED_TYPES = ['administrador', 'usuario'];
                if (!tipo || !ALLOWED_TYPES.includes(tipo)) {
                    return res.status(400).json({ message: 'Tipo de usuario inválido. Solo se permite "administrador" o "usuario".' });
                }
                const [permRows] = await db.query('SELECT id_permiso FROM permisos WHERE tipo = ? ORDER BY nivel ASC LIMIT 1', [tipo]);
                if (!permRows || permRows.length === 0) {
                    return res.status(400).json({ message: 'Tipo de usuario inválido' });
                }
                permisoId = permRows[0].id_permiso;
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

            const safeMatricula = (!matricula || matricula.trim() === '') ? null : matricula;
            
            const insertQuery = `
                INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, matricula, correo, telefono, contrasena, id_permiso)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.query(insertQuery,
                [nombre, apellido_paterno, apellido_materno, safeMatricula, correo, telefono, hashedPassword, permisoId]
            );

            res.status(201).json({ id: result.insertId });
        } catch (error){
            console.error('Error al crear usuario:', error);
            res.status(500).json({message: 'Error en el servidor'});
        }

    }
);

// PUT para la actualización (acepta id_permiso o mapea por tipo)
router.put('/:id', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: '*' }
        ]
    ),

    async (req, res) => {
        try{
            const {id} = req.params;
            const {nombre, apellido_paterno, apellido_materno, tipo, id_permiso,
                   matricula, correo, telefono, contrasena} = req.body;

            // Construir partes del UPDATE dinámicamente
            const fields = ['nombre = ?', 'apellido_paterno = ?', 'apellido_materno = ?', 'matricula = ?', 'correo = ?', 'telefono = ?'];
            const params = [nombre, apellido_paterno, apellido_materno, matricula, correo, telefono];

            if (contrasena && contrasena.trim() !== '') {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
                fields.push('contrasena = ?');
                params.push(hashedPassword);
            }

            // Resolver id_permiso: prioridad a id_permiso directo; si no, mapear por tipo (usa el de menor nivel)
            if (id_permiso) {
                const [exists] = await db.query('SELECT 1 FROM permisos WHERE id_permiso = ?', [id_permiso]);
                if (!exists || exists.length === 0) {
                    return res.status(400).json({ message: 'id_permiso no existe en la tabla permisos.' });
                }
                fields.push('id_permiso = ?');
                params.push(id_permiso);
            } else if (tipo && tipo.trim() !== '') {
                const ALLOWED_TYPES = ['administrador', 'usuario'];
                if (!ALLOWED_TYPES.includes(tipo)) {
                    return res.status(400).json({ message: 'Tipo de usuario inválido' });
                }
                const [permRows] = await db.query('SELECT id_permiso FROM permisos WHERE tipo = ? ORDER BY nivel ASC LIMIT 1', [tipo]);
                if (!permRows || permRows.length === 0) {
                    return res.status(400).json({ message: 'Tipo de usuario inválido' });
                }
                fields.push('id_permiso = ?');
                params.push(permRows[0].id_permiso);
            }

            // Nota: no actualizamos 'nivel' por usuario en este modo revertido

            params.push(id);
            const query = `UPDATE usuarios SET ${fields.join(', ')} WHERE id_usuario = ?`;
            await db.query(query, params);

            res.json({message: 'usuario actualizado correctamente'});
        }catch (error){
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({message: 'Error en el servidor'});
        }
    }
);


// Eliminar usuarios: sólo administrador de nivel 0
router.delete('/:id', 
    checkPermissions(
        [
            { tipo: 'administrador', nivel: 0 }
        ]
    ),
     
    async (req, res) => {
        try{
            await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [req.params.id]);
            res.json ({message:'Se elimino correctamente'});
        } catch (error){
            console.error('Error al eliminar usuario:', error);
            res.status(500).json({message: 'Error en el servidor'});
        }
    }
);

module.exports = router;
