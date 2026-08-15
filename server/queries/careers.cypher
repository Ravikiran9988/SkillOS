// Query B: Find career roles matching a student's skills
// Person → HAS_SKILL → Skill ← REQUIRES ← CareerRole
MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)
WITH p, collect(s) AS studentSkills, collect(s.id) AS studentSkillIds
MATCH (cr:CareerRole)-[:REQUIRES]->(rs:Skill)
WITH cr, studentSkillIds,
     collect(rs.id) AS requiredSkillIds
WITH cr,
     [id IN requiredSkillIds WHERE id IN studentSkillIds] AS matchedIds,
     [id IN requiredSkillIds WHERE NOT id IN studentSkillIds] AS missingIds,
     size(requiredSkillIds) AS totalRequired
WHERE totalRequired > 0
RETURN cr,
       matchedIds,
       missingIds,
       toFloat(size(matchedIds)) / toFloat(totalRequired) * 100 AS matchPct
ORDER BY matchPct DESC;

// Query C: Find missing skills for a specific career
MATCH (cr:CareerRole {id: $careerRoleId})-[req:REQUIRES]->(rs:Skill)
WHERE NOT EXISTS {
  MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(rs)
}
RETURN rs, req.importance AS importance
ORDER BY req.importance DESC;

// Query D: Multi-hop traversal — Student → Skills → Career → Next Careers
MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES]-(cr:CareerRole)
WITH p, cr, count(s) AS matchCount
ORDER BY matchCount DESC
LIMIT 1
OPTIONAL MATCH careerPath = (cr)-[:LEADS_TO*1..3]->(nextCR:CareerRole)
RETURN cr AS startRole,
       [node IN nodes(careerPath) | node] AS pathRoles;
