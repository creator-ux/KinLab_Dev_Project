const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const { checkPermissions } = require('../middlewares/auth');

// Configuración de Multer para guardar la imagen en la memoria RAM del servidor
// Esto es bueno para luego guardarla como MEDIUMBLOB en la base de datos.
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB como maximo de peso en imagenes
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Formato de imagen no permitido. Solo JPG o PNG'));
  }
});

// POST para subir una nueva imagen
// La ruta escuchará en '/api/imagenes/'
// 'upload.single('imagen')' le dice a multer que esperamos un solo archivo en un campo llamado 'imagen'.
router.post('/', 
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
        ]
    ), 
    upload.single('imagen'),

    async (req, res) => {
        try {
            // req.file es donde multer pone la información del archivo subido.
            if (!req.file) {
                return res.status(400).json({ message: 'No se subió ningún archivo.' });
            }

            // El buffer contiene los datos binarios de la imagen.
            const imagenBuffer = req.file.buffer;

            // Insertamos el buffer en la columna BLOB de la base de datos.
            const [result] = await db.query(
                'INSERT INTO imagenes (imagen) VALUES (?)',
                [imagenBuffer]
            );

            // Devolvemos el ID de la imagen recién creada.
            res.status(201).json({ id_imagen: result.insertId });

        } catch (error) {
            console.error('Error al subir la imagen:', error);
            const status = error.message?.includes('Formato de imagen') ? 400 : 500;
            res.status(status).json({ message: error.message || 'Error interno al guardar la imagen.' });
        }
    }
);

// GET para obtener una imagen por su ID
router.get('/:id',
    checkPermissions(
        [
            //En este apartado se agrega los niveles de los administradores segun sea el caso
            //y los que pueden existir
            //en dado caso de si a futuro desean usar el sistema para la gestión de los 
            //demás laboratirios
            { tipo: 'administrador', nivel: 0 },
            { tipo: 'administrador', nivel: 1 },
        ]
    ),
    
    async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.query('SELECT imagen FROM imagenes WHERE id_imagen = ?', [id]);

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Imagen no encontrada.' });
            }

            const imagenBuffer = rows[0].imagen;

            // Enviamos la imagen de vuelta al navegador.
            // Es importante establecer el tipo de contenido para que el navegador sepa que es una imagen.
            res.setHeader('Content-Type', 'image/jpeg'); // O 'image/png', etc.
            res.send(imagenBuffer);

        } catch (error) {
            console.error('Error al obtener la imagen:', error);
            res.status(500).json({ message: 'Error interno al obtener la imagen.' });
        }
    }
);


module.exports = router;