/**
 * Módulo de Base de Datos y Cifrado
 * Gestiona la conexión PostgreSQL y operaciones criptográficas con AES-256-GCM.
 */

const crypto = require('crypto');
const { Pool } = require('pg');

// Obtener o derivar la clave de cifrado de 32 bytes a partir de ENCRYPTION_KEY
function getDerivedKey() {
  const secretKey = process.env.ENCRYPTION_KEY || 'clave_secreta_de_32_caracteres!!';
  return crypto.scryptSync(secretKey, 'salt', 32);
}

// Pool de conexiones PostgreSQL
let pool = null;

/**
 * Obtiene el pool de conexiones, creándolo si no existe.
 * @returns {Pool}
 */
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

/**
 * Inicializa la base de datos PostgreSQL y crea la tabla si no existe.
 */
async function initDB() {
  const p = getPool();

  await p.query(`
    CREATE TABLE IF NOT EXISTS registros (
      id SERIAL PRIMARY KEY,
      nombre_completo TEXT NOT NULL,
      fecha_nacimiento TEXT NOT NULL,
      fecha_ingreso TEXT NOT NULL,
      celular TEXT NOT NULL,
      telefono_emergencia TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  console.log('Base de datos PostgreSQL inicializada correctamente.');
  return p;
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
  const iv = crypto.randomBytes(12);
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
    throw new Error('Formato de texto cifrado inválido.');
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
  getPool
};
