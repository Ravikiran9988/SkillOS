const http = require('http');

async function testFrontendUserJourney() {
  console.log('🌐 Starting Programmatic End-to-End User Journey Audit (Dashboard → Profile → Career → Jobs → Projects → Graph)...\n');

  function fetchJson(path) {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:3001${path}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }).on('error', reject);
    });
  }

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

  // 1. Dashboard initialization & Student Selection
  const studentsRes = await fetchJson('/api/students');
  assert('1. Dashboard: Load Students from CognoDB', studentsRes.status === 200 && studentsRes.body.data.length === 20, `(Loaded ${studentsRes.body.data.length} students)`);
  const student = studentsRes.body.data.find(s => s.id === 'student-5');
  assert('2. Dashboard: Select Student (Aditya Singh - student-5)', student && student.name === 'Aditya Singh', `(Selected: ${student?.name}, Degree: ${student?.educationLevel})`);

  // 2. Student Profile View
  const profileRes = await fetchJson(`/api/students/${student.id}`);
  assert('3. Profile View: Load Student Details & Current Skills', profileRes.status === 200 && profileRes.body.data.skills.length >= 5, `(Skills count: ${profileRes.body.data.skills.length}, Target: ${profileRes.body.data.targetCareer?.title})`);

  // 3. Career Gap & Career Match
  const careerMatchRes = await fetchJson(`/api/students/${student.id}/career-match?careerId=${profileRes.body.data.targetCareer.id}`);
  const matchPctVal = careerMatchRes.body.data.matchPercentage ?? careerMatchRes.body.data.matchPct;
  assert('4. Career Gap Analysis: Compute Matched vs Missing Skills', careerMatchRes.status === 200 && matchPctVal > 0, `(Match: ${matchPctVal}%, Matched: ${careerMatchRes.body.data.matchedSkills.length}, Missing: ${careerMatchRes.body.data.missingSkills.length})`);

  // 4. Learning Path (Prerequisite DAG Traversal)
  const learningPathRes = await fetchJson(`/api/students/${student.id}/learning-path?careerId=${profileRes.body.data.targetCareer.id}`);
  const pathItems = learningPathRes.body.data.steps || learningPathRes.body.data.orderedSkills || learningPathRes.body.data.path;
  assert('5. Learning Path: Prerequisite-Ordered Learning Steps with Courses', learningPathRes.status === 200 && pathItems && pathItems.length > 0, `(Ordered Steps: ${pathItems?.length})`);

  // 5. Recommended Jobs (3-Hop Traversal)
  const jobsRes = await fetchJson(`/api/students/${student.id}/recommended-jobs`);
  const topJob = jobsRes.body.data.jobs[0]?.job || jobsRes.body.data.jobs[0];
  const topCompany = jobsRes.body.data.jobs[0]?.company?.name;
  assert('6. Jobs View: 3-Hop Matched Job Recommendations with Companies', jobsRes.status === 200 && jobsRes.body.data.jobs.length > 0, `(Found: ${jobsRes.body.data.jobs.length} jobs, Top: ${topJob?.title} @ ${topCompany})`);

  // 6. Career Explorer (LEADS_TO Progression Graph)
  const exploreRes = await fetchJson('/api/careers/explore');
  const rolesWithLeads = Array.isArray(exploreRes.body.data) ? exploreRes.body.data.filter(r => r.leadsTo?.length > 0) : [];
  assert('7. Career Explorer: LEADS_TO Progression Graph Data', exploreRes.status === 200 && exploreRes.body.data.length === 15, `(Roles: ${exploreRes.body.data.length}, Roles with progression: ${rolesWithLeads.length})`);

  // 7. Projects View (Query H - Skill Inference)
  const projectsRes = await fetchJson('/api/projects');
  assert('8. Projects View: Load Real Projects with Tech Stack', projectsRes.status === 200 && projectsRes.body.data.length === 20, `(Projects: ${projectsRes.body.data.length})`);

  const proj1Skills = await fetchJson('/api/projects/proj-1/skills');
  assert('9. Project Detail: Inferred Skills from Technologies (Query H)', proj1Skills.status === 200 && proj1Skills.body.data.inferredSkills.length > 0, `(Direct: ${proj1Skills.body.data.directSkills.length}, Inferred: ${proj1Skills.body.data.inferredSkills.length})`);

  // 8. Graph Visualizer Data (Full Subgraph)
  const graphRes = await fetchJson(`/api/students/${student.id}/graph`);
  assert('10. Graph Visualizer: Node-Link Graph Subgraph for React Flow', graphRes.status === 200 && graphRes.body.data.nodes.length > 0 && graphRes.body.data.edges.length > 0, `(Nodes: ${graphRes.body.data.nodes.length}, Edges: ${graphRes.body.data.edges.length})`);

  console.log(`\n========================================`);
  console.log(`User Journey Audit: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
  process.exit(0);
}

testFrontendUserJourney().catch(e => {
  console.error('Fatal user journey error:', e);
  process.exit(1);
});
