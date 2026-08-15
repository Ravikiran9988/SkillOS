const projectService = require('../services/projectService');
const skillRepo = require('../repositories/skillRepository');

async function getAllProjects(req, res, next) {
  try {
    const projects = await projectService.getAllProjects();
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
}

async function getProjectSkills(req, res, next) {
  try {
    const analysis = await projectService.getProjectSkillAnalysis(req.params.id);
    res.json({ success: true, data: analysis });
  } catch (err) {
    next(err);
  }
}

async function getAllTechnologies(req, res, next) {
  try {
    const techs = await projectService.getAllTechnologies();
    res.json({ success: true, data: techs });
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const { personId, name, description, difficulty, technologyIds } = req.body;
    if (!personId || !name) {
      const err = new Error('personId and name are required.');
      err.status = 400;
      throw err;
    }
    const project = await projectService.createProject(
      personId,
      { name, description, difficulty: difficulty || 'Intermediate' },
      technologyIds || []
    );
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

async function getAllSkills(req, res, next) {
  try {
    const skills = await skillRepo.getAllSkills();
    res.json({ success: true, data: skills });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllProjects,
  getProjectSkills,
  getAllTechnologies,
  createProject,
  getAllSkills,
};
