const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { requireAuth } = require('../middleware/auth');

router.post('/career-chat', requireAuth, aiController.handleCareerChat);

module.exports = router;
