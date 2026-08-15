const { read, toNum } = require('../config/database');

// ─── Get all jobs ─────────────────────────────────────────────────────────────
async function getAllJobs() {
  const result = await read(
    `MATCH (j:Job)-[:FOR_ROLE]->(cr:CareerRole)
     MATCH (j)-[:OFFERED_BY]->(c:Company)
     OPTIONAL MATCH (j)-[:REQUIRES]->(s:Skill)
     RETURN j, cr, c, collect(DISTINCT s) AS skills
     ORDER BY j.title`
  );
  return result.records.map((rec) => ({
    job: rec.get('j').properties,
    career: rec.get('cr').properties,
    company: rec.get('c').properties,
    requiredSkills: rec.get('skills').map((s) => s.properties),
  }));
}

// ─── Get job by ID ────────────────────────────────────────────────────────────
async function getJobById(jobId) {
  const result = await read(
    `MATCH (j:Job {id: $jobId})-[:FOR_ROLE]->(cr:CareerRole)
     MATCH (j)-[:OFFERED_BY]->(c:Company)
     OPTIONAL MATCH (j)-[:REQUIRES]->(s:Skill)
     RETURN j, cr, c, collect(DISTINCT s) AS skills`,
    { jobId }
  );
  if (result.records.length === 0) return null;
  const rec = result.records[0];
  return {
    job: rec.get('j').properties,
    career: rec.get('cr').properties,
    company: rec.get('c').properties,
    requiredSkills: rec.get('skills').map((s) => s.properties),
  };
}

// ─── Get recommended jobs for a student based on their skills ─────────────────
// Uses Query E traversal: Student skills → matching jobs → companies
async function getRecommendedJobsForStudent(personId) {
  const result = await read(
    `MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)
     WITH p, collect(s.id) AS studentSkillIds, collect(s) AS studentSkills
     MATCH (j:Job)-[:OFFERED_BY]->(c:Company)
     MATCH (j)-[:FOR_ROLE]->(cr:CareerRole)
     OPTIONAL MATCH (j)-[:REQUIRES]->(js:Skill)
     WITH p, studentSkillIds, j, c, cr,
          collect(DISTINCT js) AS jobSkills,
          collect(DISTINCT js.id) AS jobSkillIds
     WITH p, studentSkillIds, j, c, cr, jobSkills, jobSkillIds,
          [id IN jobSkillIds WHERE id IN studentSkillIds] AS matchedIds,
          [id IN jobSkillIds WHERE NOT id IN studentSkillIds] AS missingIds,
          size(jobSkillIds) AS totalRequired
     WHERE totalRequired > 0
     RETURN j, c, cr, jobSkills, matchedIds, missingIds, totalRequired,
            toFloat(size(matchedIds)) / toFloat(totalRequired) * 100 AS matchPct
     ORDER BY matchPct DESC
     LIMIT 20`,
    { personId }
  );

  return result.records.map((rec) => ({
    job: rec.get('j').properties,
    company: rec.get('c').properties,
    career: rec.get('cr').properties,
    jobSkills: rec.get('jobSkills').map((s) => s.properties),
    matchedSkillIds: rec.get('matchedIds'),
    missingSkillIds: rec.get('missingIds'),
    totalRequired: toNum(rec.get('totalRequired')),
    matchPercentage: Math.round(toNum(rec.get('matchPct'))),
  }));
}

// ─── Get all companies ────────────────────────────────────────────────────────
async function getAllCompanies() {
  const result = await read(
    `MATCH (c:Company)
     OPTIONAL MATCH (c)<-[:OFFERED_BY]-(j:Job)
     RETURN c, count(DISTINCT j) AS jobCount
     ORDER BY c.name`
  );
  return result.records.map((rec) => ({
    ...rec.get('c').properties,
    jobCount: toNum(rec.get('jobCount')),
  }));
}

module.exports = {
  getAllJobs,
  getJobById,
  getRecommendedJobsForStudent,
  getAllCompanies,
};
