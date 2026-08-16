const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const studentService = require('../services/studentService');

/**
 * GET /api/admin/students?page=1&limit=25
 */
router.get('/students', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const all = await studentService.getAllStudents();
    const total = all.length;
    const totalPages = Math.ceil(total / limit);
    const data = all.slice((page - 1) * limit, page * limit);
    res.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/health
 */
router.get('/health', requireAuth, requireAdmin, async (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
