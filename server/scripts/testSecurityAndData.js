process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-skillos-development-key-64-bytes-long-super-secure';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-skillos-development-key-64-bytes-long';

const http = require('http');
const app = require('../src/app');
const {
  refreshTokenStore,
  passwordResetTokens,
  emailVerificationTokens,
} = require('../src/controllers/authController');

function req(port, method, path, body = null, token = null, extraHeaders = {}) {
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
        ...extraHeaders,
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

async function runSecurityAndDataTests() {
  console.log('🔒 ==========================================================');
  console.log('🔒 SkillOS Comprehensive Security, IDOR, Auth & Data Audit');
  console.log('🔒 ==========================================================\n');

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
    // ─── 1. Authentication & Session Setup ───────────────────────────────────
    console.log('--- 1. Authentication & Token Verification ---');

    // Login as Student A (student-5: Aditya Singh)
    const loginA = await req(port, 'POST', '/api/auth/login', { studentId: 'student-5' });
    const tokenA = loginA.body?.accessToken || loginA.body?.token;
    const refreshA = loginA.body?.refreshToken;
    assert('Student A Auth Login (/api/auth/login)', loginA.status === 200 && !!tokenA && !!refreshA, `(Token received)`);

    // Login as Student B (student-1: Aarav Sharma)
    const loginB = await req(port, 'POST', '/api/auth/login', { studentId: 'student-1' });
    const tokenB = loginB.body?.accessToken || loginB.body?.token;
    const refreshB = loginB.body?.refreshToken;
    assert('Student B Auth Login (/api/auth/login)', loginB.status === 200 && !!tokenB && !!refreshB, `(Token received)`);

    // Verify /api/auth/me returns authenticated student
    const meA = await req(port, 'GET', '/api/auth/me', null, tokenA);
    assert('Get Authenticated Self (/api/auth/me)', meA.status === 200 && meA.body.student?.id === 'student-5');

    // ─── 2. Complete IDOR Tests for Every Student Endpoint ───────────────────
    console.log('\n--- 2. IDOR Prevention Across All Student Endpoints ---');

    // Endpoints to test: Student A trying to access Student B ('student-1')
    const idorEndpoints = [
      { method: 'GET', path: '/api/students/student-1', desc: 'Get Student Profile' },
      { method: 'PUT', path: '/api/students/student-1', body: { bio: 'Hacked' }, desc: 'Update Student Profile' },
      { method: 'GET', path: '/api/students/student-1/skills', desc: 'Get Student Skills' },
      { method: 'POST', path: '/api/students/student-1/skills', body: { skillId: 'skill-python' }, desc: 'Add Student Skill' },
      { method: 'DELETE', path: '/api/students/student-1/skills/skill-python', desc: 'Delete Student Skill' },
      { method: 'POST', path: '/api/students/student-1/target-career', body: { careerRoleId: 'career-1' }, desc: 'Set Target Career' },
      { method: 'GET', path: '/api/students/student-1/career-match', desc: 'Get Career Match' },
      { method: 'GET', path: '/api/students/student-1/learning-path?careerId=career-1', desc: 'Get Learning Path' },
      { method: 'GET', path: '/api/students/student-1/recommended-jobs', desc: 'Get Recommended Jobs' },
      { method: 'GET', path: '/api/students/student-1/graph', desc: 'Get Student Graph' },
      { method: 'GET', path: '/api/students/student-1/saved', desc: 'Get Student Saved Items' },
      { method: 'POST', path: '/api/students/student-1/saved', body: { type: 'careers', itemId: 'career-1' }, desc: 'Save Item' },
      { method: 'DELETE', path: '/api/students/student-1/saved/save-1', desc: 'Delete Saved Item' },
      { method: 'GET', path: '/api/students/student-1/notifications', desc: 'Get Notifications' },
      { method: 'PATCH', path: '/api/students/student-1/notifications/notif-1/read', desc: 'Mark Notification Read' },
    ];

    for (const ep of idorEndpoints) {
      const res = await req(port, ep.method, ep.path, ep.body, tokenA);
      assert(`IDOR Block: ${ep.method} ${ep.path} (${ep.desc})`, res.status === 403 && res.body?.error === 'forbidden');
    }

    // Unauthenticated access to /api/students/:id must return 401
    const unauthProfile = await req(port, 'GET', '/api/students/student-5');
    assert('Unauthenticated Access (/api/students/student-5) returns 401', unauthProfile.status === 401 && unauthProfile.body?.error === 'unauthorized');

    // Self access (/api/students/me or /api/students/student-5 with tokenA) must succeed (200)
    const selfProfile = await req(port, 'GET', '/api/students/me', null, tokenA);
    assert('Self Access (/api/students/me) returns 200', selfProfile.status === 200 && selfProfile.body.data?.id === 'student-5');

    // ─── 3. Refresh-Token Rotation & Revocation ─────────────────────────────
    console.log('\n--- 3. Refresh Token Rotation & Revocation ---');

    const refreshRes = await req(port, 'POST', '/api/auth/refresh', { refreshToken: refreshA });
    assert('Refresh Token Rotation (/api/auth/refresh)', refreshRes.status === 200 && !!refreshRes.body.accessToken && !!refreshRes.body.refreshToken);
    const newRefreshA = refreshRes.body.refreshToken;

    // Attempting to reuse old refresh token must be rejected (401)
    const reuseOldRefresh = await req(port, 'POST', '/api/auth/refresh', { refreshToken: refreshA });
    assert('Old Refresh Token Replay Blocked (HTTP 401)', reuseOldRefresh.status === 401 && reuseOldRefresh.body.error === 'invalid_token');

    // Logout revokes the active refresh token
    const logoutRes = await req(port, 'POST', '/api/auth/logout', { refreshToken: newRefreshA }, tokenA);
    assert('User Logout (/api/auth/logout)', logoutRes.status === 200 && logoutRes.body.success === true);

    const refreshAfterLogout = await req(port, 'POST', '/api/auth/refresh', { refreshToken: newRefreshA });
    assert('Refresh Token Revocation on Logout Blocked (HTTP 401)', refreshAfterLogout.status === 401);

    // ─── 4. Password Reset & Expiration ─────────────────────────────────────
    console.log('\n--- 4. Password Reset Expiration & Security ---');

    // Forgot password (anti-enumeration check: always 200)
    const forgotRes = await req(port, 'POST', '/api/auth/forgot-password', { email: 'aditya.singh@example.com' });
    assert('Forgot Password Request (/api/auth/forgot-password)', forgotRes.status === 200 && forgotRes.body.success === true);

    // Test password reset with expired token
    const expiredToken = 'expired-token-mock-12345';
    passwordResetTokens.set(expiredToken, {
      studentId: 'student-5',
      expires: Date.now() - 10000, // Expired 10s ago
    });

    const expiredResetRes = await req(port, 'POST', '/api/auth/reset-password', {
      token: expiredToken,
      password: 'NewSecurePassword123!',
      confirmPassword: 'NewSecurePassword123!',
    });
    assert('Expired Password Reset Token Rejected (HTTP 400)', expiredResetRes.status === 400 && expiredResetRes.body.error === 'invalid_token');

    // Test password reset with invalid token
    const invalidResetRes = await req(port, 'POST', '/api/auth/reset-password', {
      token: 'nonexistent-token-xyz',
      password: 'NewSecurePassword123!',
      confirmPassword: 'NewSecurePassword123!',
    });
    assert('Invalid Password Reset Token Rejected (HTTP 400)', invalidResetRes.status === 400);

    // ─── 5. Email Verification & Expiration ─────────────────────────────────
    console.log('\n--- 5. Email Verification Expiration ---');

    const expiredVerifyToken = 'expired-verify-token-mock';
    emailVerificationTokens.set(expiredVerifyToken, {
      studentId: 'student-5',
      expires: Date.now() - 10000, // Expired
    });

    const expiredVerifyRes = await req(port, 'POST', '/api/auth/verify-email', { token: expiredVerifyToken });
    assert('Expired Email Verification Token Rejected (HTTP 400)', expiredVerifyRes.status === 400 && expiredVerifyRes.body.error === 'invalid_token');

    // ─── 6. Security Headers & CORS ─────────────────────────────────────────
    console.log('\n--- 6. Security Headers & CORS Validation ---');

    const healthCheck = await req(port, 'GET', '/api/health', null, null, {
      Origin: 'https://skill-os-vert.vercel.app',
    });
    assert('Security Headers: X-Content-Type-Options', healthCheck.headers['x-content-type-options'] === 'nosniff');
    assert('Security Headers: X-Frame-Options', !!healthCheck.headers['x-frame-options']);
    assert('CORS: Whitelisted Origin Allowed', healthCheck.headers['access-control-allow-origin'] === 'https://skill-os-vert.vercel.app');

    // ─── 7. Data Persistence & Student Isolation ────────────────────────────
    console.log('\n--- 7. Data Persistence & Student Isolation ---');

    // Student A saves a career item
    const saveCareerRes = await req(port, 'POST', '/api/students/me/saved', {
      type: 'careers',
      itemId: 'career-1',
    }, tokenA);
    assert('Student A Save Career Item (POST /api/students/me/saved)', saveCareerRes.status === 201 && saveCareerRes.body.data?.itemId === 'career-1');

    // Student A fetches saved items -> career-1 must be present
    const savedItemsA = await req(port, 'GET', '/api/students/me/saved', null, tokenA);
    assert('Student A Saved Items Contains Saved Career', savedItemsA.status === 200 && Array.isArray(savedItemsA.body.data) && savedItemsA.body.data.some(i => i.itemId === 'career-1'));

    // Student B fetches saved items -> must NOT contain Student A's saved item
    const savedItemsB = await req(port, 'GET', '/api/students/me/saved', null, tokenB);
    assert('Student B Saved Items DOES NOT Contain Student A data (Data Isolation)', savedItemsB.status === 200 && Array.isArray(savedItemsB.body.data) && !savedItemsB.body.data.some(i => i.itemId === 'career-1'));

    // Student A cleans up saved item
    const savedEntry = savedItemsA.body.data.find(i => i.itemId === 'career-1');
    if (savedEntry) {
      const deleteSaveRes = await req(port, 'DELETE', `/api/students/me/saved/${savedEntry.id}`, null, tokenA);
      assert('Student A Delete Saved Item (DELETE /api/students/me/saved/:id)', deleteSaveRes.status === 200);
    }

    // ─── 8. AI Copilot Grounding & Privacy ──────────────────────────────────
    console.log('\n--- 8. AI Career Copilot Context Grounding & Privacy ---');

    const aiRes = await req(port, 'POST', '/api/ai/career-chat', {
      message: 'What is my top skill gap and recommended next step?',
    }, tokenA);

    assert('AI Career Copilot Responds (POST /api/ai/career-chat)', aiRes.status === 200 && !!aiRes.body.data?.reply);
    const replyText = aiRes.body.data?.reply || '';
    assert('AI Copilot Context Grounded in Career Graph', /skills|gap|career|roadmap|learning|project/i.test(replyText));

    // Verify AI response does NOT leak credentials or system secrets
    assert('AI Copilot Privacy: No Password/Secret Leakage', !/password|passwordHash|jwt_secret|bearer/i.test(replyText));

    console.log(`\n==========================================================`);
    console.log(`Security & Data Audit Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==========================================================\n`);

    if (failed > 0) process.exitCode = 1;
  } catch (err) {
    console.error('Fatal security audit error:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
    setTimeout(() => process.exit(failed > 0 ? 1 : 0), 500).unref();
  }
}

runSecurityAndDataTests();
