# 🔥 CitasYa - Aplicación Web de Citas (Tinder Clone)

Una aplicación web moderna, rápida y responsiva de citas románticas inspirada en Tinder y Bumble. Desarrollada con **Node.js, Express, JavaScript moderno** y lista para conectarse a **Supabase (PostgreSQL)** y desplegarse gratis en **Vercel** o **Render**.

---

## 🚀 Características Principales

- **🔥 Sistema de Deslizamiento (Swipe Deck)**:
  - Físicas interactivas con ratón o pantalla táctil (swipe derecha = *Like*, izquierda = *Nope*, arriba = *Super Like*).
  - Badges visuales translúcidos en tiempo real según la dirección del arrastre.
  - Filtros rápidos por género (*Todos, Mujeres, Hombres*).
  - Botón de rebobinado / reinicio de perfiles para pruebas continuas.
- **✨ Pantalla de Celebración de Match ("¡Es un Match!")**:
  - Animación con confeti dinámico y corazones flotantes al coincidir dos usuarios.
  - Botones de acción directa: ir al chat o seguir descubriendo perfiles.
- **💬 Chat en Tiempo Real y Lista de Conexiones**:
  - Carrusel horizontal de "Nuevos Matches" con avatares redondeados.
  - Historial de mensajes en burbujas con marcas de tiempo.
  - Emojis rápidos (❤️, 🔥, ✨, 🍕, etc.).
  - Simulación de respuestas inteligentes de perfiles demo para evaluar la conversación.
- **🔍 Vista Explorar**:
  - Grid de perfiles con buscador en tiempo real por nombre, ciudad o profesión.
  - Modal con detalles completos (biografía, intereses, fotos, ocupación).
- **👤 Perfil de Usuario y Ajustes**:
  - Editor en tiempo real de nombre, edad, ciudad, ocupación, biografía, foto e intereses.
  - Selector superior de **Cuentas Demo** para alternar entre diferentes usuarios con 1 solo clic y probar el emparejamiento mutuo sin necesidad de registrar varias cuentas manualmente.
- **🗄️ Base de Datos Híbrida**:
  - **Producción**: Compatible con **Supabase** (PostgreSQL en la nube gratuito).
  - **Desarrollo**: Fallback automático en JSON local (`data/local_db.json`) para que funcione inmediatamente al clonar sin depender de configuraciones previas.

---

## 📂 Estructura del Proyecto

```text
aplicacion de citas/
├── .env.example              # Plantilla de variables de entorno
├── .gitignore
├── package.json              # Dependencias y scripts
├── server.js                 # Servidor principal Express
├── vercel.json               # Configuración de despliegue en Vercel
├── api/
│   └── index.js              # Entrypoint serverless para Vercel
├── database/
│   └── schema.sql            # Script SQL completo para Supabase (PostgreSQL)
├── lib/
│   ├── auth.js               # Generación y verificación de tokens JWT
│   ├── db.js                 # Capa de datos unificada (Supabase + Local JSON)
│   └── seedData.js           # Perfiles iniciales de prueba con avatares de Unsplash
├── routes/
│   ├── authRoutes.js         # Registro, Login y cuentas demo
│   ├── matchRoutes.js        # Matches y mensajes de chat
│   ├── profileRoutes.js      # Descubrir perfiles, filtros y edición
│   ├── statusRoutes.js       # Comprobación de estado y DB
│   └── swipeRoutes.js        # Registro de likes, passes y detección de matches
└── public/                   # Frontend SPA (Single Page Application)
    ├── index.html            # Estructura HTML moderna
    ├── css/
    │   └── styles.css        # Diseño moderno dark mode, gradientes y animaciones
    └── js/
        ├── api.js            # Cliente HTTP y gestión de tokens
        ├── app.js            # Lógica de la aplicación y modales
        └── swipe.js          # Control de gestos táctiles y físicas de tarjetas
```

---

## 💻 Ejecución Local

1. Abre una terminal en la carpeta del proyecto:
   ```bash
   cd "c:\xampp\htdocs\ApplicacionesWeb\aplicacion de citas"
   ```
2. Instala las dependencias (ya instaladas):
   ```bash
   npm install
   ```
3. Copia `.env.example` a `.env` y define `JWT_SECRET` con una clave aleatoria de al menos 32 bytes. Puedes generarla con:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Inicia el servidor:
   ```bash
   npm start
   ```
5. Abre tu navegador en:
   ```text
   http://localhost:3000
   ```

> **Usuarios de Prueba Preconfigurados (Contraseña: `password123`)**:
> - `demo@citasya.com` (Alex Rivera)
> - `sofia@citasya.com` (Sofía Castillo)
> - `valentina@citasya.com` (Valentina Méndez)
> - `carlos@citasya.com` (Carlos Gómez)
> *(También puedes usar el botón superior **"Cambiar Usuario"** para alternar entre ellos al instante).*

---

## ☁️ Guía Paso a Paso: Subir a un Host en Línea Gratuito

A continuación se explican los pasos para tener la app funcionando en internet con su base de datos gratuita.

### Paso 1: Crear la Base de Datos en la Nube Gratuita (Supabase)

1. Ingresa a [https://supabase.com](https://supabase.com) y crea una cuenta gratuita (*Sign Up with GitHub* o correo).
2. Haz clic en **"New Project"**, asígnale un nombre (ej. `citasya-db`) y una contraseña para la base de datos.
3. En el menú lateral izquierdo, ve a **SQL Editor**.
4. Abre el archivo local `database/schema.sql`, copia todo su contenido, pégalo en el editor de Supabase y presiona **Run**. Si ya habías ejecutado una versión anterior, vuelve a ejecutar este archivo actualizado para retirar las políticas de acceso público anteriores.
5. Ve a **Project Settings (ícono de engranaje)** -> **API**:
   - Copia la **Project URL** (ejemplo: `https://xyzcompany.supabase.co`).
   - Copia la clave **service_role**. Se guardará solo como variable del backend en Vercel; no la pongas en archivos públicos ni en el frontend.

---

### Paso 2: Subir el Código a GitHub

1. Inicializa el repositorio Git en la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - CitasYa Dating App"
   ```
2. Crea un nuevo repositorio público o privado en [GitHub](https://github.com/new) (ej. `citasya-app`).
3. Enlaza y sube tu código:
   ```bash
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/citasya-app.git
   git push -u origin main
   ```

---

### Paso 3: Desplegar en Vercel (Hosting Gratuito)

1. Ingresa a [https://vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** -> **"Project"**.
3. Selecciona tu repositorio `citasya-app` y haz clic en **Import**.
4. En la sección **Environment Variables**, añade:
   - `JWT_SECRET`: una clave aleatoria generada localmente con el comando del paso de ejecución local.
   - `SUPABASE_URL`: la URL del proyecto Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: la clave **service_role** del backend.
5. Haz clic en **Deploy**.
6. Vercel te entregará una URL pública y gratuita con certificado SSL (HTTPS) automático.

---

### Alternativa: Desplegar en Render.com (Servidor Node.js Completo)

Si prefieres un servidor Node tradicional en lugar de serverless:
1. Ve a [https://render.com](https://render.com).
2. Crea un **Web Service**, conéctalo a tu repositorio de GitHub.
3. Configuración:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Agrega las mismas variables de entorno (`JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
5. Haz clic en **Create Web Service** y obtendrás tu URL gratis en `onrender.com`.

