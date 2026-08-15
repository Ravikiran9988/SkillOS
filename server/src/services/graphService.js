const studentRepo = require('../repositories/studentRepository');
const careerRepo = require('../repositories/careerRepository');
const jobRepo = require('../repositories/jobRepository');

/**
 * Assembles a graph visualization payload for a student.
 * Returns nodes and edges for React Flow.
 */
async function getStudentVisualizationGraph(personId) {
  const data = await studentRepo.getStudentGraphData(personId);
  if (!data) {
    const err = new Error('Student not found.');
    err.status = 404;
    throw err;
  }

  const nodes = [];
  const edges = [];
  const addedNodes = new Set();

  const addNode = (id, label, type, extra = {}) => {
    if (!addedNodes.has(id)) {
      addedNodes.add(id);
      nodes.push({ id, label, type, ...extra });
    }
  };

  // Student node
  addNode(`person-${data.student.id}`, data.student.name, 'student', {
    data: data.student,
  });

  // Skill nodes and edges from student
  for (const { skill, proficiency } of data.studentSkills) {
    if (!skill) continue;
    addNode(`skill-${skill.id}`, skill.name, 'skill', { data: skill });
    edges.push({
      id: `hs-${data.student.id}-${skill.id}`,
      source: `person-${data.student.id}`,
      target: `skill-${skill.id}`,
      label: proficiency ? `${proficiency}` : 'HAS_SKILL',
    });
  }

  // Target career node
  if (data.targetCareer) {
    addNode(`career-${data.targetCareer.id}`, data.targetCareer.title, 'career', {
      data: data.targetCareer,
    });
    edges.push({
      id: `targets-${data.student.id}-${data.targetCareer.id}`,
      source: `person-${data.student.id}`,
      target: `career-${data.targetCareer.id}`,
      label: 'TARGETS',
    });

    // Required skills for target career
    for (const skill of data.requiredSkills) {
      if (!skill) continue;
      addNode(`skill-${skill.id}`, skill.name, 'requiredSkill', { data: skill });
      edges.push({
        id: `req-${data.targetCareer.id}-${skill.id}`,
        source: `career-${data.targetCareer.id}`,
        target: `skill-${skill.id}`,
        label: 'REQUIRES',
      });
    }

    // Jobs for target career
    const jobs = await careerRepo.getJobsForCareer(data.targetCareer.id);
    for (const { job, company } of jobs.slice(0, 3)) {
      addNode(`job-${job.id}`, job.title, 'job', { data: job });
      addNode(`company-${company.id}`, company.name, 'company', { data: company });
      edges.push({
        id: `forRole-${job.id}-${data.targetCareer.id}`,
        source: `career-${data.targetCareer.id}`,
        target: `job-${job.id}`,
        label: 'HAS_JOB',
      });
      edges.push({
        id: `offeredBy-${job.id}-${company.id}`,
        source: `job-${job.id}`,
        target: `company-${company.id}`,
        label: 'OFFERED_BY',
      });
    }
  }

  // Project nodes
  for (const proj of data.projects.slice(0, 3)) {
    addNode(`proj-${proj.id}`, proj.name, 'project', { data: proj });
    edges.push({
      id: `worked-${data.student.id}-${proj.id}`,
      source: `person-${data.student.id}`,
      target: `proj-${proj.id}`,
      label: 'WORKED_ON',
    });
  }

  // Technology nodes
  for (const tech of data.technologies.slice(0, 5)) {
    addNode(`tech-${tech.id}`, tech.name, 'technology', { data: tech });
  }

  return { nodes, edges };
}

module.exports = { getStudentVisualizationGraph };
