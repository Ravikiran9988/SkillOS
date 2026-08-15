// Query E: Career → Job → Company traversal
MATCH (cr:CareerRole {id: $careerRoleId})<-[:FOR_ROLE]-(j:Job)-[:OFFERED_BY]->(c:Company)
OPTIONAL MATCH (j)-[:REQUIRES]->(js:Skill)
RETURN j, c, collect(DISTINCT js) AS jobSkills
ORDER BY j.title;

// Recommended jobs for a student (skill overlap)
MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)
WITH p, collect(s.id) AS studentSkillIds
MATCH (j:Job)-[:OFFERED_BY]->(c:Company)
MATCH (j)-[:FOR_ROLE]->(cr:CareerRole)
OPTIONAL MATCH (j)-[:REQUIRES]->(js:Skill)
WITH p, studentSkillIds, j, c, cr,
     collect(DISTINCT js.id) AS jobSkillIds
WITH j, c, cr, jobSkillIds, studentSkillIds,
     [id IN jobSkillIds WHERE id IN studentSkillIds] AS matchedIds,
     size(jobSkillIds) AS totalRequired
WHERE totalRequired > 0
RETURN j, c, cr, matchedIds,
       toFloat(size(matchedIds)) / toFloat(totalRequired) * 100 AS matchPct
ORDER BY matchPct DESC
LIMIT 20;
