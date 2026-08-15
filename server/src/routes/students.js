const express = require('express');
const router = express.Router();
const c = require('../controllers/studentController');

// Students
router.get('/', c.getAllStudents);
router.post('/', c.createStudent);
router.get('/:id', c.getStudent);
router.get('/:id/skills', c.getStudentSkills);
router.post('/:id/skills', c.addSkill);
router.delete('/:id/skills/:skillId', c.removeSkill);
router.post('/:id/target-career', c.setTargetCareer);
router.get('/:id/career-match', c.getCareerMatch);
router.get('/:id/learning-path', c.getLearningPath);
router.get('/:id/recommended-jobs', c.getRecommendedJobs);
router.get('/:id/graph', c.getStudentGraph);

module.exports = router;
