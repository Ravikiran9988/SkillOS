/**
 * SkillOS Resume AI Service
 * Generates graph-grounded professional summaries and project descriptions
 * using the shared Groq / LLM provider.
 */

const { buildStudentGraphContext } = require('./careerCopilotService');
const { generateCompletion } = require('./llmProvider');

/**
 * Generate a professional summary grounded in the student's verified graph data
 */
async function generateResumeSummary(studentId, targetRole) {
  const context = await buildStudentGraphContext(studentId);
  const { student, skills, targetCareer, projects } = context;

  const roleTitle = targetRole || targetCareer?.title || 'Software Engineer';
  const verifiedSkillsStr = skills.map((s) => s.name).join(', ') || 'Core technical foundations';
  const projectsSummary = projects.map((p) => `${p.title}: ${p.description || ''}`).join('; ') || 'Academic coursework';

  const systemPrompt = `You are a professional resume writer for technical candidates.
You write compelling, accurate resume summaries based strictly on the verified candidate data provided.
NEVER invent job titles, years of experience, or skills not listed below.

Candidate Verified Data:
- Name: ${student?.name || 'Candidate'}
- Education: ${student?.educationLevel || 'Degree'}
- Target Role: ${roleTitle}
- Verified Skills: ${verifiedSkillsStr}
- Key Projects: ${projectsSummary}

Write 2 options for a concise, impactful 3-sentence professional resume summary tailored for ${roleTitle}.`;

  return generateCompletion({
    systemPrompt,
    userMessage: `Generate tailored resume summaries for ${roleTitle}.`,
    context,
    temperature: 0.6,
    maxTokens: 500,
  });
}

/**
 * Optimize resume content for a specific target job description
 */
async function optimizeResumeForJob(studentId, jobDescription) {
  const context = await buildStudentGraphContext(studentId);
  const { skills, projects } = context;

  const systemPrompt = `You are a technical recruiter and resume optimizer.
Compare the candidate's verified graph data with the provided job description.
Highlight verified skills matching the requirements and suggest honest ways to frame verified projects.
DO NOT fabricate matching skills if the candidate does not have them.

Candidate Verified Skills: ${skills.map((s) => s.name).join(', ')}
Candidate Projects: ${projects.map((p) => p.title).join(', ')}

Job Description:
${jobDescription.substring(0, 1500)}`;

  return generateCompletion({
    systemPrompt,
    userMessage: 'Analyze skill alignment and provide resume optimization suggestions.',
    context,
    temperature: 0.5,
    maxTokens: 700,
  });
}

module.exports = {
  generateResumeSummary,
  optimizeResumeForJob,
};
