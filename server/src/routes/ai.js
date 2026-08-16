const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { requireAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

// All AI endpoints require student authentication and are rate-limited
router.post('/career-chat', requireAuth, aiLimiter, aiController.handleCareerChat);
router.post('/interview-eval', requireAuth, aiLimiter, aiController.handleInterviewEval);
router.post('/interview-questions', requireAuth, aiLimiter, aiController.handleInterviewQuestions);
router.post('/resume-summary', requireAuth, aiLimiter, aiController.handleResumeSummary);
router.get('/status', requireAuth, aiController.handleAiStatus);

module.exports = router;
