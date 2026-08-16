const rateLimit = require('express-rate-limit');

const WINDOW_15MIN = 15 * 60 * 1000;
const WINDOW_1HOUR = 60 * 60 * 1000;

/**
 * Auth rate limiter — strict: 10 requests per 15 minutes
 * Protects login, register, forgot-password endpoints.
 */
const authLimiter = rateLimit({
  windowMs: WINDOW_15MIN,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'rate_limited',
    message: 'Too many authentication attempts. Please wait 15 minutes and try again.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * AI rate limiter — 30 requests per hour
 * Protects expensive LLM endpoints.
 */
const aiLimiter = rateLimit({
  windowMs: WINDOW_1HOUR,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'rate_limited',
    message: 'AI Copilot request limit reached. Please wait before sending more messages.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * General API limiter — 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: WINDOW_15MIN,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'rate_limited',
    message: 'Too many requests. Please slow down.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

module.exports = { authLimiter, aiLimiter, generalLimiter };
