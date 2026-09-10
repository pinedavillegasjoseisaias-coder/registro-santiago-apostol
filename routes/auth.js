/**
 * Middleware de Autenticación
 * Valida que exista una sesión activa con privilegios de administrador.
 */

/**
 * Verifica si el usuario cuenta con sesión de administrador activa.
 * Retorna código 401 si no está autenticado.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }

  return res.status(401).json({
    error: 'Acceso no autorizado. Se requiere iniciar sesión como administrador.'
  });
}

// Permitir tanto require('./auth') como require('./auth').requireAdmin
requireAdmin.requireAdmin = requireAdmin;

module.exports = requireAdmin;
