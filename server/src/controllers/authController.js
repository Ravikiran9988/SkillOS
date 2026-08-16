const bcrypt = require('bcrypt');
const crypto = require('crypto');
const studentRepo = require('../repositories/studentRepository');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/notificationService');

const BCRYPT_ROUNDS = 12;

// In-memory store for refresh tokens & reset tokens (in production, store in DB/Redis)
// For Neo4j-only deployments, we store these in the graph via studentRepo methods.
const refreshTokenStore = new Map(); // token → studentId
const passwordResetTokens = new Map(); // token → { studentId, expires }
const emailVerificationTokens = new Map(); // token → { studentId, expires }

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      educationLevel,
      college,
      graduationYear,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Name, email, and password are required.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Passwords do not match.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Password must be at least 8 characters long.',
      });
    }

    // Check if email already exists
    const allStudents = await studentRepo.getAllStudents();
    const existing = allStudents.find(
      (s) => s.email?.toLowerCase() === email.trim().toLowerCase()
    );
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'conflict',
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newStudent = await studentRepo.createStudent({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      phone: phone?.trim() || null,
      educationLevel: educationLevel || "Bachelor's",
      college: college?.trim() || null,
      graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
      emailVerified: process.env.NODE_ENV === 'development', // auto-verify in dev
      role: 'student',
    });

    // Send verification email (non-blocking in production)
    if (process.env.NODE_ENV !== 'development') {
      const verifyToken = crypto.randomBytes(32).toString('hex');
      emailVerificationTokens.set(verifyToken, {
        studentId: newStudent.id,
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24h
      });
      sendVerificationEmail(newStudent.email, newStudent.name, verifyToken).catch((err) =>
        console.error('[AUTH] Verification email failed:', err.message)
      );
    }

    const accessToken = generateAccessToken(newStudent);
    const refreshToken = generateRefreshToken(newStudent);
    refreshTokenStore.set(refreshToken, newStudent.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to SkillOS!',
      accessToken,
      token: accessToken,
      refreshToken,
      student: sanitizeStudent(newStudent),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password, studentId } = req.body;

    // ── Demo bypass (non-production only) ───────────────────────────────────
    if (
      process.env.NODE_ENV !== 'production' &&
      studentId &&
      !email &&
      !password
    ) {
      const student = await studentRepo.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'not_found',
          message: 'Demo student not found.',
        });
      }
      const accessToken = generateAccessToken(student);
      const refreshToken = generateRefreshToken(student);
      refreshTokenStore.set(refreshToken, student.id);
      return res.json({
        success: true,
        message: `Welcome, ${student.name}! (dev mode)`,
        accessToken,
        token: accessToken,
        refreshToken,
        student: sanitizeStudent(student),
      });
    }

    // ── Production login (email + password) ──────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Email and password are required.',
      });
    }

    const allStudents = await studentRepo.getAllStudents();
    const student = allStudents.find(
      (s) => s.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (!student) {
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid email or password.',
      });
    }

    // Handle students created before password auth (demo seeds)
    if (!student.passwordHash) {
      if (process.env.NODE_ENV !== 'production') {
        // Dev/Test: allow login without password for legacy seeds
        const accessToken = generateAccessToken(student);
        const refreshToken = generateRefreshToken(student);
        refreshTokenStore.set(refreshToken, student.id);
        return res.json({
          success: true,
          message: `Welcome back, ${student.name}!`,
          accessToken,
          token: accessToken,
          refreshToken,
          student: sanitizeStudent(student),
        });
      }
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid email or password.',
      });
    }

    const passwordValid = await bcrypt.compare(password, student.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid email or password.',
      });
    }

    const accessToken = generateAccessToken(student);
    const refreshToken = generateRefreshToken(student);
    refreshTokenStore.set(refreshToken, student.id);

    res.json({
      success: true,
      message: `Welcome back, ${student.name}!`,
      accessToken,
      token: accessToken,
      refreshToken,
      student: sanitizeStudent(student),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'bad_request', message: 'Refresh token required.' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ success: false, error: 'invalid_token', message: 'Invalid or expired refresh token.' });
    }

    if (!refreshTokenStore.has(refreshToken)) {
      return res.status(401).json({ success: false, error: 'invalid_token', message: 'Refresh token has been revoked.' });
    }

    const student = await studentRepo.getStudentById(decoded.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'not_found', message: 'Student not found.' });
    }

    // Rotate refresh token
    refreshTokenStore.delete(refreshToken);
    const newAccessToken = generateAccessToken(student);
    const newRefreshToken = generateRefreshToken(student);
    refreshTokenStore.set(newRefreshToken, student.id);

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      student: sanitizeStudent(student),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    refreshTokenStore.delete(refreshToken);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    const student = await studentRepo.getStudentById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'not_found', message: 'Student not found.' });
    }
    res.json({ success: true, student: sanitizeStudent(student) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'bad_request', message: 'Email is required.' });
    }

    // Always return success to prevent email enumeration
    res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });

    const allStudents = await studentRepo.getAllStudents();
    const student = allStudents.find((s) => s.email?.toLowerCase() === email.toLowerCase());
    if (!student) return;

    const token = crypto.randomBytes(32).toString('hex');
    passwordResetTokens.set(token, {
      studentId: student.id,
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    sendPasswordResetEmail(student.email, student.name, token).catch((err) =>
      console.error('[AUTH] Password reset email failed:', err.message)
    );
  } catch (err) {
    // Swallow errors to prevent enumeration
    console.error('[AUTH] forgotPassword error:', err.message);
  }
}

/**
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'bad_request', message: 'Token and password are required.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'bad_request', message: 'Passwords do not match.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'bad_request', message: 'Password must be at least 8 characters.' });
    }

    const entry = passwordResetTokens.get(token);
    if (!entry || Date.now() > entry.expires) {
      return res.status(400).json({ success: false, error: 'invalid_token', message: 'Reset link is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await studentRepo.updateStudent(entry.studentId, { passwordHash });
    passwordResetTokens.delete(token);

    // Revoke all refresh tokens for this student
    for (const [rt, sid] of refreshTokenStore.entries()) {
      if (sid === entry.studentId) refreshTokenStore.delete(rt);
    }

    res.json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/verify-email
 */
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'bad_request', message: 'Verification token is required.' });
    }

    const entry = emailVerificationTokens.get(token);
    if (!entry || Date.now() > entry.expires) {
      return res.status(400).json({ success: false, error: 'invalid_token', message: 'Verification link is invalid or has expired.' });
    }

    await studentRepo.updateStudent(entry.studentId, { emailVerified: true });
    emailVerificationTokens.delete(token);

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/demo-students — development only
 */
async function getDemoStudents(req, res, next) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ success: false, error: 'not_found', message: 'Not found.' });
  }
  try {
    const students = await studentRepo.getAllStudents();
    const previews = students.slice(0, 6).map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      educationLevel: s.educationLevel,
      targetCareer: s.targetCareer,
    }));
    res.json({ success: true, students: previews });
  } catch (err) {
    next(err);
  }
}

/**
 * Strip sensitive fields from student object before sending to client.
 */
function sanitizeStudent(student) {
  const { passwordHash, ...safe } = student;
  return safe;
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getDemoStudents,
  refreshTokenStore,
  passwordResetTokens,
  emailVerificationTokens,
};
