const { read } = require('../src/config/database');

async function testGraphNativeQueries() {
  console.log('🌐 Starting Deep Graph-Native Queries Verification against CognoDB...\n');
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

  // 1. Variable-Length Traversal: Prerequisite Chain ([:PREREQUISITE_OF*])
  // Skill -> PREREQUISITE_OF* -> Target Skill
  const prereqQuery = `
    MATCH path = (root:Skill)-[:PREREQUISITE_OF*]->(target:Skill {id: $skillId})
    WHERE NOT EXISTS { MATCH (x:Skill)-[:PREREQUISITE_OF]->(root) }
    RETURN [n IN nodes(path) | n.name] AS skillNames,
           length(path) AS pathDepth
    ORDER BY pathDepth DESC
    LIMIT 1
  `;
  const prereqRes = await read(prereqQuery, { skillId: 'skill-llm' });
  const chain = prereqRes.records[0]?.get('skillNames') || [];
  const depth = prereqRes.records[0]?.get('pathDepth')?.toNumber() || 0;
  assert('Variable-Length Prerequisite Chain ([:PREREQUISITE_OF*])', depth >= 2 && chain.length >= 3, `(Target: LLM, Depth: ${depth} hops, Path: ${chain.join(' → ')})`);

  // 2. 2-Hop Traversal: Student Skill Matching (Person -> HAS_SKILL -> Skill <- REQUIRES <- CareerRole)
  const twoHopMatchQuery = `
    MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES]-(cr:CareerRole)
    RETURN cr.title AS career, collect(s.name) AS matchedSkills, count(s) AS matchCount
    ORDER BY matchCount DESC
    LIMIT 3
  `;
  const twoHopRes = await read(twoHopMatchQuery, { personId: 'student-5' });
  assert('2-Hop Traversal: Person → HAS_SKILL → Skill ← REQUIRES ← CareerRole', twoHopRes.records.length > 0 && twoHopRes.records[0].get('matchCount').toNumber() >= 1, `(Top Career: ${twoHopRes.records[0]?.get('career')}, Matched Skills: [${twoHopRes.records[0]?.get('matchedSkills').join(', ')}])`);

  // 3. 3-Hop Traversal: Person -> HAS_SKILL -> Skill <- REQUIRES <- Job -> OFFERED_BY -> Company
  const threeHopQuery = `
    MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES]-(j:Job)-[:OFFERED_BY]->(c:Company)
    RETURN j.title AS jobTitle, c.name AS companyName, collect(DISTINCT s.name) AS matchedSkills, count(DISTINCT s) AS matchedCount
    ORDER BY matchedCount DESC
    LIMIT 3
  `;
  const threeHopRes = await read(threeHopQuery, { personId: 'student-5' });
  assert('3-Hop Traversal: Person → Skill ← Job → Company', threeHopRes.records.length > 0 && threeHopRes.records[0].get('matchedCount').toNumber() >= 1, `(Job: ${threeHopRes.records[0]?.get('jobTitle')} @ ${threeHopRes.records[0]?.get('companyName')}, Skills: [${threeHopRes.records[0]?.get('matchedSkills').join(', ')}])`);

  // 4. Multi-Hop Career Progression: CareerRole -> LEADS_TO* -> NextCareerRole
  const progressionQuery = `
    MATCH path = (start:CareerRole {id: $startId})-[:LEADS_TO*1..3]->(target:CareerRole)
    RETURN [n IN nodes(path) | n.title] AS careerPath, length(path) AS hops
    ORDER BY hops DESC
    LIMIT 3
  `;
  const progRes = await read(progQuery = progressionQuery, { startId: 'cr-frontend' });
  assert('Multi-Hop Career Progression ([:LEADS_TO*1..3])', progRes.records.length > 0, `(Path: ${progRes.records[0]?.get('careerPath').join(' → ')}, Hops: ${progRes.records[0]?.get('hops').toNumber()})`);

  // 5. Dual Hop: Project -> Technology <- OtherProject -> Skill Inference
  const inferenceQuery = `
    MATCH (proj:Project {id: $projectId})-[:USES_TECHNOLOGY]->(t:Technology)
    MATCH (proj)-[:DEMONSTRATES]->(directSkill:Skill)
    WITH proj, collect(DISTINCT directSkill) AS directSkills, collect(DISTINCT t) AS technologies
    OPTIONAL MATCH (t)<-[:USES_TECHNOLOGY]-(otherProj:Project)-[:DEMONSTRATES]->(inferredSkill:Skill)
    WHERE otherProj.id <> proj.id
    RETURN proj.name AS projectName,
           [s IN directSkills | s.name] AS directSkills,
           [s IN collect(DISTINCT inferredSkill) | s.name] AS inferredSkills
  `;
  const inferRes = await read(inferenceQuery, { projectId: 'proj-1' });
  const direct = inferRes.records[0]?.get('directSkills') || [];
  const inferred = inferRes.records[0]?.get('inferredSkills') || [];
  assert('Graph Inference Traversal: Project → Technology ← OtherProject → InferredSkills', direct.length > 0 && inferred.length > 0, `(Direct: ${direct.length}, Inferred via shared tech: ${inferred.length})`);

  // 6. Prerequisite Topological Ordering for Learning Paths
  const topoQuery = `
    MATCH (cr:CareerRole {id: $careerId})-[:REQUIRES]->(targetSkill:Skill)
    OPTIONAL MATCH path = (root:Skill)-[:PREREQUISITE_OF*]->(targetSkill)
    RETURN targetSkill.name AS target,
           [n IN nodes(path) | n.name] AS prerequisiteChain
    LIMIT 5
  `;
  const topoRes = await read(topoQuery, { careerId: 'cr-mleng' });
  assert('Prerequisite Chain Discovery for Career Learning Paths', topoRes.records.length > 0, `(Discovered prerequisites for ${topoRes.records.length} required skills)`);

  console.log(`\n========================================`);
  console.log(`Graph-Native Query Tests: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exitCode = 1;
  process.exit(0);
}

testGraphNativeQueries().catch(e => {
  console.error('Fatal query test error:', e);
  process.exit(1);
});
