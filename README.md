# Registro de Datos — El Distintivo y Sección Santiago Apóstol Tequixquiac

Aplicación web para el registro de datos personales con formulario móvil, base de datos cifrada y panel administrativo protegido.

## 🚀 Instalación y Ejecución Local

### Requisitos previos
- **Node.js** v18 o superior → [Descargar](https://nodejs.org/)

### Pasos

1. **Clonar o descargar** este proyecto

2. **Instalar dependencias:**
   ```bash
   cd registro-datos
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   # Copiar el archivo de ejemplo
   cp .env.example .env

   # Editar .env con tus valores (o dejar los predeterminados para pruebas)
   ```

   Variables disponibles:
   | Variable | Descripción | Valor por defecto |
   |---|---|---|
   | `PORT` | Puerto del servidor | `3000` |
   | `ADMIN_PASSWORD` | Contraseña del panel admin | `admin123` |
   | `ENCRYPTION_KEY` | Clave para cifrar datos sensibles | `clave_secreta_de_32_caracteres!!` |
   | `SESSION_SECRET` | Secreto para las sesiones | `secreto_de_sesion_muy_seguro_2024` |

4. **Iniciar el servidor:**
   ```bash
   npm start
   ```

5. **Abrir en el navegador:**
   - 📝 **Formulario de registro:** http://localhost:3000
   - 🔐 **Panel administrativo:** http://localhost:3000/admin.html

## 📱 Uso

### Para los usuarios (formulario)
1. Comparte el enlace `https://tu-dominio.com` por WhatsApp o Messenger
2. Los usuarios llenan el formulario desde su celular
3. Al enviar, ven un mensaje de confirmación

### Para el administrador (panel)
1. Accede a `https://tu-dominio.com/admin.html`
2. Ingresa la contraseña configurada en `ADMIN_PASSWORD`
3. Ve todos los registros en una tabla con búsqueda
4. Exporta a CSV para abrir en Excel

## 🔒 Seguridad

- Los teléfonos se guardan cifrados con **AES-256-GCM**
- El panel admin está protegido por contraseña (hash bcrypt)
- Cookies de sesión seguras (httpOnly, secure en producción)
- Headers de seguridad con Helmet

## ☁️ Despliegue en la nube (URL pública)

### Opción 1: Render.com (Recomendado, gratis)
1. Sube el código a un repositorio de **GitHub**
2. Ve a [render.com](https://render.com) y crea una cuenta
3. Crea un nuevo **Web Service** y conecta tu repositorio
4. Configura:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Agrega las **variables de entorno** en la sección "Environment"
6. ¡Listo! Render te dará una URL pública como `https://tu-app.onrender.com`

### Opción 2: Railway.app
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno
4. Railway desplegará automáticamente

> ⚠️ **IMPORTANTE:** Antes de desplegar, cambia `ADMIN_PASSWORD`, `ENCRYPTION_KEY` y `SESSION_SECRET` por valores seguros y únicos.

## 📁 Estructura del Proyecto

```
registro-datos/
├── server.js              # Servidor Express principal
├── package.json           # Dependencias del proyecto
├── .env                   # Variables de entorno (no se sube a git)
├── .env.example           # Ejemplo de variables de entorno
├── .gitignore             # Archivos ignorados por git
├── db/
│   ├── database.js        # Configuración SQLite + cifrado AES
│   └── registros.db       # Base de datos (se crea automáticamente)
├── routes/
│   ├── api.js             # Endpoints de la API
│   └── auth.js            # Middleware de autenticación
└── public/
    ├── index.html         # Formulario de registro
    ├── admin.html         # Panel administrativo
    ├── img/
    │   └── iglesia.webp   # Imagen de cabecera
    ├── css/
    │   └── styles.css     # Estilos responsive
    └── js/
        ├── form.js        # Validación del formulario
        └── admin.js       # Lógica del panel admin
```
