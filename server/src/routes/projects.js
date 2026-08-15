const express = require('express');
const router = express.Router();
const c = require('../controllers/projectController');

router.get('/', c.getAllProjects);
router.post('/', c.createProject);
router.get('/technologies', c.getAllTechnologies);
router.get('/skills', c.getAllSkills);
router.get('/:id/skills', c.getProjectSkills);

module.exports = router;
