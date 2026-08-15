const { read, write, toNum } = require('../config/database');

// ─── Get all projects ────────────────────────────────────────────────────────
async function getAllProjects() {
  const result = await read(
    `MATCH (proj:Project)
     OPTIONAL MATCH (proj)-[:USES_TECHNOLOGY]->(t:Technology)
     OPTIONAL MATCH (proj)-[:DEMONSTRATES]->(s:Skill)
     RETURN proj,
            collect(DISTINCT t) AS technologies,
            collect(DISTINCT s) AS skills
     ORDER BY proj.name`
  );
  return result.records.map((rec) => ({
    ...rec.get('proj').properties,
    technologies: (rec.get('technologies') || []).filter(Boolean).map((t) => t.properties),
    skills: (rec.get('skills') || []).filter(Boolean).map((s) => s.properties),
  }));
}

// ─── Get project by ID ───────────────────────────────────────────────────────
async function getProjectById(projectId) {
  const result = await read(
    `MATCH (proj:Project {id: $projectId})
     OPTIONAL MATCH (proj)-[:USES_TECHNOLOGY]->(t:Technology)
     OPTIONAL MATCH (proj)-[:DEMONSTRATES]->(s:Skill)
     RETURN proj,
            collect(DISTINCT t) AS technologies,
            collect(DISTINCT s) AS skills`,
    { projectId }
  );
  if (result.records.length === 0) return null;
  const rec = result.records[0];
  return {
    ...rec.get('proj').properties,
    technologies: (rec.get('technologies') || []).filter(Boolean).map((t) => t.properties),
    skills: (rec.get('skills') || []).filter(Boolean).map((s) => s.properties),
  };
}

// ─── Query H: Project → Technology → Skill inference ────────────────────────
// Given a project, traverse USES_TECHNOLOGY → DEMONSTRATES to find skills
async function getSkillsFromProject(projectId) {
  const result = await read(
    `MATCH (proj:Project {id: $projectId})
     OPTIONAL MATCH (proj)-[:USES_TECHNOLOGY]->(t:Technology)
     OPTIONAL MATCH (proj)-[:DEMONSTRATES]->(directSkill:Skill)
     WITH proj, collect(DISTINCT directSkill) AS directSkills, collect(DISTINCT t) AS technologies
     OPTIONAL MATCH (t)<-[:USES_TECHNOLOGY]-(otherProj:Project)-[:DEMONSTRATES]->(inferredSkill:Skill)
     WHERE otherProj.id <> proj.id
     RETURN proj,
            [s IN directSkills WHERE s IS NOT NULL] AS directSkills,
            [s IN collect(DISTINCT inferredSkill) WHERE s IS NOT NULL] AS inferredSkills,
            [tech IN technologies WHERE tech IS NOT NULL] AS technologies`,
    { projectId }
  );

  if (result.records.length === 0) return null;
  const rec = result.records[0];
  return {
    project: rec.get('proj').properties,
    directSkills: (rec.get('directSkills') || []).map((s) => s.properties),
    inferredSkills: (rec.get('inferredSkills') || []).map((s) => s.properties),
    technologies: (rec.get('technologies') || []).map((t) => t.properties),
  };
}

// ─── Get all technologies ─────────────────────────────────────────────────────
async function getAllTechnologies() {
  const result = await read(
    `MATCH (t:Technology)
     RETURN t ORDER BY t.category, t.name`
  );
  return result.records.map((rec) => rec.get('t').properties);
}

// ─── Create a project ────────────────────────────────────────────────────────
async function createProject({ id, name, description, difficulty }) {
  const result = await write(
    `MERGE (proj:Project {id: $id})
     SET proj.name = $name,
         proj.description = $description,
         proj.difficulty = $difficulty
     RETURN proj`,
    { id, name, description, difficulty }
  );
  return result.records[0].get('proj').properties;
}

// ─── Link technology to project ──────────────────────────────────────────────
async function linkTechnologyToProject(projectId, technologyId) {
  await write(
    `MATCH (proj:Project {id: $projectId}), (t:Technology {id: $technologyId})
     MERGE (proj)-[:USES_TECHNOLOGY]->(t)`,
    { projectId, technologyId }
  );
}

module.exports = {
  getAllProjects,
  getProjectById,
  getSkillsFromProject,
  getAllTechnologies,
  createProject,
  linkTechnologyToProject,
};
