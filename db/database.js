/**
 * Módulo de Base de Datos y Cifrado
 * Gestiona la conexión SQLite y operaciones criptográficas con AES-256-GCM.
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Obtener o derivar la clave de cifrado de 32 bytes a partir de ENCRYPTION_KEY
function getDerivedKey() {
  const secretKey = process.env.ENCRYPTION_KEY || 'clave_secreta_de_32_caracteres!!';
  return crypto.scryptSync(secretKey, 'salt', 32);
}

// Instancia única de la base de datos
let dbInstance = null;

/**
 * Inicializa la base de datos SQLite en ./db/registros.db
 * y crea la tabla registros si no existe.
 * @returns {Database.Database} Instancia de la base de datos SQLite.
 */
function initDB() {
  const dbDir = path.resolve(__dirname);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'registros.db');
  dbInstance = new Database(dbPath);

  // Activar modo WAL para mayor concurrencia y fiabilidad
  dbInstance.pragma('journal_mode = WAL');

  // Crear tabla de registros si no existe
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS registros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_completo TEXT NOT NULL,
      fecha_nacimiento TEXT NOT NULL,
      fecha_ingreso TEXT NOT NULL,
      celular TEXT NOT NULL,
      telefono_emergencia TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  return dbInstance;
}

/**
 * Retorna la instancia de la base de datos SQLite.
 * La inicializa si aún no ha sido creada.
 * @returns {Database.Database}
 */
function getDB() {
  if (!dbInstance) {
    return initDB();
  }
  return dbInstance;
}

/**
 * Cifra un texto utilizando el algoritmo AES-256-GCM.
 * @param {string} text - Texto plano que se desea cifrar.
 * @returns {string} Cadena en formato iv:authTag:encrypted en representación hexadecimal.
 */
function encrypt(text) {
  if (text === null || text === undefined || text === '') {
    return '';
  }

  const key = getDerivedKey();
  const iv = crypto.randomBytes(12); // 12 bytes recomendados para AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Descifra una cadena cifrada con AES-256-GCM.
 * @param {string} encryptedText - Cadena en formato iv:authTag:encrypted.
 * @returns {string} Texto en plano descifrado.
 */
function decrypt(encryptedText) {
  if (!encryptedText) {
    return '';
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Formato de texto cifrado inválido. Se esperaba iv:authTag:encrypted');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getDerivedKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  initDB,
  encrypt,
  decrypt,
  getDB
};
