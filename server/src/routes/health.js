const express = require('express');
const router = express.Router();
const { verifyConnectivity } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    await verifyConnectivity();
    res.json({
      success: true,
      status: 'ok',
      message: 'SkillOS API is running and connected to CognoDB.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'degraded',
      message: 'SkillOS API is running but cannot reach CognoDB.',
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
