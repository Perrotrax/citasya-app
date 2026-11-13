const express = require('express');
const router = express.Router();
const db = require('../lib/db');

// GET /api/status
router.get('/status', async (req, res) => {
  try {
    const dbStatus = await db.getDbStatus();
    res.json({
      status: 'ok',
      app: 'CitasYa API',
      version: '1.0.0',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;

