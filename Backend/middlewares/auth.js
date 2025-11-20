// middlewares/auth.js
const jwt = require('jsonwebtoken');

function getUserFromRequest(req) {
    try {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
            // El payload puede ser el usuario directo o contenerlo en 'user'
            return payload.user ? payload.user : payload;
        }
        // Compatibilidad temporal: usar x-user-info si existe
        const userHeader = req.headers['x-user-info'];
        if (userHeader) {
            return JSON.parse(userHeader);
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Middleware para verificar permisos basados en TIPO y NIVEL.
 *
 * @param {Array<Object>} allowedPermissions - Un array de objetos con {tipo, nivel} permitidos.
 * Ejemplo: checkPermissions([ { tipo: 'administrador', nivel: 0 } ])
 * Ejemplo: checkPermissions([ { tipo: 'administrador', nivel: 1 }, { tipo: 'usuario', nivel: 1 } ])
 */
function checkPermissions(allowedPermissions) {
    return (req, res, next) => {
        try {
            const user = getUserFromRequest(req);
            if (!user) {
                return res.status(401).json({ error: 'Fallo la autenticación' });
            }

            // Verificamos que el usuario tenga 'tipo' y 'nivel'
            if (typeof user.tipo === 'undefined' || typeof user.nivel === 'undefined') {
                return res.status(403).json({ error: 'Información de usuario incompleta' });
            }

            // Comprobamos si la combinación TIPO/NIVEL del usuario está en la lista de permitidos
            // Soportamos comodín de nivel: nivel === '*' o nivel nulo/indefinido implica "cualquier nivel".
            const hasPermission = allowedPermissions.some((permiso) => {
                const tipoMatch = permiso.tipo === user.tipo;
                const nivelPermitido = permiso.nivel;
                const nivelMatch = nivelPermitido === '*' || nivelPermitido == null || nivelPermitido === user.nivel;
                return tipoMatch && nivelMatch;
            });

            if (hasPermission) {
                req.user = user;
                next();
            } else {
                return res.status(403).json({ error: 'No autorizado' });
            }

        } catch (error) {
            return res.status(401).json({ error: 'Fallo autenticación (token inválido)' });
        }
    }
}

module.exports = { checkPermissions };