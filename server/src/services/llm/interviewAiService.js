/**
 * SkillOS Interview AI Service
 * Generates tailored interview questions based on student's target career & gaps
 * and evaluates candidate answers using the shared Groq / LLM provider.
 */

const { buildStudentGraphContext } = require('./careerCopilotService');
const { generateCompletion } = require('./llmProvider');

/**
 * Generate targeted mock interview questions
 */
async function generateInterviewQuestions(studentId, category = 'technical') {
  const context = await buildStudentGraphContext(studentId);
  const { targetCareer, gaps, skills } = context;

  const roleTitle = targetCareer?.title || 'Software Engineer';
  const missingNames = gaps?.missingSkills?.map((s) => s.name).join(', ') || 'Core algorithms';
  const verifiedNames = skills?.map((s) => s.name).join(', ') || 'Programming basics';

  const systemPrompt = `You are a senior technical interviewer conducting a mock interview for a ${roleTitle} position.
Generate 3 challenging, realistic ${category} interview questions tailored to:
1. Candidate's verified strengths: ${verifiedNames}
2. Critical growth areas for this target role: ${missingNames}

For each question:
- State the question clearly
- State what a top candidate should cover
- Mention the difficulty level (Easy/Medium/Hard)`;

  return generateCompletion({
    systemPrompt,
    userMessage: `Generate 3 ${category} interview questions for ${roleTitle}.`,
    context,
    temperature: 0.7,
    maxTokens: 800,
  });
}

/**
 * Evaluate candidate's mock interview answer
 */
async function evaluateInterviewAnswer(studentId, question, candidateAnswer) {
  const context = await buildStudentGraphContext(studentId);
  const { targetCareer } = context;

  const systemPrompt = `You are an expert technical interviewer evaluating a student's answer for a ${targetCareer?.title || 'technical'} role.

Evaluation Rubric:
1. Score (1 to 10)
2. What was strong in the response
3. Missing technical depth or edge cases to consider
4. Model answer demonstration
5. Recommended roadmap topic from SkillOS to improve

Be constructive, specific, and encouraging.`;

  const userMessage = `Interview Question: "${question}"\n\nCandidate's Answer: "${candidateAnswer.substring(0, 3000)}"`;

  return generateCompletion({
    systemPrompt,
    userMessage,
    context,
    temperature: 0.5,
    maxTokens: 900,
  });
}

module.exports = {
  generateInterviewQuestions,
  evaluateInterviewAnswer,
};
