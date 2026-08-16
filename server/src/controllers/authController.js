const bcrypt = require('bcrypt');
const crypto = require('crypto');
const studentRepo = require('../repositories/studentRepository');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOtpEmail,
  sendVerificationOtp,
} = require('../services/notificationService');
const otpService = require('../services/otpService');

const BCRYPT_ROUNDS = 12;

// In-memory store for refresh tokens & reset tokens
const refreshTokenStore = new Map(); // token → studentId
const passwordResetTokens = new Map(); // token → { studentId, expires }
const emailVerificationTokens = new Map(); // token → { studentId, expires }

/**
 * Helper to validate email format
 */
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * POST /api/auth/register
 * Creates a student record with emailVerified=false and sends a 6-digit OTP verification code.
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

    // 1. Input Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Full name must be at least 2 characters.',
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'A valid email address is required.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Password must be at least 8 characters long.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Passwords do not match.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    // 2. Check for Duplicate Email
    const existing = await studentRepo.getStudentByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'conflict',
        message: 'An account with this email already exists.',
      });
    }

    // 3. Hash Password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // 4. Create Student Node in CognoDB
    const newStudent = await studentRepo.createStudent({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      phone: phone?.trim() || null,
      educationLevel: educationLevel || "Bachelor's",
      college: college?.trim() || null,
      graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
      emailVerified: false, // Require email verification
      role: 'student',
    });

    // 5. Generate & Send 6-Digit OTP Verification Code
    try {
      const { otp, expires, retryAfter } = await otpService.generateAndStoreOtp(
        normalizedEmail,
        'verify-email'
      );

      await sendOtpEmail(normalizedEmail, otp, 'register', normalizedName);
    } catch (mailErr) {
      console.error('[AUTH_REGISTER] OTP dispatch warning:', mailErr.message);
      // If in production and email completely failed, still return requiresVerification so user can resend
    }

    // 6. Return Verification Required response (Do NOT issue JWT before verification)
    res.status(201).json({
      success: true,
      requiresVerification: true,
      message: 'Account created successfully. A 6-digit verification code has been sent to your email.',
      email: normalizedEmail,
    });
  } catch (err) {
    console.error('[AUTH_REGISTER] Registration failed:', err.message);
    next(err);
  }
}

/**
 * POST /api/auth/verify-email
 * Verifies email via 6-digit OTP code or legacy link token.
 */
async function verifyEmail(req, res, next) {
  try {
    const { email, otp, token } = req.body;

    // A. OTP-based Verification (Primary)
    if (email && otp) {
      const cleanEmail = email.trim().toLowerCase();
      const otpResult = await otpService.verifyOtp(cleanEmail, otp, 'verify-email');

      if (!otpResult.success) {
        const statusCode =
          otpResult.error === 'expired'
            ? 410
            : otpResult.error === 'max_attempts_exceeded'
            ? 429
            : 400;

        return res.status(statusCode).json({
          success: false,
          error: otpResult.error || 'invalid_otp',
          message: otpResult.message || 'Invalid or expired verification code.',
          remainingAttempts: otpResult.remainingAttempts,
        });
      }

      // Mark student as verified in CognoDB
      const student = await studentRepo.getStudentByEmail(cleanEmail);
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'not_found',
          message: 'Account not found.',
        });
      }

      await studentRepo.updateStudent(student.id, { emailVerified: true });
      const updatedStudent = { ...student, emailVerified: true };

      // Issue authenticated session tokens
      const accessToken = generateAccessToken(updatedStudent);
      const refreshToken = generateRefreshToken(updatedStudent);
      refreshTokenStore.set(refreshToken, updatedStudent.id);

      return res.json({
        success: true,
        verified: true,
        message: 'Email verified successfully. Welcome to SkillOS!',
        accessToken,
        token: accessToken,
        refreshToken,
        student: sanitizeStudent(updatedStudent),
      });
    }

    // B. Legacy Token Link Verification (Backward compatibility)
    if (token) {
      const entry = emailVerificationTokens.get(token);
      if (!entry || Date.now() > entry.expires) {
        return res.status(400).json({
          success: false,
          error: 'invalid_token',
          message: 'Verification link is invalid or has expired.',
        });
      }

      await studentRepo.updateStudent(entry.studentId, { emailVerified: true });
      emailVerificationTokens.delete(token);

      const student = await studentRepo.getStudentById(entry.studentId);
      const accessToken = student ? generateAccessToken(student) : null;
      const refreshToken = student ? generateRefreshToken(student) : null;
      if (refreshToken && student) refreshTokenStore.set(refreshToken, student.id);

      return res.json({
        success: true,
        verified: true,
        message: 'Email verified successfully.',
        accessToken,
        token: accessToken,
        refreshToken,
        student: student ? sanitizeStudent(student) : null,
      });
    }

    return res.status(400).json({
      success: false,
      error: 'bad_request',
      message: 'Email and 6-digit verification code are required.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/resend-verification
 * Resends a 6-digit verification code with 60-second cooldown.
 */
async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'A valid email address is required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const student = await studentRepo.getStudentByEmail(cleanEmail);

    // If student already verified
    if (student && (student.emailVerified === true || student.emailVerified === 'true')) {
      return res.json({
        success: true,
        alreadyVerified: true,
        message: 'Your email address is already verified. Please sign in.',
      });
    }

    // Enforce 60-second cooldown and generate new OTP
    const { otp, expires, retryAfter } = await otpService.generateAndStoreOtp(
      cleanEmail,
      'verify-email'
    );

    await sendOtpEmail(cleanEmail, otp, 'register', student?.name || 'Student');

    res.json({
      success: true,
      message: 'Verification code resent to your email.',
      expiresInSeconds: Math.round((expires - Date.now()) / 1000),
      retryAfter,
    });
  } catch (err) {
    if (err.status === 429 || err.code === 'RATE_LIMITED') {
      return res.status(429).json({
        success: false,
        error: 'rate_limited',
        message: err.message,
        retryAfter: err.retryAfter,
      });
    }
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Validates credentials and checks email verification gate.
 */
async function login(req, res, next) {
  try {
    const { email, password, studentId } = req.body;

    // Development demo bypass (test/dev only)
    if (studentId && process.env.NODE_ENV !== 'production') {
      const student = await studentRepo.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Demo student not found.' });
      }
      const accessToken = generateAccessToken(student);
      const refreshToken = generateRefreshToken(student);
      refreshTokenStore.set(refreshToken, student.id);
      return res.json({
        success: true,
        accessToken,
        token: accessToken,
        refreshToken,
        student: sanitizeStudent(student),
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Email and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const student = await studentRepo.getStudentByEmail(cleanEmail);

    if (!student) {
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid email or password.',
      });
    }

    // Compare Password Hash
    let isMatch = false;
    if (student.passwordHash) {
      isMatch = await bcrypt.compare(password, student.passwordHash);
    }

    // Dev fallback for seeded demo accounts with plain text passwords
    if (!isMatch && process.env.NODE_ENV !== 'production' && student.password === password) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid email or password.',
      });
    }

    // Check Email Verification Gate
    const isVerified =
      student.emailVerified === true ||
      student.emailVerified === 'true' ||
      process.env.NODE_ENV === 'development';

    if (!isVerified) {
      // Trigger a verification OTP dispatch if none active
      try {
        const { otp } = await otpService.generateAndStoreOtp(cleanEmail, 'verify-email');
        sendOtpEmail(cleanEmail, otp, 'register', student.name).catch(() => {});
      } catch (_) {}

      return res.status(403).json({
        success: false,
        requiresVerification: true,
        error: 'unverified_email',
        message: 'Your email address has not been verified yet. Please enter the verification code sent to your email.',
        email: cleanEmail,
      });
    }

    // Issue Authenticated Tokens
    const accessToken = generateAccessToken(student);
    const refreshToken = generateRefreshToken(student);
    refreshTokenStore.set(refreshToken, student.id);

    res.json({
      success: true,
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
 * POST /api/auth/send-otp
 * Standalone OTP dispatch (for login via OTP or custom flows)
 */
async function sendOtp(req, res, next) {
  try {
    const { email, purpose = 'authentication' } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'A valid email address is required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const { otp, expires, retryAfter } = await otpService.generateAndStoreOtp(cleanEmail, purpose);

    try {
      await sendOtpEmail(cleanEmail, otp, purpose);
    } catch (mailErr) {
      console.error('[AUTH] Failed to dispatch OTP email:', mailErr.message);
    }

    res.json({
      success: true,
      message: 'Verification code sent to your email.',
      expiresInSeconds: Math.round((expires - Date.now()) / 1000),
      retryAfter,
    });
  } catch (err) {
    if (err.status === 429 || err.code === 'RATE_LIMITED') {
      return res.status(429).json({
        success: false,
        error: 'rate_limited',
        message: err.message,
        retryAfter: err.retryAfter,
      });
    }
    next(err);
  }
}

/**
 * POST /api/auth/verify-otp
 * Standalone OTP verification (for login via OTP or custom flows)
 */
async function verifyOtp(req, res, next) {
  try {
    const { email, otp, purpose } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Email and 6-digit verification code are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await otpService.verifyOtp(cleanEmail, otp, purpose);
    if (!result.success) {
      return res.status(400).json(result);
    }

    const student = await studentRepo.getStudentByEmail(cleanEmail);

    if (purpose === 'login' && student) {
      const accessToken = generateAccessToken(student);
      const refreshToken = generateRefreshToken(student);
      refreshTokenStore.set(refreshToken, student.id);

      return res.json({
        success: true,
        message: 'Logged in successfully.',
        accessToken,
        token: accessToken,
        refreshToken,
        student: sanitizeStudent(student),
      });
    }

    if (purpose === 'verify' && student) {
      await studentRepo.updateStudent(student.id, { emailVerified: true });
      return res.json({
        success: true,
        message: 'Email address verified successfully.',
        verified: true,
      });
    }

    if (purpose === 'reset-password') {
      const resetToken = crypto.randomBytes(32).toString('hex');
      if (student) {
        passwordResetTokens.set(resetToken, {
          studentId: student.id,
          expires: Date.now() + 15 * 60 * 1000,
        });
      }
      return res.json({
        success: true,
        message: 'Code verified. You may now reset your password.',
        resetToken,
      });
    }

    res.json({
      success: true,
      message: 'Verification code verified successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 */
async function refresh(req, res) {
  const { refreshToken: token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'bad_request', message: 'Refresh token is required.' });
  }

  const storedStudentId = refreshTokenStore.get(token);
  if (!storedStudentId) {
    return res.status(401).json({ success: false, error: 'invalid_token', message: 'Invalid or revoked refresh token.' });
  }

  try {
    const payload = verifyRefreshToken(token);
    const student = await studentRepo.getStudentById(payload.id);
    if (!student) {
      return res.status(401).json({ success: false, error: 'user_not_found', message: 'Student account not found.' });
    }

    refreshTokenStore.delete(token);
    const newAccessToken = generateAccessToken(student);
    const newRefreshToken = generateRefreshToken(student);
    refreshTokenStore.set(newRefreshToken, student.id);

    return res.json({
      success: true,
      accessToken: newAccessToken,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (_) {
    return res.status(401).json({ success: false, error: 'invalid_token', message: 'Expired or invalid refresh token.' });
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  const { refreshToken: token } = req.body;
  if (token) {
    refreshTokenStore.delete(token);
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
      return res.status(404).json({ success: false, error: 'not_found', message: 'Student profile not found.' });
    }
    res.json({ success: true, student: sanitizeStudent(student) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'bad_request', message: 'Email is required.' });
    }

    res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });

    const cleanEmail = email.trim().toLowerCase();
    const student = await studentRepo.getStudentByEmail(cleanEmail);
    if (!student) return;

    const token = crypto.randomBytes(32).toString('hex');
    passwordResetTokens.set(token, {
      studentId: student.id,
      expires: Date.now() + 60 * 60 * 1000,
    });

    sendPasswordResetEmail(student.email, student.name, token).catch((err) =>
      console.error('[AUTH] Password reset email failed:', err.message)
    );
  } catch (err) {
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

    for (const [rt, sid] of refreshTokenStore.entries()) {
      if (sid === entry.studentId) refreshTokenStore.delete(rt);
    }

    res.json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/demo-students
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

function sanitizeStudent(student) {
  const { passwordHash, ...safe } = student;
  return safe;
}

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  sendOtp,
  verifyOtp,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  getDemoStudents,
  refreshTokenStore,
  passwordResetTokens,
  emailVerificationTokens,
};
