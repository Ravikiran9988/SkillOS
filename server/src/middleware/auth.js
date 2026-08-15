const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'skillos-student-jwt-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

/**
 * Generate a signed JWT token for a student.
 */
function generateToken(student) {
  return jwt.sign(
    {
      id: student.id,
      name: student.name,
      email: student.email,
      educationLevel: student.educationLevel,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Middleware: Require valid authenticated student session.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // Support x-student-id for testing/dev environments if no Bearer token provided
  if (!token && req.headers['x-student-id']) {
    req.user = {
      id: req.headers['x-student-id'],
      name: req.headers['x-student-name'] || 'Authenticated Student',
      email: req.headers['x-student-email'] || `${req.headers['x-student-id']}@example.com`,
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'unauthorized',
      message: 'Authentication required. Please log in to access your SkillOS career intelligence.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'unauthorized',
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
}

/**
 * Middleware: Enforce student data isolation (prevent IDOR).
 * Students can only access their own data (:id === req.user.id or :id === 'me').
 */
function requireSelfOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'unauthorized',
      message: 'Authentication required.',
    });
  }

  const requestedId = req.params.id;

  // Map 'me' keyword to the authenticated user's ID
  if (requestedId === 'me' || requestedId === req.user.id) {
    req.params.id = req.user.id;
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'forbidden',
    message: "Access denied: You can only access your own student profile and career data.",
  });
}

module.exports = {
  generateToken,
  requireAuth,
  requireSelfOrAdmin,
};
