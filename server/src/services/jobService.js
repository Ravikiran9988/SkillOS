const jobRepo = require('../repositories/jobRepository');
const studentRepo = require('../repositories/studentRepository');

async function getAllJobs() {
  return jobRepo.getAllJobs();
}

async function getJobById(jobId) {
  const job = await jobRepo.getJobById(jobId);
  if (!job) {
    const err = new Error('Job not found.');
    err.status = 404;
    throw err;
  }
  return job;
}

// ─── Recommended jobs for a student — Query E ─────────────────────────────────
async function getRecommendedJobs(personId) {
  const studentSkills = await studentRepo.getStudentSkills(personId);
  if (studentSkills.length === 0) {
    return {
      jobs: [],
      message: 'Add skills to your profile to see job recommendations.',
    };
  }

  const jobs = await jobRepo.getRecommendedJobsForStudent(personId);
  const allSkills = await studentRepo.getStudentSkills(personId);
  const skillMap = {};
  allSkills.forEach((s) => { skillMap[s.id] = s; });

  // Enrich jobs with matched/missing skill objects
  const enriched = jobs.map((j) => ({
    ...j,
    matchedSkills: j.matchedSkillIds.map((id) => skillMap[id]).filter(Boolean),
    missingSkills: j.jobSkills.filter((s) => j.missingSkillIds.includes(s.id)),
  }));

  return { jobs: enriched, message: null };
}

async function getAllCompanies() {
  return jobRepo.getAllCompanies();
}

module.exports = {
  getAllJobs,
  getJobById,
  getRecommendedJobs,
  getAllCompanies,
};
