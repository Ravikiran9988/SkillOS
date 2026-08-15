const { read, write } = require('../config/database');

// ─── Get all skills ──────────────────────────────────────────────────────────
async function getAllSkills() {
  const result = await read(
    `MATCH (s:Skill)
     RETURN s
     ORDER BY s.category, s.name`
  );
  return result.records.map((rec) => rec.get('s').properties);
}

// ─── Get skill by ID ─────────────────────────────────────────────────────────
async function getSkillById(skillId) {
  const result = await read(
    `MATCH (s:Skill {id: $skillId})
     OPTIONAL MATCH (s)-[:PREREQUISITE_OF]->(next:Skill)
     OPTIONAL MATCH (prev:Skill)-[:PREREQUISITE_OF]->(s)
     RETURN s,
            collect(DISTINCT next) AS nextSkills,
            collect(DISTINCT prev) AS prereqSkills`,
    { skillId }
  );
  if (result.records.length === 0) return null;
  const rec = result.records[0];
  return {
    ...rec.get('s').properties,
    prerequisites: rec.get('prereqSkills').map((s) => s.properties),
    leadsto: rec.get('nextSkills').map((s) => s.properties),
  };
}

// ─── Query F: Prerequisite chain for a skill ─────────────────────────────────
// Traverse PREREQUISITE_OF relationships upward to find what to learn first
async function getPrerequisiteChain(skillId) {
  const result = await read(
    `MATCH path = (root:Skill)-[:PREREQUISITE_OF*]->(target:Skill {id: $skillId})
     WHERE NOT EXISTS { MATCH (x:Skill)-[:PREREQUISITE_OF]->(root) }
     RETURN [node IN nodes(path) | node.id] AS chain,
            [node IN nodes(path) | node.name] AS names,
            length(path) AS depth
     ORDER BY depth DESC
     LIMIT 1`,
    { skillId }
  );

  if (result.records.length === 0) {
    // No prerequisites — the skill itself is the starting point
    const skillResult = await read(
      `MATCH (s:Skill {id: $skillId}) RETURN s`,
      { skillId }
    );
    if (skillResult.records.length === 0) return [];
    return [skillResult.records[0].get('s').properties];
  }

  // Return the full chain as skill objects
  const chainIds = result.records[0].get('chain');
  const chainResult = await read(
    `MATCH (s:Skill) WHERE s.id IN $ids RETURN s`,
    { ids: chainIds }
  );
  const skillMap = {};
  chainResult.records.forEach((rec) => {
    const s = rec.get('s').properties;
    skillMap[s.id] = s;
  });
  return chainIds.map((id) => skillMap[id]).filter(Boolean);
}

// ─── Get skills by category ──────────────────────────────────────────────────
async function getSkillsByCategory(category) {
  const result = await read(
    `MATCH (s:Skill {category: $category})
     RETURN s ORDER BY s.name`,
    { category }
  );
  return result.records.map((rec) => rec.get('s').properties);
}

// ─── Get skill prerequisites (direct) ───────────────────────────────────────
async function getDirectPrerequisites(skillId) {
  const result = await read(
    `MATCH (prereq:Skill)-[:PREREQUISITE_OF]->(s:Skill {id: $skillId})
     RETURN prereq ORDER BY prereq.difficulty`,
    { skillId }
  );
  return result.records.map((rec) => rec.get('prereq').properties);
}

// ─── Get skills related to a technology ─────────────────────────────────────
async function getSkillsForTechnology(technologyId) {
  const result = await read(
    `MATCH (t:Technology {id: $technologyId})<-[:USES_TECHNOLOGY]-(proj:Project)-[:DEMONSTRATES]->(s:Skill)
     RETURN DISTINCT s`,
    { technologyId }
  );
  return result.records.map((rec) => rec.get('s').properties);
}

module.exports = {
  getAllSkills,
  getSkillById,
  getPrerequisiteChain,
  getSkillsByCategory,
  getDirectPrerequisites,
  getSkillsForTechnology,
};
