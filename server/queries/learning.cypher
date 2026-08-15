// Query G: Find courses for a missing skill
MATCH (c:Course)-[:TEACHES]->(s:Skill {id: $skillId})
RETURN c ORDER BY c.difficulty, c.title;

// Learning path: find prerequisite chain then courses for each step
// Step 1: Find the full prerequisite chain for a skill
MATCH path = (root:Skill)-[:PREREQUISITE_OF*]->(target:Skill {id: $skillId})
WHERE NOT EXISTS { MATCH (x:Skill)-[:PREREQUISITE_OF]->(root) }
WITH [node IN nodes(path) | node] AS chain
UNWIND chain AS skill
OPTIONAL MATCH (c:Course)-[:TEACHES]->(skill)
RETURN skill, collect(c) AS courses;
