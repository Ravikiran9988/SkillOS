const { read, write, toNum } = require('../config/database');

// ─── Query A: Get all skills for a student ──────────────────────────────────
async function getStudentSkills(personId) {
  const result = await read(
    `MATCH (p:Person {id: $personId})-[r:HAS_SKILL]->(s:Skill)
     RETURN s, r.proficiency AS proficiency
     ORDER BY s.category, s.name`,
    { personId }
  );
  return result.records.map((rec) => ({
    ...rec.get('s').properties,
    proficiency: rec.get('proficiency'),
  }));
}

// ─── Get all students ───────────────────────────────────────────────────────
async function getAllStudents() {
  const result = await read(
    `MATCH (p:Person)
     OPTIONAL MATCH (p)-[:TARGETS]->(cr:CareerRole)
     OPTIONAL MATCH (p)-[:HAS_SKILL]->(s:Skill)
     RETURN p, cr.title AS targetCareer, count(DISTINCT s) AS skillCount
     ORDER BY p.name`
  );
  return result.records.map((rec) => ({
    ...rec.get('p').properties,
    targetCareer: rec.get('targetCareer'),
    skillCount: toNum(rec.get('skillCount')),
  }));
}

// ─── Get student by ID ──────────────────────────────────────────────────────
async function getStudentById(personId) {
  const result = await read(
    `MATCH (p:Person {id: $personId})
     OPTIONAL MATCH (p)-[:TARGETS]->(cr:CareerRole)
     RETURN p, cr`,
    { personId }
  );
  if (result.records.length === 0) return null;
  const rec = result.records[0];
  return {
    ...rec.get('p').properties,
    targetCareer: rec.get('cr') ? rec.get('cr').properties : null,
  };
}

// ─── Create a new student ───────────────────────────────────────────────────
async function createStudent({ id, name, email, educationLevel }) {
  const result = await write(
    `MERGE (p:Person {id: $id})
     SET p.name = $name,
         p.email = $email,
         p.educationLevel = $educationLevel
     RETURN p`,
    { id, name, email, educationLevel }
  );
  return result.records[0].get('p').properties;
}

// ─── Update student profile ────────────────────────────────────────────────
async function updateStudent(personId, data) {
  const {
    name,
    headline,
    bio,
    phone,
    location,
    country,
    github,
    linkedin,
    portfolio,
    leetcode,
    kaggle,
    educationLevel,
    branch,
    university,
    graduationYear,
    cgpa,
    experienceYears,
    preferredLocation,
    expectedSalary,
    workPreference,
    education,
    experience,
    certifications,
  } = data;

  const result = await write(
    `MATCH (p:Person {id: $personId})
     SET p.name = COALESCE($name, p.name),
         p.headline = COALESCE($headline, p.headline),
         p.bio = COALESCE($bio, p.bio),
         p.phone = COALESCE($phone, p.phone),
         p.location = COALESCE($location, p.location),
         p.country = COALESCE($country, p.country),
         p.github = COALESCE($github, p.github),
         p.linkedin = COALESCE($linkedin, p.linkedin),
         p.portfolio = COALESCE($portfolio, p.portfolio),
         p.leetcode = COALESCE($leetcode, p.leetcode),
         p.kaggle = COALESCE($kaggle, p.kaggle),
         p.educationLevel = COALESCE($educationLevel, p.educationLevel),
         p.branch = COALESCE($branch, p.branch),
         p.university = COALESCE($university, p.university),
         p.graduationYear = COALESCE($graduationYear, p.graduationYear),
         p.cgpa = COALESCE($cgpa, p.cgpa),
         p.experienceYears = COALESCE($experienceYears, p.experienceYears),
         p.preferredLocation = COALESCE($preferredLocation, p.preferredLocation),
         p.expectedSalary = COALESCE($expectedSalary, p.expectedSalary),
         p.workPreference = COALESCE($workPreference, p.workPreference),
         p.educationJson = COALESCE($educationJson, p.educationJson),
         p.experienceJson = COALESCE($experienceJson, p.experienceJson),
         p.certificationsJson = COALESCE($certificationsJson, p.certificationsJson),
         p.updatedAt = datetime()
     RETURN p`,
    {
      personId,
      name: name || null,
      headline: headline || null,
      bio: bio || null,
      phone: phone || null,
      location: location || null,
      country: country || null,
      github: github || null,
      linkedin: linkedin || null,
      portfolio: portfolio || null,
      leetcode: leetcode || null,
      kaggle: kaggle || null,
      educationLevel: educationLevel || null,
      branch: branch || null,
      university: university || null,
      graduationYear: graduationYear || null,
      cgpa: cgpa || null,
      experienceYears: experienceYears || null,
      preferredLocation: preferredLocation || null,
      expectedSalary: expectedSalary || null,
      workPreference: workPreference || null,
      educationJson: education ? JSON.stringify(education) : null,
      experienceJson: experience ? JSON.stringify(experience) : null,
      certificationsJson: certifications ? JSON.stringify(certifications) : null,
    }
  );
  if (result.records.length === 0) return null;
  return result.records[0].get('p').properties;
}

// ─── Add skill to student ───────────────────────────────────────────────────
async function addStudentSkill(personId, skillId, proficiency) {
  const result = await write(
    `MATCH (p:Person {id: $personId}), (s:Skill {id: $skillId})
     MERGE (p)-[r:HAS_SKILL]->(s)
     SET r.proficiency = $proficiency
     RETURN p, s, r`,
    { personId, skillId, proficiency }
  );
  if (result.records.length === 0) {
    const err = new Error('Student or skill not found.');
    err.status = 404;
    throw err;
  }
  return result.records[0].get('s').properties;
}

// ─── Remove skill from student ──────────────────────────────────────────────
async function removeStudentSkill(personId, skillId) {
  await write(
    `MATCH (p:Person {id: $personId})-[r:HAS_SKILL]->(s:Skill {id: $skillId})
     DELETE r`,
    { personId, skillId }
  );
}

// ─── Set target career role ─────────────────────────────────────────────────
async function setTargetCareer(personId, careerRoleId) {
  const result = await write(
    `MATCH (p:Person {id: $personId}), (cr:CareerRole {id: $careerRoleId})
     OPTIONAL MATCH (p)-[old:TARGETS]->()
     DELETE old
     WITH p, cr
     MERGE (p)-[r:TARGETS]->(cr)
     RETURN p, cr`,
    { personId, careerRoleId }
  );
  if (result.records.length === 0) {
    const err = new Error('Student or career role not found.');
    err.status = 404;
    throw err;
  }
  return result.records[0].get('cr').properties;
}

// ─── Get student projects ───────────────────────────────────────────────────
async function getStudentProjects(personId) {
  const result = await read(
    `MATCH (p:Person {id: $personId})-[:WORKED_ON]->(proj:Project)
     OPTIONAL MATCH (proj)-[:USES_TECHNOLOGY]->(t:Technology)
     OPTIONAL MATCH (proj)-[:DEMONSTRATES]->(s:Skill)
     RETURN proj,
            collect(DISTINCT t) AS technologies,
            collect(DISTINCT s) AS skills`,
    { personId }
  );
  return result.records.map((rec) => ({
    ...rec.get('proj').properties,
    technologies: (rec.get('technologies') || []).filter(Boolean).map((t) => t.properties),
    skills: (rec.get('skills') || []).filter(Boolean).map((s) => s.properties),
  }));
}

// ─── Add project to student ─────────────────────────────────────────────────
async function addStudentProject(personId, projectId) {
  await write(
    `MATCH (p:Person {id: $personId}), (proj:Project {id: $projectId})
     MERGE (p)-[:WORKED_ON]->(proj)`,
    { personId, projectId }
  );
}

// ─── Query B: Career match — Query D: multi-hop traversal ───────────────────
// Person → HAS_SKILL → Skill ← REQUIRES ← CareerRole
async function getCareerMatches(personId) {
  const result = await read(
    `MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)
     WITH p, collect(s) AS studentSkills, collect(s.id) AS studentSkillIds
     MATCH (cr:CareerRole)-[:REQUIRES]->(rs:Skill)
     WITH cr, studentSkills, studentSkillIds,
          collect(rs) AS requiredSkills,
          collect(rs.id) AS requiredSkillIds
     WITH cr,
          studentSkills,
          requiredSkills,
          [id IN requiredSkillIds WHERE id IN studentSkillIds] AS matchedIds,
          [id IN requiredSkillIds WHERE NOT id IN studentSkillIds] AS missingIds,
          size(requiredSkillIds) AS totalRequired
     WHERE totalRequired > 0
     RETURN cr,
            matchedIds,
            missingIds,
            totalRequired,
            toFloat(size(matchedIds)) / toFloat(totalRequired) * 100 AS matchPct
     ORDER BY matchPct DESC`,
    { personId }
  );

  return result.records.map((rec) => ({
    career: rec.get('cr').properties,
    matchedSkillIds: rec.get('matchedIds') || [],
    missingSkillIds: rec.get('missingIds') || [],
    totalRequired: toNum(rec.get('totalRequired')),
    matchPercentage: Math.round(toNum(rec.get('matchPct'))),
  }));
}

// ─── Query C: Missing skills for a specific career ──────────────────────────
async function getMissingSkills(personId, careerRoleId) {
  const result = await read(
    `MATCH (cr:CareerRole {id: $careerRoleId})-[req:REQUIRES]->(rs:Skill)
     WHERE NOT EXISTS {
       MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(rs)
     }
     RETURN rs, req.importance AS importance
     ORDER BY req.importance DESC, rs.difficulty`,
    { personId, careerRoleId }
  );
  return result.records.map((rec) => ({
    ...rec.get('rs').properties,
    importance: rec.get('importance'),
  }));
}

// ─── Get student graph data (for visualization) ─────────────────────────────
async function getStudentGraphData(personId) {
  const result = await read(
    `MATCH (p:Person {id: $personId})
     OPTIONAL MATCH (p)-[hs:HAS_SKILL]->(s:Skill)
     OPTIONAL MATCH (p)-[:TARGETS]->(cr:CareerRole)
     OPTIONAL MATCH (cr)-[:REQUIRES]->(rs:Skill)
     OPTIONAL MATCH (p)-[:WORKED_ON]->(proj:Project)
     OPTIONAL MATCH (proj)-[:USES_TECHNOLOGY]->(t:Technology)
     RETURN p,
            collect(DISTINCT {skill: s, proficiency: hs.proficiency}) AS studentSkills,
            cr,
            collect(DISTINCT rs) AS requiredSkills,
            collect(DISTINCT proj) AS projects,
            collect(DISTINCT t) AS technologies`,
    { personId }
  );
  if (result.records.length === 0) return null;
  const rec = result.records[0];
  return {
    student: rec.get('p').properties,
    studentSkills: rec.get('studentSkills').filter((x) => x.skill),
    targetCareer: rec.get('cr') ? rec.get('cr').properties : null,
    requiredSkills: rec.get('requiredSkills').filter(Boolean).map((s) => s.properties),
    projects: rec.get('projects').filter(Boolean).map((p) => p.properties),
    technologies: rec.get('technologies').filter(Boolean).map((t) => t.properties),
  };
}

// ─── Saved Items (Graph-backed) ───────────────────────────────────────────
async function getSavedItems(personId) {
  const result = await read(
    `MATCH (p:Person {id: $personId})-[r:SAVED]->()
     RETURN r.id AS id, r.type AS type, r.savedAt AS savedAt,
            r.itemId AS itemId, r.title AS title, r.name AS name
     ORDER BY r.savedAt DESC`,
    { personId }
  );
  return result.records.map((rec) => ({
    id: rec.get('id') || rec.get('itemId'),
    type: rec.get('type') || 'careers',
    savedAt: rec.get('savedAt'),
    itemId: rec.get('itemId'),
    title: rec.get('title') || rec.get('name'),
    name: rec.get('name') || rec.get('title'),
  }));
}

async function saveItem(personId, { type, itemId }) {
  const savedId = `save-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  
  await write(
    `MATCH (p:Person {id: $personId})
     OPTIONAL MATCH (item {id: $itemId})
     MERGE (p)-[r:SAVED {itemId: $itemId}]->(p)
     SET r.id = COALESCE(r.id, $savedId),
         r.type = $type,
         r.savedAt = COALESCE(r.savedAt, $now),
         r.title = COALESCE(item.title, item.name, $itemId),
         r.name = COALESCE(item.name, item.title, $itemId)
     RETURN r`,
    { personId, itemId, type: type || 'careers', savedId, now }
  );

  return { id: savedId, type: type || 'careers', itemId, savedAt: now };
}

async function removeSavedItem(personId, savedId) {
  await write(
    `MATCH (p:Person {id: $personId})-[r:SAVED]->()
     WHERE r.id = $savedId OR r.itemId = $savedId
     DELETE r`,
    { personId, savedId }
  );
  return { success: true };
}

// In-memory store for student in-app notifications
const studentNotifications = new Map();

async function getNotifications(personId) {
  if (!studentNotifications.has(personId)) {
    studentNotifications.set(personId, [
      {
        id: `notif-1-${personId}`,
        title: 'Welcome to SkillOS!',
        message: 'Your personal AI Career Copilot and graph intelligence are active.',
        read: false,
        time: 'Just now',
        createdAt: new Date().toISOString(),
      },
      {
        id: `notif-2-${personId}`,
        title: 'Roadmap Ready',
        message: 'Check your personalized skill progression path.',
        read: false,
        time: '1h ago',
        createdAt: new Date().toISOString(),
      },
    ]);
  }
  return studentNotifications.get(personId);
}

async function markNotificationRead(personId, notifId) {
  const list = studentNotifications.get(personId) || [];
  const notif = list.find((n) => n.id === notifId);
  if (notif) notif.read = true;
  return { success: true };
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  getStudentSkills,
  addStudentSkill,
  removeStudentSkill,
  setTargetCareer,
  getStudentProjects,
  addStudentProject,
  getCareerMatches,
  getMissingSkills,
  getStudentGraphData,
  getSavedItems,
  saveItem,
  removeSavedItem,
  getNotifications,
  markNotificationRead,
};
