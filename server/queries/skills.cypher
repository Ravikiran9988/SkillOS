// Query A: Get all skills for a student
MATCH (p:Person {id: $personId})-[r:HAS_SKILL]->(s:Skill)
RETURN s, r.proficiency AS proficiency
ORDER BY s.category, s.name;

// Query F: Prerequisite chain — what must I learn before a skill?
MATCH path = (root:Skill)-[:PREREQUISITE_OF*]->(target:Skill {id: $skillId})
WHERE NOT EXISTS { MATCH (x:Skill)-[:PREREQUISITE_OF]->(root) }
RETURN [node IN nodes(path) | node.id] AS chain,
       length(path) AS depth
ORDER BY depth ASC
LIMIT 1;

// Query H: Project → Technology → Skill inference
MATCH (proj:Project {id: $projectId})
OPTIONAL MATCH (proj)-[:USES_TECHNOLOGY]->(t:Technology)
OPTIONAL MATCH (proj)-[:DEMONSTRATES]->(directSkill:Skill)
WITH proj, collect(DISTINCT directSkill) AS directSkills, collect(DISTINCT t) AS technologies
OPTIONAL MATCH (t)<-[:USES_TECHNOLOGY]-(otherProj:Project)-[:DEMONSTRATES]->(inferredSkill:Skill)
WHERE otherProj.id <> proj.id
RETURN proj,
       [s IN directSkills WHERE s IS NOT NULL] AS directSkills,
       [s IN collect(DISTINCT inferredSkill) WHERE s IS NOT NULL] AS inferredSkills,
       [tech IN technologies WHERE tech IS NOT NULL] AS technologies;
