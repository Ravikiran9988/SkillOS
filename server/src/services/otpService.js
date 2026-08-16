/**
 * SkillOS OTP Service
 * Cryptographically secure 6-digit OTP generation, hashed storage, 10-minute expiry,
 * 5-attempt limit, and 60-second resend throttling.
 */

const crypto = require('crypto');

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

// In-memory OTP store (keyed by email.toLowerCase())
const otpStore = new Map();

/**
 * Hash an OTP using SHA-256 with a unique salt
 */
function hashOtp(otp, salt) {
  return crypto
    .createHash('sha256')
    .update(`${otp}:${salt}`)
    .digest('hex');
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP and store its hash
 *
 * @param {string} email - Destination email address
 * @param {string} [purpose='authentication'] - Purpose of OTP
 * @returns {Promise<{ otp: string, expires: number, retryAfter: number }>}
 */
async function generateAndStoreOtp(email, purpose = 'authentication') {
  if (!email || typeof email !== 'string') {
    const err = new Error('Valid email address is required.');
    err.status = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = otpStore.get(normalizedEmail);
  const now = Date.now();

  // Check 60-second cooldown
  if (existing && existing.lastSentAt && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const remainingSec = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    const err = new Error(`Please wait ${remainingSec}s before requesting another verification code.`);
    err.status = 429;
    err.code = 'RATE_LIMITED';
    err.retryAfter = remainingSec;
    throw err;
  }

  // Generate 6-digit numeric OTP (100000 to 999999)
  const otpNumber = crypto.randomInt(100000, 1000000);
  const otp = otpNumber.toString();

  const salt = crypto.randomBytes(16).toString('hex');
  const hashedOtp = hashOtp(otp, salt);
  const expires = now + OTP_EXPIRY_MS;

  otpStore.set(normalizedEmail, {
    hashedOtp,
    salt,
    expires,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    lastSentAt: now,
    purpose,
  });

  return {
    otp,
    expires,
    retryAfter: 60,
  };
}

/**
 * Verify a submitted OTP against the stored hash
 *
 * @param {string} email - Student email
 * @param {string} userOtp - 6-digit OTP code submitted by user
 * @param {string} [expectedPurpose] - Optional purpose validation
 * @returns {Promise<{ success: boolean, message?: string, error?: string, remainingAttempts?: number, purpose?: string }>}
 */
async function verifyOtp(email, userOtp, expectedPurpose = null) {
  if (!email || !userOtp) {
    return {
      success: false,
      error: 'bad_request',
      message: 'Email and 6-digit verification code are required.',
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = String(userOtp).trim();

  // Validate format (must be exactly 6 digits)
  if (!/^\d{6}$/.test(cleanOtp)) {
    return {
      success: false,
      error: 'invalid_format',
      message: 'Verification code must be exactly 6 digits.',
    };
  }

  const entry = otpStore.get(normalizedEmail);
  const now = Date.now();

  if (!entry) {
    return {
      success: false,
      error: 'not_found',
      message: 'No verification code found for this email. Please request a new one.',
    };
  }

  if (now > entry.expires) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      error: 'expired',
      message: 'Verification code has expired. Please request a new one.',
    };
  }

  if (expectedPurpose && entry.purpose && entry.purpose !== expectedPurpose) {
    return {
      success: false,
      error: 'purpose_mismatch',
      message: 'This verification code was issued for a different action.',
    };
  }

  // Check attempt limit
  if (entry.attempts >= entry.maxAttempts) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      error: 'max_attempts_exceeded',
      message: 'Maximum verification attempts exceeded. Please request a new code.',
    };
  }

  const computedHash = hashOtp(cleanOtp, entry.salt);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(entry.hashedOtp, 'hex')
  );

  if (!isMatch) {
    entry.attempts += 1;
    const remaining = entry.maxAttempts - entry.attempts;

    if (remaining <= 0) {
      otpStore.delete(normalizedEmail);
      return {
        success: false,
        error: 'max_attempts_exceeded',
        message: 'Invalid code. Maximum attempts reached. Please request a new code.',
        remainingAttempts: 0,
      };
    }

    return {
      success: false,
      error: 'invalid_code',
      message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      remainingAttempts: remaining,
    };
  }

  // Valid: Invalidate immediately (single use)
  const purpose = entry.purpose;
  otpStore.delete(normalizedEmail);

  return {
    success: true,
    purpose,
    message: 'Verification code verified successfully.',
  };
}

/**
 * Clear stored OTP for an email
 */
function clearOtp(email) {
  if (email) {
    otpStore.delete(email.trim().toLowerCase());
  }
}

/**
 * Get internal store for test verification
 */
function _getStore() {
  return otpStore;
}

module.exports = {
  generateAndStoreOtp,
  verifyOtp,
  clearOtp,
  _getStore,
  OTP_EXPIRY_MS,
  RESEND_COOLDOWN_MS,
  MAX_ATTEMPTS,
};
