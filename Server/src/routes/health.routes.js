const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    success: true,
    message: 'DRVT Mall API is running',
    timestamp: new Date().toISOString(),
    database: dbStatus[dbState] || 'unknown',
  });
});

module.exports = router;
