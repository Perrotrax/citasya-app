require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const swipeRoutes = require('./routes/swipeRoutes');
const matchRoutes = require('./routes/matchRoutes');
const statusRoutes = require('./routes/statusRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/swipes', swipeRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api', statusRoutes);

// Ruta para SPA (Single Page Application)
app.get('*', (req, res) => {
  // Si la petición es a la API y no existió la ruta, devolver 404 JSON
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Ruta API no encontrada' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor', details: err.message });
});

// Iniciar servidor local si se ejecuta directamente
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Servidor CitasYa corriendo exitosamente`);
    console.log(`📍 URL Local: http://localhost:${PORT}`);
    console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
    console.log(`====================================================`);
  });
}

module.exports = app;

