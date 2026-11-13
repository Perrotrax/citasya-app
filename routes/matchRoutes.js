const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { authMiddleware } = require('../lib/auth');

// Respuestas ingeniosas y amigables para simular interacción real con perfiles demo
const demoBotReplies = [
  "¡Hola! Qué gusto saludarte 😊 ¿Cómo va tu día?",
  "¡Me encantó tu perfil! ¿Qué música sueles escuchar para relajarte?",
  "¡Hola! Vi tus fotos y me pareciste súper simpático/a ✨ ¿Tienes planes divertidos este finde?",
  "¡Hola! Por fin nos conectamos jaja 🍕 ¿Eres más de café o de salir por unas cervezas?",
  "¡Qué lindo match! Cuéntame, ¿cuál es tu lugar favorito para escaparte de la rutina?",
  "¡Hola! Me encanta viajar también. Si pudieras teletransportarte a cualquier lugar ahora mismo, ¿a dónde irías? ✈️"
];

// GET /api/matches
router.get('/', authMiddleware, async (req, res) => {
  try {
    const matches = await db.getMatches(req.user.id);
    res.json({ matches });
  } catch (err) {
    console.error('Error al listar matches:', err);
    res.status(500).json({ error: 'Error al obtener matches: ' + err.message });
  }
});

// GET /api/matches/:matchId/messages
router.get('/:matchId/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await db.getMessages(req.params.matchId);
    res.json({ messages });
  } catch (err) {
    console.error('Error al obtener mensajes:', err);
    res.status(500).json({ error: 'Error al obtener mensajes: ' + err.message });
  }
});

// POST /api/matches/:matchId/messages
router.post('/:matchId/messages', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const matchId = req.params.matchId;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    const currentUserId = req.user.id;
    const message = await db.sendMessage(matchId, currentUserId, text);

    // Comprobar si el otro miembro del match es un perfil demo para generar respuesta automática
    const matches = await db.getMatches(currentUserId);
    const currentMatch = matches.find(m => m.match_id === matchId);

    let botReply = null;
    if (currentMatch && currentMatch.user) {
      const otherUser = await db.getProfileById(currentMatch.user.id);
      if (otherUser && otherUser.is_demo) {
        // Enviar respuesta automática del perfil demo
        const randomReply = demoBotReplies[Math.floor(Math.random() * demoBotReplies.length)];
        // Pequeño retardo virtual para que se sienta natural
        setTimeout(async () => {
          try {
            await db.sendMessage(matchId, otherUser.id, randomReply);
          } catch (e) {
            console.error('Error enviando bot reply:', e);
          }
        }, 1500);
      }
    }

    res.status(201).json({
      success: true,
      message
    });
  } catch (err) {
    console.error('Error al enviar mensaje:', err);
    res.status(500).json({ error: 'Error al enviar mensaje: ' + err.message });
  }
});

module.exports = router;

