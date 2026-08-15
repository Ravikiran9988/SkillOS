const express = require('express');
const router = express.Router();
const c = require('../controllers/jobController');

router.get('/', c.getAllJobs);
router.get('/companies', c.getAllCompanies);
router.get('/:id', c.getJob);

module.exports = router;
