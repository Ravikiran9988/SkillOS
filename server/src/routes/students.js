const express = require('express');
const router = express.Router();
const c = require('../controllers/studentController');
const { requireAuth, requireSelfOrAdmin } = require('../middleware/auth');

// ── /api/students ─────────────────────────────────────────────────────────────
// GET / is now ADMIN-only — see /api/admin/students
// POST / redirected to /api/auth/register

// Protected student-specific routes
router.get('/me', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.getStudent(req, res, next);
});
router.put('/me', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.updateStudent(req, res, next);
});
router.get('/me/skills', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.getStudentSkills(req, res, next);
});
router.post('/me/skills', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.addSkill(req, res, next);
});
router.delete('/me/skills/:skillId', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.removeSkill(req, res, next);
});
router.post('/me/target-career', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.setTargetCareer(req, res, next);
});
router.get('/me/career-match', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.getCareerMatch(req, res, next);
});
router.get('/me/learning-path', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.getLearningPath(req, res, next);
});
router.get('/me/recommended-jobs', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.getRecommendedJobs(req, res, next);
});
router.get('/me/graph', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.getStudentGraph(req, res, next);
});
router.get('/me/saved', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.getSavedItems(req, res, next);
});
router.post('/me/saved', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.saveItem(req, res, next);
});
router.delete('/me/saved/:savedId', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.removeSavedItem(req, res, next);
});
router.get('/me/notifications', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.getNotifications(req, res, next);
});
router.patch('/me/notifications/:notifId/read', requireAuth, (req, res, next) => {
  req.params.id = req.user.id;
  c.markNotificationRead(req, res, next);
});

// Legacy /:id routes — protected with self-or-admin check
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
router.get('/:id/saved', requireAuth, requireSelfOrAdmin, c.getSavedItems);
router.post('/:id/saved', requireAuth, requireSelfOrAdmin, c.saveItem);
router.delete('/:id/saved/:savedId', requireAuth, requireSelfOrAdmin, c.removeSavedItem);
router.get('/:id/notifications', requireAuth, requireSelfOrAdmin, c.getNotifications);
router.patch('/:id/notifications/:notifId/read', requireAuth, requireSelfOrAdmin, c.markNotificationRead);

module.exports = router;
