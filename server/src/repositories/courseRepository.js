const { read } = require('../config/database');

// ─── Query G: Find courses that teach a skill ────────────────────────────────
async function getCoursesForSkill(skillId) {
  const result = await read(
    `MATCH (c:Course)-[:TEACHES]->(s:Skill {id: $skillId})
     RETURN c ORDER BY c.difficulty, c.title`,
    { skillId }
  );
  return result.records.map((rec) => rec.get('c').properties);
}

// ─── Get courses for multiple skills ─────────────────────────────────────────
async function getCoursesForSkills(skillIds) {
  if (!skillIds || skillIds.length === 0) return [];
  const result = await read(
    `MATCH (c:Course)-[:TEACHES]->(s:Skill)
     WHERE s.id IN $skillIds
     RETURN c, s ORDER BY s.name, c.difficulty`,
    { skillIds }
  );
  return result.records.map((rec) => ({
    course: rec.get('c').properties,
    skill: rec.get('s').properties,
  }));
}

// ─── Get all courses ──────────────────────────────────────────────────────────
async function getAllCourses() {
  const result = await read(
    `MATCH (c:Course)-[:TEACHES]->(s:Skill)
     RETURN c, collect(DISTINCT s) AS skills
     ORDER BY c.title`
  );
  return result.records.map((rec) => ({
    ...rec.get('c').properties,
    skills: rec.get('skills').map((s) => s.properties),
  }));
}

module.exports = {
  getCoursesForSkill,
  getCoursesForSkills,
  getAllCourses,
};
