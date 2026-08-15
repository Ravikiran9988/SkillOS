const { read, write, toNum } = require('../config/database');

// ─── Get all career roles ────────────────────────────────────────────────────
async function getAllCareers() {
  const result = await read(
    `MATCH (cr:CareerRole)
     OPTIONAL MATCH (cr)-[:REQUIRES]->(s:Skill)
     RETURN cr, count(DISTINCT s) AS skillCount
     ORDER BY cr.title`
  );
  return result.records.map((rec) => ({
    ...rec.get('cr').properties,
    requiredSkillCount: toNum(rec.get('skillCount')),
  }));
}

// ─── Get career role by ID with full detail ──────────────────────────────────
async function getCareerById(careerRoleId) {
  const result = await read(
    `MATCH (cr:CareerRole {id: $careerRoleId})
     OPTIONAL MATCH (cr)-[req:REQUIRES]->(s:Skill)
     OPTIONAL MATCH (cr)-[:LEADS_TO]->(nextRole:CareerRole)
     OPTIONAL MATCH (prevRole:CareerRole)-[:LEADS_TO]->(cr)
     RETURN cr,
            collect(DISTINCT {skill: s, importance: req.importance}) AS requiredSkills,
            collect(DISTINCT nextRole) AS leadsto,
            collect(DISTINCT prevRole) AS comesFrom`,
    { careerRoleId }
  );
  if (result.records.length === 0) return null;
  const rec = result.records[0];
  return {
    ...rec.get('cr').properties,
    requiredSkills: rec.get('requiredSkills')
      .filter((x) => x.skill)
      .map((x) => ({ ...x.skill.properties, importance: x.importance })),
    leadsTo: rec.get('leadsto').filter(Boolean).map((r) => r.properties),
    comesFrom: rec.get('comesFrom').filter(Boolean).map((r) => r.properties),
  };
}

// ─── Query D: Multi-hop traversal ────────────────────────────────────────────
// Person → HAS_SKILL → Skill ← REQUIRES ← CareerRole → LEADS_TO → CareerRole
async function getCareerPathFromStudent(personId) {
  const result = await read(
    `MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES]-(cr:CareerRole)
     WITH p, cr, count(s) AS matchCount
     ORDER BY matchCount DESC
     LIMIT 1
     OPTIONAL MATCH careerPath = (cr)-[:LEADS_TO*1..3]->(nextCR:CareerRole)
     RETURN cr AS startRole,
            [node IN nodes(careerPath) | node] AS pathRoles`,
    { personId }
  );
  if (result.records.length === 0) return null;
  const rec = result.records[0];
  const startRole = rec.get('startRole').properties;
  const pathNodes = rec.get('pathRoles') || [];
  const pathRoles = pathNodes.filter(Boolean).map((n) => n.properties);
  return { startRole, pathRoles };
}

// ─── Query E: CareerRole → Job → Company traversal ──────────────────────────
async function getJobsForCareer(careerRoleId) {
  const result = await read(
    `MATCH (cr:CareerRole {id: $careerRoleId})<-[:FOR_ROLE]-(j:Job)-[:OFFERED_BY]->(c:Company)
     OPTIONAL MATCH (j)-[:REQUIRES]->(js:Skill)
     RETURN j, c, collect(DISTINCT js) AS jobSkills
     ORDER BY j.title`,
    { careerRoleId }
  );
  return result.records.map((rec) => ({
    job: rec.get('j').properties,
    company: rec.get('c').properties,
    skills: rec.get('jobSkills').map((s) => s.properties),
  }));
}

// ─── Get career roles for exploration (LEADS_TO graph) ──────────────────────
async function getCareerExplorationGraph() {
  const result = await read(
    `MATCH (cr:CareerRole)
     OPTIONAL MATCH (cr)-[:LEADS_TO]->(next:CareerRole)
     RETURN cr, collect(DISTINCT next) AS leadsTo`
  );
  return result.records.map((rec) => ({
    career: rec.get('cr').properties,
    leadsTo: rec.get('leadsTo').filter(Boolean).map((r) => r.properties),
  }));
}

module.exports = {
  getAllCareers,
  getCareerById,
  getCareerPathFromStudent,
  getJobsForCareer,
  getCareerExplorationGraph,
};
