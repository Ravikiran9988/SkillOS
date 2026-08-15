const express = require('express');
const router = express.Router();
const c = require('../controllers/studentController');
const { requireAuth, requireSelfOrAdmin } = require('../middleware/auth');

// Public/Admin list and create
router.get('/', c.getAllStudents);
router.post('/', c.createStudent);

// Student-Specific Endpoints (Protected with Data Isolation)
// Supports both '/api/students/me/...' and '/api/students/:id/...'
router.get('/:id', requireAuth, requireSelfOrAdmin, c.getStudent);
router.put('/:id', requireAuth, requireSelfOrAdmin, c.updateStudent);
router.get('/:id/skills', requireAuth, requireSelfOrAdmin, c.getStudentSkills);
router.post('/:id/skills', requireAuth, requireSelfOrAdmin, c.addSkill);
router.delete('/:id/skills/:skillId', requireAuth, requireSelfOrAdmin, c.removeSkill);
router.post('/:id/target-career', requireAuth, requireSelfOrAdmin, c.setTargetCareer);
router.get('/:id/career-match', requireAuth, requireSelfOrAdmin, c.getCareerMatch);
router.get('/:id/learning-path', requireAuth, requireSelfOrAdmin, c.getLearningPath);
router.get('/:id/recommended-jobs', requireAuth, requireSelfOrAdmin, c.getRecommendedJobs);
router.get('/:id/graph', requireAuth, requireSelfOrAdmin, c.getStudentGraph);

module.exports = router;
