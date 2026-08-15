const { v4: uuidv4 } = require('uuid');
const studentRepo = require('../repositories/studentRepository');
const skillRepo = require('../repositories/skillRepository');
const careerRepo = require('../repositories/careerRepository');
const courseRepo = require('../repositories/courseRepository');

async function getAllStudents() {
  return studentRepo.getAllStudents();
}

async function getStudentProfile(personId) {
  const student = await studentRepo.getStudentById(personId);
  if (!student) {
    const err = new Error(`Student with id '${personId}' not found.`);
    err.status = 404;
    throw err;
  }
  const skills = await studentRepo.getStudentSkills(personId);
  const projects = await studentRepo.getStudentProjects(personId);
  return { ...student, skills, projects };
}

async function createStudent(data) {
  const id = data.id || uuidv4();
  return studentRepo.createStudent({ ...data, id });
}

async function addSkillToStudent(personId, skillId, proficiency) {
  return studentRepo.addStudentSkill(personId, skillId, proficiency);
}

async function removeSkillFromStudent(personId, skillId) {
  return studentRepo.removeStudentSkill(personId, skillId);
}

async function setTargetCareer(personId, careerRoleId) {
  return studentRepo.setTargetCareer(personId, careerRoleId);
}

// ─── Career gap analysis ──────────────────────────────────────────────────────
async function getCareerGapAnalysis(personId, careerRoleId) {
  const [student, career, studentSkills, missingSkills] = await Promise.all([
    studentRepo.getStudentById(personId),
    careerRepo.getCareerById(careerRoleId),
    studentRepo.getStudentSkills(personId),
    studentRepo.getMissingSkills(personId, careerRoleId),
  ]);

  if (!student) {
    const err = new Error('Student not found.');
    err.status = 404;
    throw err;
  }
  if (!career) {
    const err = new Error('Career role not found.');
    err.status = 404;
    throw err;
  }

  const studentSkillIds = new Set(studentSkills.map((s) => s.id));
  const matchedSkills = career.requiredSkills.filter((s) => studentSkillIds.has(s.id));
  const totalRequired = career.requiredSkills.length;
  const matchPercentage = totalRequired > 0
    ? Math.round((matchedSkills.length / totalRequired) * 100)
    : 0;

  return {
    student,
    career,
    studentSkills,
    matchedSkills,
    missingSkills,
    matchPercentage,
    totalRequired,
    matchedCount: matchedSkills.length,
  };
}

// ─── Learning path generation ─────────────────────────────────────────────────
// For each missing skill, find prerequisite chain + relevant courses
async function getLearningPath(personId, careerRoleId) {
  const missingSkills = await studentRepo.getMissingSkills(personId, careerRoleId);
  const studentSkills = await studentRepo.getStudentSkills(personId);
  const studentSkillIds = new Set(studentSkills.map((s) => s.id));

  // Build learning path steps for each missing skill
  const steps = await Promise.all(
    missingSkills.map(async (skill) => {
      const prereqChain = await skillRepo.getPrerequisiteChain(skill.id);
      // Filter out skills the student already has from the chain
      const filteredChain = prereqChain.filter((s) => !studentSkillIds.has(s.id));
      const courses = await courseRepo.getCoursesForSkill(skill.id);
      return {
        targetSkill: skill,
        prerequisiteChain: filteredChain,
        courses: courses.slice(0, 2), // Top 2 courses per skill
      };
    })
  );

  // Deduplicate: build a flat ordered skill list (topological-ish order)
  const seen = new Set();
  const orderedSkills = [];
  for (const step of steps) {
    for (const s of step.prerequisiteChain) {
      if (!seen.has(s.id) && !studentSkillIds.has(s.id)) {
        seen.add(s.id);
        orderedSkills.push(s);
      }
    }
    if (!seen.has(step.targetSkill.id)) {
      seen.add(step.targetSkill.id);
      orderedSkills.push(step.targetSkill);
    }
  }

  return { steps, orderedSkills };
}

// ─── Career matches for a student ────────────────────────────────────────────
async function getCareerMatches(personId) {
  const matches = await studentRepo.getCareerMatches(personId);
  const studentSkills = await studentRepo.getStudentSkills(personId);

  if (studentSkills.length === 0) {
    return {
      matches: [],
      message: 'Add at least 3 skills to generate career recommendations.',
      studentSkillCount: 0,
    };
  }

  return {
    matches,
    studentSkillCount: studentSkills.length,
    message: null,
  };
}

async function getStudentGraphData(personId) {
  return studentRepo.getStudentGraphData(personId);
}

module.exports = {
  getAllStudents,
  getStudentProfile,
  createStudent,
  addSkillToStudent,
  removeSkillFromStudent,
  setTargetCareer,
  getCareerGapAnalysis,
  getLearningPath,
  getCareerMatches,
  getStudentGraphData,
};
