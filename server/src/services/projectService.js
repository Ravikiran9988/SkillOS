const { v4: uuidv4 } = require('uuid');
const projectRepo = require('../repositories/projectRepository');
const studentRepo = require('../repositories/studentRepository');

async function getAllProjects() {
  return projectRepo.getAllProjects();
}

async function getProjectSkillAnalysis(projectId) {
  const analysis = await projectRepo.getSkillsFromProject(projectId);
  if (!analysis) {
    const err = new Error('Project not found.');
    err.status = 404;
    throw err;
  }
  return analysis;
}

async function getAllTechnologies() {
  return projectRepo.getAllTechnologies();
}

async function createProject(personId, projectData, technologyIds) {
  const project = await projectRepo.createProject({
    ...projectData,
    id: projectData.id || uuidv4(),
  });

  // Link technologies
  for (const techId of (technologyIds || [])) {
    await projectRepo.linkTechnologyToProject(project.id, techId);
  }

  // Link project to student
  await studentRepo.addStudentProject(personId, project.id);

  return project;
}

module.exports = {
  getAllProjects,
  getProjectSkillAnalysis,
  getAllTechnologies,
  createProject,
};
