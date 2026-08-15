const http = require('http');
const app = require('../src/app');

function req(port, method, path, body = null) {
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

async function runTests() {
  console.log('🧪 Starting SkillOS Live End-to-End API Test Suite against CognoDB...\n');
  const server = app.listen(3098);
  const port = 3098;

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
    // 1. Health check
    const health = await req(port, 'GET', '/api/health');
    assert('Health Check (/api/health)', health.status === 200 && health.body.success === true, `(Status: ${health.body.status})`);

    // 2. Get students
    const studentsRes = await req(port, 'GET', '/api/students');
    assert('Get All Students (/api/students)', studentsRes.status === 200 && Array.isArray(studentsRes.body.data) && studentsRes.body.data.length >= 20, `(Count: ${studentsRes.body.data?.length})`);

    const firstStudent = studentsRes.body.data[0];
    const studentId = firstStudent.id;

    // 3. Get student profile
    const profileRes = await req(port, 'GET', `/api/students/${studentId}`);
    assert(`Get Student Profile (/api/students/${studentId})`, profileRes.status === 200 && profileRes.body.data.id === studentId && Array.isArray(profileRes.body.data.skills), `(Skills: ${profileRes.body.data?.skills?.length})`);

    // 4. Query A: Get student skills
    const skillsRes = await req(port, 'GET', `/api/students/${studentId}/skills`);
    assert('Query A - Student Skills (/api/students/:id/skills)', skillsRes.status === 200 && Array.isArray(skillsRes.body.data), `(Found: ${skillsRes.body.data?.length} skills)`);

    // 5. Add & Remove Skill
    const addSkillRes = await req(port, 'POST', `/api/students/${studentId}/skills`, {
      skillId: 'skill-graphql',
      proficiency: 'Intermediate',
    });
    assert('Add Skill to Student (POST /api/students/:id/skills)', addSkillRes.status === 200 && addSkillRes.body.data.id === 'skill-graphql');

    const removeSkillRes = await req(port, 'DELETE', `/api/students/${studentId}/skills/skill-graphql`);
    assert('Remove Skill from Student (DELETE /api/students/:id/skills/:skillId)', removeSkillRes.status === 200 && removeSkillRes.body.success === true);

    // 6. Query B: Career match
    const matchRes = await req(port, 'GET', `/api/students/${studentId}/career-match`);
    assert('Query B - 2-Hop Career Matching (/api/students/:id/career-match)', matchRes.status === 200 && Array.isArray(matchRes.body.data.matches) && matchRes.body.data.matches.length > 0, `(Top match: ${matchRes.body.data.matches[0]?.career?.title} ${matchRes.body.data.matches[0]?.matchPercentage}%)`);

    const targetCareerId = matchRes.body.data.matches[0]?.career?.id || 'career-fullstack-dev';

    // 7. Query C: Career gap analysis
    const gapRes = await req(port, 'GET', `/api/students/${studentId}/career-match?careerId=${targetCareerId}`);
    assert('Query C - Career Gap Analysis (/api/students/:id/career-match?careerId=...)', gapRes.status === 200 && gapRes.body.data.matchPercentage !== undefined && Array.isArray(gapRes.body.data.missingSkills), `(Match: ${gapRes.body.data.matchPercentage}%, Missing: ${gapRes.body.data.missingSkills?.length})`);

    // 8. Query F & G: Prerequisite Learning Path (n-hop variable length traversal)
    const learnRes = await req(port, 'GET', `/api/students/${studentId}/learning-path?careerId=${targetCareerId}`);
    assert('Query F & G - Prerequisite Learning Path (/api/students/:id/learning-path?careerId=...)', learnRes.status === 200 && Array.isArray(learnRes.body.data.orderedSkills), `(Path length: ${learnRes.body.data.orderedSkills?.length} skills, Steps: ${learnRes.body.data.steps?.length})`);

    // 9. Query E: Recommended Jobs (3-hop traversal)
    const recJobsRes = await req(port, 'GET', `/api/students/${studentId}/recommended-jobs`);
    assert('Query E - 3-Hop Job Matching Traversal (/api/students/:id/recommended-jobs)', recJobsRes.status === 200 && Array.isArray(recJobsRes.body.data.jobs) && recJobsRes.body.data.jobs.length > 0, `(Matched jobs: ${recJobsRes.body.data.jobs?.length}, Top job: ${recJobsRes.body.data.jobs[0]?.job?.title})`);

    // 10. Student Graph Visualization (React Flow payload)
    const graphRes = await req(port, 'GET', `/api/students/${studentId}/graph`);
    assert('Graph Visualizer Payload (/api/students/:id/graph)', graphRes.status === 200 && Array.isArray(graphRes.body.data.nodes) && Array.isArray(graphRes.body.data.edges), `(Nodes: ${graphRes.body.data.nodes?.length}, Edges: ${graphRes.body.data.edges?.length})`);

    // 11. Career Roles & Query D: Exploration
    const careersRes = await req(port, 'GET', '/api/careers');
    assert('Get All Careers (/api/careers)', careersRes.status === 200 && Array.isArray(careersRes.body.data) && careersRes.body.data.length >= 15, `(Count: ${careersRes.body.data?.length})`);

    const exploreRes = await req(port, 'GET', '/api/careers/explore');
    assert('Query D - Career Progression Graph (/api/careers/explore)', exploreRes.status === 200 && Array.isArray(exploreRes.body.data) && exploreRes.body.data.some(c => c.leadsTo.length > 0), `(Roles with LEADS_TO: ${exploreRes.body.data.filter(c => c.leadsTo.length > 0).length})`);

    const careerDetailRes = await req(port, 'GET', `/api/careers/${targetCareerId}`);
    assert(`Career Detail (/api/careers/${targetCareerId})`, careerDetailRes.status === 200 && careerDetailRes.body.data.id === targetCareerId && Array.isArray(careerDetailRes.body.data.requiredSkills), `(Required skills: ${careerDetailRes.body.data.requiredSkills?.length})`);

    const careerJobsRes = await req(port, 'GET', `/api/careers/${targetCareerId}/jobs`);
    assert(`Jobs for Career (/api/careers/${targetCareerId}/jobs)`, careerJobsRes.status === 200 && Array.isArray(careerJobsRes.body.data), `(Jobs: ${careerJobsRes.body.data?.length})`);

    // 12. Jobs & Companies
    const jobsRes = await req(port, 'GET', '/api/jobs');
    assert('Get All Jobs (/api/jobs)', jobsRes.status === 200 && Array.isArray(jobsRes.body.data) && jobsRes.body.data.length >= 30, `(Count: ${jobsRes.body.data?.length})`);

    const companiesRes = await req(port, 'GET', '/api/jobs/companies');
    assert('Get All Companies (/api/jobs/companies)', companiesRes.status === 200 && Array.isArray(companiesRes.body.data) && companiesRes.body.data.length >= 10, `(Count: ${companiesRes.body.data?.length})`);

    // 13. Projects & Query H: Skill Inference
    const projectsRes = await req(port, 'GET', '/api/projects');
    assert('Get All Projects (/api/projects)', projectsRes.status === 200 && Array.isArray(projectsRes.body.data) && projectsRes.body.data.length >= 20, `(Count: ${projectsRes.body.data?.length})`);

    const firstProjId = projectsRes.body.data[0].id;
    const projSkillRes = await req(port, 'GET', `/api/projects/${firstProjId}/skills`);
    assert(`Query H - Project Skill Inference (/api/projects/${firstProjId}/skills)`, projSkillRes.status === 200 && projSkillRes.body.data && Array.isArray(projSkillRes.body.data.directSkills), `(Direct skills: ${projSkillRes.body.data.directSkills?.length}, Inferred: ${projSkillRes.body.data.inferredSkills?.length})`);

    const techRes = await req(port, 'GET', '/api/projects/technologies');
    assert('Get All Technologies (/api/projects/technologies)', techRes.status === 200 && Array.isArray(techRes.body.data) && techRes.body.data.length >= 20, `(Count: ${techRes.body.data?.length})`);

    const allSkillsRes = await req(port, 'GET', '/api/projects/skills');
    assert('Get All Skills (/api/projects/skills)', allSkillsRes.status === 200 && Array.isArray(allSkillsRes.body.data) && allSkillsRes.body.data.length >= 50, `(Count: ${allSkillsRes.body.data?.length})`);

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
