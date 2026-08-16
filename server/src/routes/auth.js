const express = require('express');
const router = express.Router();
const c = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Public routes
router.post('/register', c.register);
router.post('/login', c.login);
router.post('/refresh', c.refresh);
router.post('/logout', c.logout);
router.post('/forgot-password', c.forgotPassword);
router.post('/reset-password', c.resetPassword);
router.post('/verify-email', c.verifyEmail);

// Protected routes
router.get('/me', requireAuth, c.getMe);

// Development-only: demo student quick-login list
router.get('/demo-students', c.getDemoStudents);

module.exports = router;
