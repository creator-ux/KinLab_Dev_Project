//La conexión a la base de datos
const mysql2 = require('mysql2/promise');
require('dotenv').config();

const db = mysql2.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3307,
    database: process.env.DB_NAME || 'laboratorios_db2',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mau2508',
    waitForConnections: true,
    connectionLimit: process.env.DB_CONN_LIMIT ? Number(process.env.DB_CONN_LIMIT) : 15,
    queueLimit: 0,
    acquireTimeout: 60000
});

module.exports = db;