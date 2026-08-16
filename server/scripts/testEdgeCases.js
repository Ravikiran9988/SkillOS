process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-skillos-development-key-64-bytes-long-super-secure';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-skillos-development-key-64-bytes-long';

const http = require('http');
const app = require('../src/app');

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
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    request.on('error', reject);
    if (data) request.write(data);
    request.end();
  });
}

async function runEdgeCaseTests() {
  console.log('🧪 Starting Edge Case, Error Handling & Graceful Degradation Tests...\n');
  const server = app.listen(3097);
  const port = 3097;
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
    // Obtain tokens for testing authenticated student endpoints
    const loginStudent20 = await req(port, 'POST', '/api/auth/login', { studentId: 'student-20' });
    const token20 = loginStudent20.body?.accessToken || loginStudent20.body?.token;

    const loginStudent1 = await req(port, 'POST', '/api/auth/login', { studentId: 'student-1' });
    const token1 = loginStudent1.body?.accessToken || loginStudent1.body?.token;

    // 1. Student with no skills (student-20: Mohan Das)
    const emptyStudentProfile = await req(port, 'GET', '/api/students/student-20', null, token20);
    assert('Student with No Skills Profile (/api/students/student-20)', emptyStudentProfile.status === 200 && emptyStudentProfile.body.data.skills.length === 0, `(Skills: ${emptyStudentProfile.body.data.skills.length})`);

    const emptyCareerMatch = await req(port, 'GET', '/api/students/student-20/career-match', null, token20);
    assert('Career Match for Skill-less Student handles empty state gracefully', emptyCareerMatch.status === 200 && (Array.isArray(emptyCareerMatch.body.data) || Array.isArray(emptyCareerMatch.body.data?.matches)));

    const emptyJobs = await req(port, 'GET', '/api/students/student-20/recommended-jobs', null, token20);
    assert('Recommended Jobs for Skill-less Student handles empty state gracefully', emptyJobs.status === 200 && (Array.isArray(emptyJobs.body.data) || Array.isArray(emptyJobs.body.data?.jobs)));

    // 2. Unauthenticated access blocked (HTTP 401)
    const unauthReq = await req(port, 'GET', '/api/students/student-1');
    assert('Unauthenticated Student Access returns HTTP 401', unauthReq.status === 401 && unauthReq.body.error === 'unauthorized');

    // 3. Invalid Student ID (403 for other student / 404 for admin)
    const notFoundStudent = await req(port, 'GET', '/api/students/student-nonexistent-9999', null, token1);
    assert('Unauthorized non-self Student ID returns HTTP 403 Forbidden', notFoundStudent.status === 403);

    // 4. Invalid Career ID (404 handling)
    const notFoundCareer = await req(port, 'GET', '/api/careers/career-nonexistent-9999');
    assert('Invalid Career ID returns HTTP 404', notFoundCareer.status === 404 && notFoundCareer.body.error === 'not_found', `(Status: ${notFoundCareer.status})`);

    // 5. Invalid Job ID (404 handling)
    const notFoundJob = await req(port, 'GET', '/api/jobs/job-nonexistent-9999');
    assert('Invalid Job ID returns HTTP 404', notFoundJob.status === 404 && notFoundJob.body.error === 'not_found', `(Status: ${notFoundJob.status})`);

    // 6. Invalid Project ID (404 handling)
    const notFoundProject = await req(port, 'GET', '/api/projects/proj-nonexistent-9999');
    assert('Invalid Project ID returns HTTP 404', notFoundProject.status === 404 && notFoundProject.body.error === 'not_found', `(Status: ${notFoundProject.status})`);

    // 7. Missing required payload parameters (400 validation error)
    const badSkillPayload = await req(port, 'POST', '/api/students/student-1/skills', {}, token1);
    assert('Missing skillId returns HTTP 400 Bad Request', badSkillPayload.status === 400 && badSkillPayload.body.error === 'bad_request', `(Status: ${badSkillPayload.status})`);

    const badCareerPayload = await req(port, 'POST', '/api/students/student-1/target-career', {}, token1);
    assert('Missing careerRoleId returns HTTP 400 Bad Request', badCareerPayload.status === 400 && badCareerPayload.body.error === 'bad_request', `(Status: ${badCareerPayload.status})`);

    const badLearningPath = await req(port, 'GET', '/api/students/student-1/learning-path', null, token1);
    assert('Missing careerId query parameter returns HTTP 400 Bad Request', badLearningPath.status === 400 && badLearningPath.body.error === 'bad_request', `(Status: ${badLearningPath.status})`);

    // 8. Nonexistent route (404 route handling)
    const nonexistentRoute = await req(port, 'GET', '/api/unknown-endpoint');
    assert('Nonexistent Route returns clean 404 JSON', nonexistentRoute.status === 404 && nonexistentRoute.body.error === 'not_found');

    console.log(`\n========================================`);
    console.log(`Edge Case Tests: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exitCode = 1;
  } catch (err) {
    console.error('Fatal edge case test error:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
    setTimeout(() => process.exit(failed > 0 ? 1 : 0), 500).unref();
  }
}

runEdgeCaseTests();
