const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { authMiddleware } = require('../lib/auth');

// POST /api/swipes
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { targetId, action } = req.body; // action: 'like', 'pass', 'superlike'

    if (!targetId || !action) {
      return res.status(400).json({ error: 'Faltan parámetros: targetId y action son requeridos.' });
    }

    if (!['like', 'pass', 'superlike'].includes(action)) {
      return res.status(400).json({ error: 'Acción no válida. Usa: like, pass o superlike.' });
    }

    const currentUserId = req.user.id;

    // Verificar si el objetivo existe
    const targetUser = await db.getProfileById(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario objetivo no encontrado.' });
    }

    // Para perfiles demo: Si el usuario da like o superlike, simular un like recíproco para probar la experiencia de match!
    if (targetUser.is_demo && (action === 'like' || action === 'superlike')) {
      const matchChance = action === 'superlike' ? 1.0 : 0.85; // 85% para like, 100% para superlike
      if (Math.random() <= matchChance) {
        // Guardar like del demo hacia el usuario actual
        await db.recordSwipe(targetId, currentUserId, 'like');
      }
    }

    const result = await db.recordSwipe(currentUserId, targetId, action);

    // Si hubo match, devolver detalles del match y del usuario para la pantalla de celebración
    let matchResponse = null;
    if (result.isMatch) {
      const currentUser = await db.getProfileById(currentUserId);
      matchResponse = {
        matchId: result.match.id,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          age: targetUser.age,
          photo: targetUser.photos && targetUser.photos.length > 0 ? targetUser.photos[0] : null,
          city: targetUser.city
        },
        currentUser: {
          id: currentUser.id,
          name: currentUser.name,
          photo: currentUser.photos && currentUser.photos.length > 0 ? currentUser.photos[0] : null
        }
      };
    }

    res.json({
      success: true,
      action,
      isMatch: result.isMatch,
      match: matchResponse
    });
  } catch (err) {
    console.error('Error en /swipes:', err);
    res.status(500).json({ error: 'Error al procesar swipe: ' + err.message });
  }
});

module.exports = router;

