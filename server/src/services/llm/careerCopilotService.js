const studentService = require('../studentService');
const careerService = require('../careerService');
const jobService = require('../jobService');
const projectService = require('../projectService');
const { generateCompletion } = require('./llmProvider');

/**
 * Gather full CognoDB graph state for a student
 */
async function buildStudentGraphContext(studentId) {
  const [profile, careerMatchesData, jobsData, projects] = await Promise.all([
    studentService.getStudentProfile(studentId).catch(() => null),
    studentService.getCareerMatches(studentId).catch(() => ({ matches: [] })),
    jobService.getRecommendedJobs(studentId).catch(() => ({ jobs: [] })),
    projectService.getAllProjects().catch(() => []),
  ]);

  const student = profile;
  const skills = profile?.skills || [];
  const careerMatches = careerMatchesData?.matches || [];
  const jobs = jobsData?.jobs || [];

  let targetCareer = student?.targetCareer || (careerMatches.length > 0 ? careerMatches[0].careerRole : null);
  let targetCareerId = targetCareer?.id;

  let skillGap = null;
  let learningPath = null;

  if (targetCareerId) {
    try {
      skillGap = await studentService.getCareerGapAnalysis(studentId, targetCareerId);
    } catch (_) {}
    try {
      learningPath = await studentService.getLearningPath(studentId, targetCareerId);
    } catch (_) {}
  }

  return {
    student,
    skills,
    targetCareer,
    gaps: skillGap || { matchPercentage: 0, matchedSkills: [], missingSkills: [] },
    roadmap: learningPath || { steps: [], orderedSkills: [] },
    jobs,
    projects: projects || [],
  };
}

/**
 * Handle a chat conversation with the AI Career Copilot
 */
async function chatWithCopilot(studentId, userMessage) {
  const context = await buildStudentGraphContext(studentId);

  const missingList = context.gaps?.missingSkills || [];
  const orderedRoadmap = context.roadmap?.orderedSkills || [];
  const jobList = Array.isArray(context.jobs) ? context.jobs : [];

  const systemPrompt = `You are SkillOS AI Career Copilot, an expert career mentor embedded within the SkillOS platform.
You give actionable, empathetic, and strictly accurate career guidance to the student based on their verified CognoDB knowledge graph.

### Verified Student Graph Context:
- Student Name: ${context.student?.name || 'Student'}
- Education Level: ${context.student?.educationLevel || 'Undergraduate'}
- Target Career: ${context.targetCareer?.title || 'Not chosen yet'}
- Career Match: ${context.gaps.matchPercentage || 0}% (${context.gaps.matchedSkills?.length || 0}/${context.gaps.totalRequired || 0} required skills)
- Verified Skills in Portfolio (${context.skills.length}): ${context.skills.map((s) => `${s.name} (${s.proficiency})`).join(', ') || 'None'}
- Missing Skills for Target Role (${missingList.length}): ${missingList.map((s) => `${s.name} [${s.importance}]`).join(', ') || 'None'}
- Top Prerequisite Sequence: ${orderedRoadmap.slice(0, 5).map((s, i) => `${i + 1}. ${s.name}`).join(' -> ') || 'All prerequisites met'}
- Top Matching Jobs: ${jobList.slice(0, 3).map((j) => `${j.title} at ${j.company?.name || 'Company'} (${j.matchPercentage}%)`).join(', ') || 'None'}

### Grounding Rules:
1. Base your reasoning on the verified student graph context above.
2. Differentiate verified facts from general advice.
3. NEVER fabricate company requirements, salary numbers, or fake statistics.
4. Keep answers concise, inspiring, formatted with Markdown headings and bullet points.
5. End with a clear next step for the student.`;

  return generateCompletion(systemPrompt, userMessage, context);
}

module.exports = {
  chatWithCopilot,
  buildStudentGraphContext,
};
