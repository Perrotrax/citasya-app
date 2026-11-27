const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../lib/db');
const { generateToken, authMiddleware } = require('../lib/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, age, gender, interested_in, bio, city, occupation, photos, interests } = req.body;

    if (!email || !password || !name || !age) {
      return res.status(400).json({ error: 'Email, contraseña, nombre y edad son campos obligatorios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    if (parseInt(age) < 18) {
      return res.status(400).json({ error: 'Debes ser mayor de 18 años para registrarte.' });
    }

    const existingUser = await db.getProfileByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Ya existe una cuenta registrada con este correo electrónico.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newProfile = await db.createProfile({
      email,
      password_hash,
      name,
      age,
      gender: gender || 'mujer',
      interested_in: interested_in || 'todos',
      bio: bio || '¡Hola! Estoy usando CitasYa para conocer personas increíbles.',
      city: city || 'Ciudad de México',
      occupation: occupation || '',
      photos: Array.isArray(photos) && photos.length > 0 ? photos : [
        gender === 'hombre'
          ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
      ],
      interests: Array.isArray(interests) && interests.length > 0 ? interests : ['Café', 'Viajes', 'Música']
    });

    const token = generateToken(newProfile);

    // Omitir hash al responder
    const { password_hash: _, ...safeProfile } = newProfile;

    res.status(201).json({
      message: '¡Registro exitoso!',
      token,
      user: safeProfile
    });
  } catch (err) {
    console.error('Error en /register:', err);
    res.status(500).json({ error: 'Error al registrar usuario: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
    }

    const user = await db.getProfileByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas. Correo no encontrado.' });
    }

    // Verificar contraseña con bcrypt o permitir claves conocidas solo en cuentas demo.
    let isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch && user.is_demo === true && (password === 'password123' || password === '123456')) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    const token = generateToken(user);
    const { password_hash: _, ...safeProfile } = user;

    res.json({
      message: 'Bienvenido a CitasYa',
      token,
      user: safeProfile
    });
  } catch (err) {
    console.error('Error en /login:', err);
    res.status(500).json({ error: 'Error al iniciar sesión: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.getProfileById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const { password_hash: _, ...safeProfile } = user;
    res.json({ user: safeProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/demo-users
router.get('/demo-users', async (req, res) => {
  try {
    const { initialProfiles } = require('../lib/seedData');
    const demoAccounts = initialProfiles.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      age: p.age,
      gender: p.gender,
      occupation: p.occupation,
      avatar: p.photos[0]
    }));
    res.json({ demoAccounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

