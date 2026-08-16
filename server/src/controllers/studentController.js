const studentService = require('../services/studentService');
const skillRepo = require('../repositories/skillRepository');

async function getAllStudents(req, res, next) {
  try {
    const students = await studentService.getAllStudents();
    res.json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
}

async function getStudent(req, res, next) {
  try {
    const profile = await studentService.getStudentProfile(req.params.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function createStudent(req, res, next) {
  try {
    const student = await studentService.createStudent(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
}

async function updateStudent(req, res, next) {
  try {
    const updated = await studentService.updateStudentProfile(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function getStudentSkills(req, res, next) {
  try {
    const { getStudentSkills } = require('../repositories/studentRepository');
    const skills = await getStudentSkills(req.params.id);
    res.json({ success: true, data: skills });
  } catch (err) {
    next(err);
  }
}

async function addSkill(req, res, next) {
  try {
    const { skillId, proficiency } = req.body;
    if (!skillId) {
      const err = new Error('skillId is required.');
      err.status = 400;
      throw err;
    }
    const skill = await studentService.addSkillToStudent(
      req.params.id,
      skillId,
      proficiency || 'Beginner'
    );
    res.json({ success: true, data: skill });
  } catch (err) {
    next(err);
  }
}

async function removeSkill(req, res, next) {
  try {
    await studentService.removeSkillFromStudent(req.params.id, req.params.skillId);
    res.json({ success: true, message: 'Skill removed.' });
  } catch (err) {
    next(err);
  }
}

async function setTargetCareer(req, res, next) {
  try {
    const { careerRoleId } = req.body;
    if (!careerRoleId) {
      const err = new Error('careerRoleId is required.');
      err.status = 400;
      throw err;
    }
    const career = await studentService.setTargetCareer(req.params.id, careerRoleId);
    res.json({ success: true, data: career });
  } catch (err) {
    next(err);
  }
}

async function getCareerMatch(req, res, next) {
  try {
    const { careerId } = req.query;
    if (careerId) {
      const gap = await studentService.getCareerGapAnalysis(req.params.id, careerId);
      return res.json({ success: true, data: gap });
    }
    const matches = await studentService.getCareerMatches(req.params.id);
    res.json({ success: true, data: matches });
  } catch (err) {
    next(err);
  }
}

async function getLearningPath(req, res, next) {
  try {
    const { careerId } = req.query;
    if (!careerId) {
      const err = new Error('careerId query parameter is required.');
      err.status = 400;
      throw err;
    }
    const path = await studentService.getLearningPath(req.params.id, careerId);
    res.json({ success: true, data: path });
  } catch (err) {
    next(err);
  }
}

async function getRecommendedJobs(req, res, next) {
  try {
    const { getRecommendedJobs } = require('../services/jobService');
    const result = await getRecommendedJobs(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getStudentGraph(req, res, next) {
  try {
    const { getStudentVisualizationGraph } = require('../services/graphService');
    const graph = await getStudentVisualizationGraph(req.params.id);
    res.json({ success: true, data: graph });
  } catch (err) {
    next(err);
  }
}

async function getSavedItems(req, res, next) {
  try {
    const studentRepo = require('../repositories/studentRepository');
    const items = await studentRepo.getSavedItems(req.params.id);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

async function saveItem(req, res, next) {
  try {
    const { type, itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'bad_request', message: 'itemId is required.' });
    }
    const studentRepo = require('../repositories/studentRepository');
    const saved = await studentRepo.saveItem(req.params.id, { type, itemId });
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
}

async function removeSavedItem(req, res, next) {
  try {
    const studentRepo = require('../repositories/studentRepository');
    const result = await studentRepo.removeSavedItem(req.params.id, req.params.savedId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getNotifications(req, res, next) {
  try {
    const studentRepo = require('../repositories/studentRepository');
    const notifs = await studentRepo.getNotifications(req.params.id);
    res.json({ success: true, data: notifs });
  } catch (err) {
    next(err);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const studentRepo = require('../repositories/studentRepository');
    const result = await studentRepo.markNotificationRead(req.params.id, req.params.notifId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  getStudentSkills,
  addSkill,
  removeSkill,
  setTargetCareer,
  getCareerMatch,
  getLearningPath,
  getRecommendedJobs,
  getStudentGraph,
  getSavedItems,
  saveItem,
  removeSavedItem,
  getNotifications,
  markNotificationRead,
};
