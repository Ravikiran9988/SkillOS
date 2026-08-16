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
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
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

async function testFrontendUserJourney() {
  console.log('🌐 Starting Programmatic End-to-End User Journey Audit (Login → Dashboard → Profile → Career → Jobs → Projects → Graph)...\n');

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
    // 1. Student Authentication Login
    const loginRes = await req(port, 'POST', '/api/auth/login', { studentId: 'student-5' });
    const token = loginRes.body?.accessToken || loginRes.body?.token;
    assert('1. Auth: Student Login (Aditya Singh - student-5)', loginRes.status === 200 && !!token, `(Token received)`);

    // 2. Student Profile View (/api/students/me)
    const profileRes = await req(port, 'GET', '/api/students/me', null, token);
    const student = profileRes.body?.data;
    assert('2. Profile View: Load Student Details & Current Skills', profileRes.status === 200 && student?.skills?.length >= 5, `(Skills count: ${student?.skills?.length}, Target: ${student?.targetCareer?.title})`);

    const targetCareerId = student?.targetCareer?.id || 'cr-airesearcher';

    // 3. Career Gap & Career Match
    const careerMatchRes = await req(port, 'GET', `/api/students/me/career-match?careerId=${targetCareerId}`, null, token);
    const matchPctVal = careerMatchRes.body?.data?.matchPercentage ?? careerMatchRes.body?.data?.matchPct;
    assert('3. Career Gap Analysis: Compute Matched vs Missing Skills', careerMatchRes.status === 200 && matchPctVal > 0, `(Match: ${matchPctVal}%, Matched: ${careerMatchRes.body?.data?.matchedSkills?.length}, Missing: ${careerMatchRes.body?.data?.missingSkills?.length})`);

    // 4. Learning Path (Prerequisite DAG Traversal)
    const learningPathRes = await req(port, 'GET', `/api/students/me/learning-path?careerId=${targetCareerId}`, null, token);
    const pathItems = learningPathRes.body?.data?.steps || learningPathRes.body?.data?.orderedSkills || learningPathRes.body?.data?.path;
    assert('4. Learning Path: Prerequisite-Ordered Learning Steps with Courses', learningPathRes.status === 200 && pathItems && pathItems.length > 0, `(Ordered Steps: ${pathItems?.length})`);

    // 5. Recommended Jobs (3-Hop Traversal)
    const jobsRes = await req(port, 'GET', '/api/students/me/recommended-jobs', null, token);
    const jobsList = Array.isArray(jobsRes.body?.data) ? jobsRes.body?.data : jobsRes.body?.data?.jobs || [];
    assert('5. Jobs View: 3-Hop Matched Job Recommendations with Companies', jobsRes.status === 200 && jobsList.length > 0, `(Found: ${jobsList.length} jobs)`);

    // 6. Career Explorer (LEADS_TO Progression Graph)
    const exploreRes = await req(port, 'GET', '/api/careers/explore');
    const rolesWithLeads = Array.isArray(exploreRes.body?.data) ? exploreRes.body?.data.filter(r => r.leadsTo?.length > 0) : [];
    assert('6. Career Explorer: LEADS_TO Progression Graph Data', exploreRes.status === 200 && exploreRes.body?.data?.length === 15, `(Roles: ${exploreRes.body?.data?.length}, Roles with progression: ${rolesWithLeads.length})`);

    // 7. Projects View (Query H - Skill Inference)
    const projectsRes = await req(port, 'GET', '/api/projects');
    assert('7. Projects View: Load Real Projects with Tech Stack', projectsRes.status === 200 && projectsRes.body?.data?.length === 20, `(Projects: ${projectsRes.body?.data?.length})`);

    const proj1Skills = await req(port, 'GET', '/api/projects/proj-1/skills');
    assert('8. Project Detail: Inferred Skills from Technologies (Query H)', proj1Skills.status === 200 && proj1Skills.body?.data?.inferredSkills?.length > 0, `(Direct: ${proj1Skills.body?.data?.directSkills?.length}, Inferred: ${proj1Skills.body?.data?.inferredSkills?.length})`);

    // 8. Graph Visualizer Data (Full Subgraph)
    const graphRes = await req(port, 'GET', '/api/students/me/graph', null, token);
    assert('9. Graph Visualizer: Node-Link Graph Subgraph for React Flow', graphRes.status === 200 && graphRes.body?.data?.nodes?.length > 0 && graphRes.body?.data?.edges?.length > 0, `(Nodes: ${graphRes.body?.data?.nodes?.length}, Edges: ${graphRes.body?.data?.edges?.length})`);

    console.log(`\n========================================`);
    console.log(`User Journey Audit: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exitCode = 1;
  } catch (e) {
    console.error('Fatal user journey error:', e);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
    setTimeout(() => process.exit(failed > 0 ? 1 : 0), 500).unref();
  }
}

testFrontendUserJourney();
