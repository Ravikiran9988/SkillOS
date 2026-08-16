const express = require('express');
const router = express.Router();
const c = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes with rate limiting
router.post('/register', authLimiter, c.register);
router.post('/verify-email', authLimiter, c.verifyEmail);
router.post('/resend-verification', authLimiter, c.resendVerification);
router.post('/login', authLimiter, c.login);
router.post('/send-otp', authLimiter, c.sendOtp);
router.post('/verify-otp', authLimiter, c.verifyOtp);
router.post('/refresh', c.refresh);
router.post('/logout', c.logout);
router.post('/forgot-password', authLimiter, c.forgotPassword);
router.post('/reset-password', authLimiter, c.resetPassword);

// Protected routes
router.get('/me', requireAuth, c.getMe);

// Development-only: demo student quick-login list
router.get('/demo-students', c.getDemoStudents);

module.exports = router;
