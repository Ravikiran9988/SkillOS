process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-skillos-development-key-64-bytes-long-super-secure';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-skillos-development-key-64-bytes-long';
process.env.EMAIL_PROVIDER = 'mock';

const http = require('http');
const app = require('../src/app');
const otpService = require('../src/services/otpService');
const notificationService = require('../src/services/notificationService');
const studentRepo = require('../src/repositories/studentRepository');

function req(port, method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const request = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw });
        }
      });
    });

    request.on('error', reject);
    if (data) request.write(data);
    request.end();
  });
}

async function runRegistrationAndOtpTests() {
  console.log('📧 ==========================================================');
  console.log('📧 SkillOS Registration & Email OTP Verification Audit');
  console.log('📧 ==========================================================\n');

  const server = app.listen(0);
  const port = await new Promise((resolve) => {
    server.on('listening', () => resolve(server.address().port));
  });

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${extra}`);
      failed++;
    }
  }

  try {
    const testRegEmail = `test.student.${Date.now()}@kiranverse.tech`;
    const testPassword = 'SecurePassword123!';

    // ─── 1. Registration Input Validation & Error Handling ────────────────────
    console.log('--- 1. Registration Input Validation ---');

    // 1a. Missing name
    const noNameRes = await req(port, 'POST', '/api/auth/register', {
      email: testRegEmail,
      password: testPassword,
      confirmPassword: testPassword,
    });
    assert('Registration: Missing name returns 400', noNameRes.status === 400);

    // 1b. Invalid email
    const invalidEmailRes = await req(port, 'POST', '/api/auth/register', {
      name: 'Test Student',
      email: 'not-an-email',
      password: testPassword,
      confirmPassword: testPassword,
    });
    assert('Registration: Invalid email format returns 400', invalidEmailRes.status === 400);

    // 1c. Password mismatch
    const mismatchRes = await req(port, 'POST', '/api/auth/register', {
      name: 'Test Student',
      email: testRegEmail,
      password: testPassword,
      confirmPassword: 'DifferentPassword!',
    });
    assert('Registration: Password mismatch returns 400', mismatchRes.status === 400);

    // 1d. Short password
    const shortPwRes = await req(port, 'POST', '/api/auth/register', {
      name: 'Test Student',
      email: testRegEmail,
      password: 'short',
      confirmPassword: 'short',
    });
    assert('Registration: Short password (<8 chars) returns 400', shortPwRes.status === 400);

    // ─── 2. Successful Registration & Database Account Creation ───────────────
    console.log('\n--- 2. Successful Registration & CognoDB Account Creation ---');

    const regRes = await req(port, 'POST', '/api/auth/register', {
      name: 'Kiran Sharma',
      email: testRegEmail,
      password: testPassword,
      confirmPassword: testPassword,
      educationLevel: "Bachelor's",
      college: 'IIT Delhi',
      graduationYear: 2026,
      phone: '+91 9876543210',
    });

    assert('Registration: Returns HTTP 201 Created', regRes.status === 201);
    assert('Registration: Returns requiresVerification=true', regRes.body.requiresVerification === true);
    assert('Registration: Does NOT leak JWT tokens before email verification', !regRes.body.accessToken && !regRes.body.token);

    // Verify student node was created in CognoDB with all properties
    const createdStudent = await studentRepo.getStudentByEmail(testRegEmail);
    assert('CognoDB Query: Student Node Created in Database', !!createdStudent);
    assert('CognoDB Query: Student Name is Saved (Kiran Sharma)', createdStudent?.name === 'Kiran Sharma');
    assert('CognoDB Query: Student Email is Saved (Normalized)', createdStudent?.email === testRegEmail);
    assert('CognoDB Query: Password Hash Saved with bcrypt', !!createdStudent?.passwordHash && createdStudent?.passwordHash !== testPassword);
    assert('CognoDB Query: EmailVerified is FALSE initially', createdStudent?.emailVerified === false || createdStudent?.emailVerified === 'false');

    // ─── 3. Duplicate Email Rejection ─────────────────────────────────────────
    console.log('\n--- 3. Duplicate Email Prevention ---');

    const dupRes = await req(port, 'POST', '/api/auth/register', {
      name: 'Duplicate Student',
      email: testRegEmail,
      password: testPassword,
      confirmPassword: testPassword,
    });
    assert('Duplicate Registration returns HTTP 409 Conflict', dupRes.status === 409 && dupRes.body.error === 'conflict');

    // ─── 4. Unverified Login Blocking ─────────────────────────────────────────
    console.log('\n--- 4. Unverified Login Gating ---');

    const unverifiedLoginRes = await req(port, 'POST', '/api/auth/login', {
      email: testRegEmail,
      password: testPassword,
    });
    assert('Unverified Login returns 403 Forbidden with requiresVerification', unverifiedLoginRes.status === 403 && unverifiedLoginRes.body.requiresVerification === true);
    assert('Unverified Login does NOT issue accessToken', !unverifiedLoginRes.body.accessToken);

    // ─── 5. OTP Verification Tests ────────────────────────────────────────────
    console.log('\n--- 5. OTP Verification & Attempts ---');

    // 5a. Incorrect OTP submission
    const wrongOtpRes = await req(port, 'POST', '/api/auth/verify-email', {
      email: testRegEmail,
      otp: '000000',
    });
    assert('Incorrect OTP returns HTTP 400', wrongOtpRes.status === 400 && wrongOtpRes.body.error === 'invalid_code');
    assert('Incorrect OTP returns remaining attempts count', typeof wrongOtpRes.body.remainingAttempts === 'number');

    // 5b. Resend verification OTP (after clear for test)
    otpService.clearOtp(testRegEmail);
    const resendRes = await req(port, 'POST', '/api/auth/resend-verification', {
      email: testRegEmail,
    });
    assert('POST /api/auth/resend-verification returns HTTP 200', resendRes.status === 200);

    // 5c. Resend cooldown test
    const immediateResend = await req(port, 'POST', '/api/auth/resend-verification', {
      email: testRegEmail,
    });
    assert('Resend within 60s is blocked with HTTP 429 Rate Limited', immediateResend.status === 429 && immediateResend.body.error === 'rate_limited');

    // 5d. Correct OTP verification
    // Generate a fresh OTP
    otpService.clearOtp(testRegEmail);
    const { otp: activeCode } = await otpService.generateAndStoreOtp(testRegEmail, 'verify-email');

    const verifyRes = await req(port, 'POST', '/api/auth/verify-email', {
      email: testRegEmail,
      otp: activeCode,
    });

    assert('POST /api/auth/verify-email with Correct OTP returns HTTP 200', verifyRes.status === 200 && verifyRes.body.verified === true);
    assert('Verify-email returns accessToken upon successful verification', !!verifyRes.body.accessToken);
    assert('Verify-email returns student profile upon successful verification', verifyRes.body.student?.name === 'Kiran Sharma');

    // Verify in database that emailVerified is now true
    const verifiedStudentInDb = await studentRepo.getStudentByEmail(testRegEmail);
    assert('CognoDB Query: Student emailVerified updated to TRUE in graph', verifiedStudentInDb?.emailVerified === true || verifiedStudentInDb?.emailVerified === 'true');

    // 5e. Replay attack: Reusing verified OTP should be blocked
    const replayVerify = await req(port, 'POST', '/api/auth/verify-email', {
      email: testRegEmail,
      otp: activeCode,
    });
    assert('Replaying used OTP returns error (Single-Use Invalidation)', replayVerify.status === 400 || replayVerify.status === 404);

    // ─── 6. Verified Login & Auth Lifecycle ───────────────────────────────────
    console.log('\n--- 6. Verified Account Login & Auth Lifecycle ---');

    const loginRes = await req(port, 'POST', '/api/auth/login', {
      email: testRegEmail,
      password: testPassword,
    });
    assert('Verified Student Login returns HTTP 200', loginRes.status === 200 && !!loginRes.body.accessToken);

    const token = loginRes.body.accessToken;
    const rt = loginRes.body.refreshToken;

    // Get Authenticated Self
    const meRes = await req(port, 'GET', '/api/auth/me', null, token);
    assert('GET /api/auth/me returns authenticated student data', meRes.status === 200 && meRes.body.student?.email === testRegEmail);

    // Token Refresh
    const refreshRes = await req(port, 'POST', '/api/auth/refresh', { refreshToken: rt });
    assert('POST /api/auth/refresh rotates accessToken & refreshToken', refreshRes.status === 200 && !!refreshRes.body.accessToken);

    // Logout
    const logoutRes = await req(port, 'POST', '/api/auth/logout', { refreshToken: refreshRes.body.refreshToken });
    assert('POST /api/auth/logout revokes refresh token', logoutRes.status === 200);

    console.log(`\n==========================================================`);
    console.log(`Registration & OTP Audit Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==========================================================\n`);

    if (failed > 0) process.exitCode = 1;
  } catch (err) {
    console.error('Fatal Registration & OTP test error:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
    setTimeout(() => process.exit(failed > 0 ? 1 : 0), 500).unref();
  }
}

runRegistrationAndOtpTests();
