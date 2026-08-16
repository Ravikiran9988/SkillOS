const jwt = require('jsonwebtoken');

// ─── Secrets ──────────────────────────────────────────────────────────────────
const JWT_ACCESS_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_ACCESS_SECRET) {
  console.error('[AUTH] FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Use a safe fallback ONLY in development (never production)
const accessSecret =
  JWT_ACCESS_SECRET ||
  (process.env.NODE_ENV !== 'production'
    ? 'dev-only-access-secret-DO-NOT-USE-IN-PROD'
    : null);

const refreshSecret =
  JWT_REFRESH_SECRET ||
  (process.env.NODE_ENV !== 'production'
    ? 'dev-only-refresh-secret-DO-NOT-USE-IN-PROD'
    : null);

/**
 * Build the JWT payload for a student.
 */
function buildPayload(student) {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    role: student.role || 'student',
    educationLevel: student.educationLevel,
  };
}

/**
 * Generate a short-lived access token (default 15m).
 */
function generateAccessToken(student) {
  return jwt.sign(buildPayload(student), accessSecret, { expiresIn: ACCESS_EXPIRES_IN });
}

/**
 * Generate a long-lived refresh token (default 7d).
 */
function generateRefreshToken(student) {
  return jwt.sign({ id: student.id, type: 'refresh' }, refreshSecret, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

/**
 * Backward-compat alias used in authController.
 */
function generateToken(student) {
  return generateAccessToken(student);
}

/**
 * Verify an access token. Returns decoded payload or throws.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret);
}

/**
 * Verify a refresh token. Returns decoded payload or throws.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret);
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * requireAuth — Validates Bearer access token.
 * Attaches decoded user to req.user.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'unauthorized',
      message: 'Authentication required. Please log in to access your SkillOS career intelligence.',
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'token_expired',
        message: 'Your session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'unauthorized',
      message: 'Invalid session token. Please log in again.',
    });
  }
}

/**
 * requireSelfOrAdmin — Students can only access their own data.
 * Maps :id === 'me' → req.user.id.
 * Admins may access any student's data.
 */
function requireSelfOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'unauthorized', message: 'Authentication required.' });
  }

  const requestedId = req.params.id;

  if (requestedId === 'me' || requestedId === req.user.id || req.user.role === 'admin') {
    req.params.id = requestedId === 'me' ? req.user.id : requestedId;
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'forbidden',
    message: 'Access denied: You can only access your own career data.',
  });
}

/**
 * requireAdmin — Only users with role === 'admin' may proceed.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'unauthorized', message: 'Authentication required.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'forbidden',
      message: 'Admin access required.',
    });
  }
  next();
}

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  requireAuth,
  requireSelfOrAdmin,
  requireAdmin,
};
