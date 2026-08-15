const careerService = require('../services/careerService');

async function getAllCareers(req, res, next) {
  try {
    const careers = await careerService.getAllCareers();
    res.json({ success: true, data: careers });
  } catch (err) {
    next(err);
  }
}

async function getCareer(req, res, next) {
  try {
    const career = await careerService.getCareerDetails(req.params.id);
    res.json({ success: true, data: career });
  } catch (err) {
    next(err);
  }
}

async function getCareerJobs(req, res, next) {
  try {
    const jobs = await careerService.getCareerJobs(req.params.id);
    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
}

async function getExplorationGraph(req, res, next) {
  try {
    const graph = await careerService.getCareerExplorationGraph();
    res.json({ success: true, data: graph });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllCareers, getCareer, getCareerJobs, getExplorationGraph };
