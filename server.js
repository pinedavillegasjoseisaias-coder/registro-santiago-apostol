/**
 * Servidor Principal - Registro de Datos
 * El Distintivo y Sección Santiago Apóstol Tequixquiac
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');

const { initDB } = require('./db/database');
const apiRoutes = require('./routes/api');

const app = express();

// Configuración de encabezados de seguridad con Helmet
app.use(
  helmet({
    contentSecurityPolicy: false // Permite flexibilidad para recursos e interfaces estáticas
  })
);

// Habilitar CORS
app.use(cors());

// Parseo de cuerpo de solicitudes JSON y URL codificada
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Confiar en el proxy de Render para cookies seguras
app.set('trust proxy', 1);

// Configuración segura de sesiones de Express
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secreto_de_sesion_muy_seguro_2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Evita acceso a cookies desde JavaScript en el cliente
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en entorno de producción
      maxAge: 24 * 60 * 60 * 1000 // Duración máxima de 24 horas en milisegundos
    }
  })
);

// Servir archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Montar las rutas de la API
app.use('/', apiRoutes);

// Puerto del servidor
const PORT = process.env.PORT || 3000;

/**
 * Inicialización asíncrona del servidor
 */
async function startServer() {
  try {
    // 1. Inicializar la base de datos SQLite y sus tablas
    initDB();

    // 2. Hashear la contraseña de administrador y almacenar en app.locals
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const saltRounds = 10;
    const adminPasswordHash = await bcrypt.hash(adminPassword, saltRounds);
    app.locals.adminPasswordHash = adminPasswordHash;

    // 3. Iniciar escucha del servidor HTTP
    app.listen(PORT, () => {
      console.log(`Servidor iniciado exitosamente en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al inicializar el servidor:', error);
    process.exit(1);
  }
}

startServer();
