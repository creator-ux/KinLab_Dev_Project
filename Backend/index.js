const express = require('express');
const cors = require('cors');
require('dotenv').config({ quiet: true });
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const sse = require('./sse');

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: corsOrigin }));
app.use(helmet());
// Rate limit básico para peticiones anónimas. Saltamos el límite si hay token Bearer
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const auth = req.headers['authorization'];
    return Boolean(auth && auth.startsWith('Bearer '));
  }
});
app.use(limiter);
app.use(express.json());

//Ruta de login
app.use('/api/login', require('./routes/login'));

//Rutas de usuarios
app.use ('/api/users', require('./routes/users'));

//Rutas de permisos
app.use('/api/permissions', require('./routes/permissions'));

//RUtas de categorias
app.use ('/api/category', require ('./routes/category'));

//Rutas de subcategorias
app.use ('/api/subcategory', require('./routes/subcategory'));

//Rutas de laboratorios
app.use ('/api/laboratory', require('./routes/laboratory'));

//Rutas de equipos
app.use ('/api/equipment', require('./routes/equipment'));

//Rutas de componentes
app.use ('/api/component', require('./routes/components'));

//rutas de prestamo de componentes
app.use ('/api/loansComponents', require('./routes/loansComponents'));

//rutas de prestamo de equipos
app.use ('/api/loansEquipment', require('./routes/loansEquipments'));

//rutas de incidentes
app.use ('/api/incidents', require('./routes/incidents'));

//
app.use('/api/images', require('./routes/images'));

//ruta para Longs
app.use('/api/reportes', require('./routes/logMov'));

// Canal de eventos en tiempo real (SSE)
app.get('/api/events', sse.register);

//Inicio del servico
app.listen(port, () => {
        console.log(`Servidor corriendo en http://localhost:${port}`);
    }
);
