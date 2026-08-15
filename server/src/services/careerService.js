const careerRepo = require('../repositories/careerRepository');
const skillRepo = require('../repositories/skillRepository');
const courseRepo = require('../repositories/courseRepository');

async function getAllCareers() {
  return careerRepo.getAllCareers();
}

async function getCareerDetails(careerRoleId) {
  const career = await careerRepo.getCareerById(careerRoleId);
  if (!career) {
    const err = new Error('Career role not found.');
    err.status = 404;
    throw err;
  }

  // Get related courses for each required skill
  const skillIds = career.requiredSkills.map((s) => s.id);
  const courses = await courseRepo.getCoursesForSkills(skillIds);

  return { ...career, relatedCourses: courses };
}

async function getCareerExplorationGraph() {
  return careerRepo.getCareerExplorationGraph();
}

async function getCareerJobs(careerRoleId) {
  return careerRepo.getJobsForCareer(careerRoleId);
}

async function getCareerPathForStudent(personId) {
  return careerRepo.getCareerPathFromStudent(personId);
}

module.exports = {
  getAllCareers,
  getCareerDetails,
  getCareerExplorationGraph,
  getCareerJobs,
  getCareerPathForStudent,
};
