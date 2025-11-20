const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/', 
    async (req, res) => {
        const {correo, contrasena} = req.body;

        try{
                const query = `SELECT u.*, p.tipo, p.nivel FROM usuarios u JOIN permisos p ON u.id_permiso = p.id_permiso WHERE u.correo = ?`;
                const [users] = await db.query(query, [correo]);
                
                if (users.length === 0) {
                    return res.status(401).json({ error: "Correo incorrecto" });
            }

            const user = users[0];
            
            // ests linea de código compara la contraseña con la hasheada en la base de datos lol
            const passwordMatch = await bcrypt.compare(contrasena, user.contrasena);

                if (!passwordMatch) {
                    return res.status(401).json({ error: "Contraseña incorrecta" });
            }

            const token = jwt.sign(
                {
                    id_usuario: user.id_usuario,
                    nombre: user.nombre,
                    tipo: user.tipo,
                    nivel: user.nivel
                },
                process.env.JWT_SECRET || 'dev_secret',
                { expiresIn: '8h' }
            );

            res.json({
                message: "Login exitoso",
                token,
                user: {
                    id_usuario: user.id_usuario,
                    nombre: user.nombre,
                    tipo: user.tipo,
                    nivel: user.nivel
                }
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message });}
    }

);
module.exports = router;
