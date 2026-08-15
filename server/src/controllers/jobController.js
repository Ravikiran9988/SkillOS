const jobService = require('../services/jobService');

async function getAllJobs(req, res, next) {
  try {
    const jobs = await jobService.getAllJobs();
    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
}

async function getJob(req, res, next) {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}

async function getAllCompanies(req, res, next) {
  try {
    const companies = await jobService.getAllCompanies();
    res.json({ success: true, data: companies });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllJobs, getJob, getAllCompanies };
