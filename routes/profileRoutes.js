const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { authMiddleware } = require('../lib/auth');

// GET /api/profiles/discover
router.get('/discover', authMiddleware, async (req, res) => {
  try {
    const { gender } = req.query;
    const profiles = await db.getDiscoverProfiles(req.user.id, { gender });
    res.json({ profiles });
  } catch (err) {
    console.error('Error en /discover:', err);
    res.status(500).json({ error: 'Error al obtener perfiles: ' + err.message });
  }
});

// GET /api/profiles/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const profile = await db.getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    const { password_hash: _, ...safeProfile } = profile;
    res.json({ profile: safeProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profiles/me
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, age, gender, interested_in, bio, city, occupation, photos, interests } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (age) updates.age = parseInt(age);
    if (gender) updates.gender = gender;
    if (interested_in) updates.interested_in = interested_in;
    if (bio !== undefined) updates.bio = bio;
    if (city !== undefined) updates.city = city;
    if (occupation !== undefined) updates.occupation = occupation;
    if (Array.isArray(photos)) updates.photos = photos;
    if (Array.isArray(interests)) updates.interests = interests;

    const updatedProfile = await db.updateProfile(req.user.id, updates);
    const { password_hash: _, ...safeProfile } = updatedProfile;

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: safeProfile
    });
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'Error al actualizar perfil: ' + err.message });
  }
});

// POST /api/profiles/reset-swipes
router.post('/reset-swipes', authMiddleware, async (req, res) => {
  try {
    await db.resetSwipes(req.user.id);
    res.json({ message: 'Se han reiniciado los perfiles para que puedas deslizar de nuevo.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

