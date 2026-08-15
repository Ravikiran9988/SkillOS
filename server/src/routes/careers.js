const express = require('express');
const router = express.Router();
const c = require('../controllers/careerController');

router.get('/', c.getAllCareers);
router.get('/explore', c.getExplorationGraph);
router.get('/:id', c.getCareer);
router.get('/:id/jobs', c.getCareerJobs);

module.exports = router;
