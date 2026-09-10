/**
 * Rutas de la API para el Registro de Datos
 * Endpoints públicos y protegidos para administración.
 */

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const { getDB, encrypt, decrypt } = require('../db/database');
const { requireAdmin } = require('./auth');

/**
 * Función auxiliar para validar y descomponer una fecha en formato AAAA-MM-DD.
 * @param {string} fechaStr
 * @returns {object|null}
 */
function parsearFecha(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return null;
  const limpia = fechaStr.trim().slice(0, 10);
  const match = limpia.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const anio = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  const dia = parseInt(match[3], 10);

  if (mes < 1 || mes > 12) return null;

  const dateObj = new Date(anio, mes - 1, dia);
  if (
    dateObj.getFullYear() !== anio ||
    dateObj.getMonth() + 1 !== mes ||
    dateObj.getDate() !== dia
  ) {
    return null;
  }

  return { anio, mes, dia, dateObj, normalizada: limpia };
}

/**
 * POST /api/registros
 * Registra un nuevo miembro con validaciones del lado del servidor y cifrado de datos sensibles.
 */
router.post('/api/registros', (req, res) => {
  try {
    const {
      nombre_completo,
      fecha_nacimiento,
      fecha_ingreso,
      celular,
      telefono_emergencia
    } = req.body;

    const errores = [];

    // 1. Validación de nombre_completo: obligatorio, mínimo 3 caracteres, trim
    const nombreLimpio = typeof nombre_completo === 'string' ? nombre_completo.trim() : '';
    if (!nombreLimpio) {
      errores.push('El nombre completo es obligatorio.');
    } else if (nombreLimpio.length < 3) {
      errores.push('El nombre completo debe tener al menos 3 caracteres.');
    }

    // Fecha actual a medianoche para comparaciones
    const hoy = new Date();
    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    // 2. Validación de fecha_nacimiento: obligatoria, válida, no futura, no anterior a 1920
    const fechaNacParsed = parsearFecha(fecha_nacimiento);
    if (!fecha_nacimiento) {
      errores.push('La fecha de nacimiento es obligatoria.');
    } else if (!fechaNacParsed) {
      errores.push('La fecha de nacimiento debe ser una fecha válida en formato AAAA-MM-DD.');
    } else {
      if (fechaNacParsed.dateObj > hoySinHora) {
        errores.push('La fecha de nacimiento no puede ser futura.');
      } else if (fechaNacParsed.anio < 1920) {
        errores.push('La fecha de nacimiento no puede ser anterior al año 1920.');
      }
    }

    // 3. Validación de fecha_ingreso: obligatoria, válida, no futura
    const fechaIngParsed = parsearFecha(fecha_ingreso);
    if (!fecha_ingreso) {
      errores.push('La fecha de ingreso es obligatoria.');
    } else if (!fechaIngParsed) {
      errores.push('La fecha de ingreso debe ser una fecha válida en formato AAAA-MM-DD.');
    } else {
      if (fechaIngParsed.dateObj > hoySinHora) {
        errores.push('La fecha de ingreso no puede ser futura.');
      }
    }

    // 4. Validación de celular: obligatorio, exactamente 10 dígitos numéricos
    const regex10Digitos = /^\d{10}$/;
    const celularLimpio = typeof celular === 'string' ? celular.trim() : (celular ? String(celular).trim() : '');
    if (!celularLimpio) {
      errores.push('El número de celular es obligatorio.');
    } else if (!regex10Digitos.test(celularLimpio)) {
      errores.push('El número de celular debe contener exactamente 10 dígitos numéricos.');
    }

    // 5. Validación de telefono_emergencia: obligatorio, exactamente 10 dígitos numéricos
    const telEmergenciaLimpio = typeof telefono_emergencia === 'string'
      ? telefono_emergencia.trim()
      : (telefono_emergencia ? String(telefono_emergencia).trim() : '');
    if (!telEmergenciaLimpio) {
      errores.push('El teléfono de emergencia es obligatorio.');
    } else if (!regex10Digitos.test(telEmergenciaLimpio)) {
      errores.push('El teléfono de emergencia debe contener exactamente 10 dígitos numéricos.');
    }

    // Si fallan las validaciones, responder con código 400 y arreglo de errores
    if (errores.length > 0) {
      return res.status(400).json({
        mensaje: 'Se encontraron errores de validación en el formulario.',
        errores
      });
    }

    // Cifrar datos sensibles antes de almacenar en la base de datos
    const celularCifrado = encrypt(celularLimpio);
    const telefonoEmergenciaCifrado = encrypt(telEmergenciaLimpio);

    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO registros (
        nombre_completo,
        fecha_nacimiento,
        fecha_ingreso,
        celular,
        telefono_emergencia
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const resultado = stmt.run(
      nombreLimpio,
      fechaNacParsed.normalizada,
      fechaIngParsed.normalizada,
      celularCifrado,
      telefonoEmergenciaCifrado
    );

    return res.status(201).json({
      mensaje: 'Registro completado con éxito.',
      id: resultado.lastInsertRowid
    });
  } catch (error) {
    console.error('Error al procesar el registro:', error);
    return res.status(500).json({ error: 'Ocurrió un error interno al guardar el registro.' });
  }
});

/**
 * POST /api/admin/login
 * Autentica al administrador comparando la contraseña con el hash almacenado.
 */
router.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(401).json({ error: 'La contraseña es requerida.' });
    }

    const adminHash = req.app.locals.adminPasswordHash;
    if (!adminHash) {
      return res.status(500).json({ error: 'Hash de administrador no configurado en el servidor.' });
    }

    const coincide = await bcrypt.compare(password, adminHash);
    if (!coincide) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    req.session.isAdmin = true;
    return res.status(200).json({ mensaje: 'Inicio de sesión exitoso.' });
  } catch (error) {
    console.error('Error en autenticación de administrador:', error);
    return res.status(500).json({ error: 'Error interno en el proceso de autenticación.' });
  }
});

/**
 * GET /api/admin/registros
 * Obtiene todos los registros descifrando los teléfonos. Protegido por requireAdmin.
 */
router.get('/api/admin/registros', requireAdmin, (req, res) => {
  try {
    const db = getDB();
    const filas = db.prepare('SELECT * FROM registros ORDER BY created_at DESC').all();

    const registros = filas.map((fila) => ({
      id: fila.id,
      nombre_completo: fila.nombre_completo,
      fecha_nacimiento: fila.fecha_nacimiento,
      fecha_ingreso: fila.fecha_ingreso,
      celular: decrypt(fila.celular),
      telefono_emergencia: decrypt(fila.telefono_emergencia),
      created_at: fila.created_at
    }));

    return res.json(registros);
  } catch (error) {
    console.error('Error al obtener registros:', error);
    return res.status(500).json({ error: 'Error al consultar los registros de la base de datos.' });
  }
});

/**
 * GET /api/admin/exportar/csv
 * Exporta los registros a un archivo CSV con BOM UTF-8 para compatibilidad con Excel. Protegido por requireAdmin.
 */
router.get('/api/admin/exportar/csv', requireAdmin, (req, res) => {
  try {
    const db = getDB();
    const filas = db.prepare('SELECT * FROM registros ORDER BY created_at DESC').all();

    const cabeceras = [
      'ID',
      'Nombre Completo',
      'Fecha de Nacimiento',
      'Fecha de Ingreso',
      'Celular',
      'Teléfono de Emergencia',
      'Fecha de Registro'
    ];

    function escaparCSV(valor) {
      if (valor === null || valor === undefined) return '""';
      const texto = String(valor).replace(/"/g, '""');
      return `"${texto}"`;
    }

    const lineasCSV = [cabeceras.map(escaparCSV).join(',')];

    for (const fila of filas) {
      const celularDescifrado = decrypt(fila.celular);
      const telEmergenciaDescifrado = decrypt(fila.telefono_emergencia);

      lineasCSV.push([
        escaparCSV(fila.id),
        escaparCSV(fila.nombre_completo),
        escaparCSV(fila.fecha_nacimiento),
        escaparCSV(fila.fecha_ingreso),
        escaparCSV(celularDescifrado),
        escaparCSV(telEmergenciaDescifrado),
        escaparCSV(fila.created_at)
      ].join(','));
    }

    // Fecha actual en formato YYYY-MM-DD para el nombre del archivo
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const fechaActual = `${anio}-${mes}-${dia}`;
    const nombreArchivo = `registros_${fechaActual}.csv`;

    // BOM UTF-8 para garantizar compatibilidad de caracteres con acentos en Microsoft Excel
    const utf8BOM = '\uFEFF';
    const contenidoCSV = utf8BOM + lineasCSV.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    return res.status(200).send(contenidoCSV);
  } catch (error) {
    console.error('Error al exportar registros a CSV:', error);
    return res.status(500).json({ error: 'Error al generar el archivo CSV.' });
  }
});

/**
 * POST /api/admin/logout
 * Cierra la sesión activa del administrador.
 */
router.post('/api/admin/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al cerrar sesión:', err);
        return res.status(500).json({ error: 'No fue posible cerrar la sesión.' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ mensaje: 'Sesión cerrada exitosamente.' });
    });
  } else {
    return res.status(200).json({ mensaje: 'No existía una sesión activa.' });
  }
});

/**
 * GET /api/admin/check
 * Devuelve el estado actual de autenticación del administrador.
 */
router.get('/api/admin/check', (req, res) => {
  const isAdmin = Boolean(req.session && req.session.isAdmin === true);
  return res.json({ isAdmin });
});

module.exports = router;
