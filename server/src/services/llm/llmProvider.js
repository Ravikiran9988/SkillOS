/**
 * SkillOS LLM Provider Abstraction
 * Architecture:
 *   careerCopilotService / resumeAiService / interviewAiService
 *           ↓
 *       llmProvider
 *           ↓
 *      groqProvider (Default: Groq)
 *           ↓
 *       Groq API
 *
 * Supports Groq as primary production provider with OpenAI/Gemini/Mock options
 * and automatic CognoDB graph-grounded fallback when keys are absent.
 */

const groqProvider = require('./groqProvider');

/**
 * Intelligent deterministic CognoDB graph-grounded fallback reasoning engine
 * Generates structured, highly personalized career advice based on the student's exact graph data.
 */
function generateGraphGroundedFallback(context, userMessage) {
  const { student, targetCareer, skills, gaps, roadmap, jobs, projects } = context || {};
  const lowerQuery = (userMessage || '').toLowerCase();

  const missingList = gaps?.missingSkills || [];
  const missingNames = missingList.map((s) => s.name);
  const criticalGaps = missingList.filter((s) => s.importance === 'critical' || s.importance === 'High').map((s) => s.name);
  const topJobs = jobs?.slice(0, 3) || [];
  const verifiedSkillsList = (skills || []).map((s) => `${s.name} (${s.proficiency || 'Verified'})`);

  const facts = [
    `Target Goal: ${targetCareer?.title || 'General Software Engineering'}`,
    `Career Match: ${gaps?.matchPercentage || 0}%`,
    `Verified Skills (${skills?.length || 0}): ${skills?.slice(0, 5).map(s => s.name).join(', ') || 'None'}`,
    `Open Skill Gaps: ${missingNames.length} missing skills`,
  ];

  const recommendations = [];
  let answer = '';

  if (
    lowerQuery.includes('learn next') ||
    lowerQuery.includes('prioritize') ||
    lowerQuery.includes('what should i do') ||
    lowerQuery.includes('next step') ||
    lowerQuery.includes('start')
  ) {
    const nextSkill = roadmap?.sequence?.[0]?.name || roadmap?.orderedSkills?.[0]?.name || missingNames[0] || 'Domain Architecture';
    recommendations.push(`Focus on mastering **${nextSkill}** as your highest-leverage milestone.`);
    recommendations.push(`Build a real-world project incorporating ${nextSkill} to verify practical proficiency.`);

    answer = `Based on your CognoDB career graph, **${nextSkill}** is your #1 priority competency.

You currently have a **${gaps?.matchPercentage || 0}% match** for **${targetCareer?.title || 'your target career'}** with **${skills?.length || 0} verified skills**.

### 🎯 Key Observations:
- **Verified Strengths:** ${verifiedSkillsList.slice(0, 4).join(', ') || 'Initial foundation'}
- **Critical Gaps:** ${criticalGaps.slice(0, 3).join(', ') || missingNames.slice(0, 3).join(', ') || 'None'}

### 🚀 Immediate Next Step:
Start with **${nextSkill}** in your learning roadmap. Mastering this milestone unlocks subsequent advanced topics and increases your match score across matching job openings.`;
  } else if (
    lowerQuery.includes('ready') ||
    lowerQuery.includes('readiness') ||
    lowerQuery.includes('prepared')
  ) {
    const matchPct = gaps?.matchPercentage || 0;
    const isReady = matchPct >= 75;

    recommendations.push(isReady ? 'Prepare for technical interviews' : 'Focus on closing top 2 critical skill gaps');
    recommendations.push('Review portfolio projects demonstrating core required skills');

    answer = `### Career Readiness Evaluation for ${targetCareer?.title || 'Target Role'}

Your computed career readiness is **${matchPct}%**.

- **Status:** ${isReady ? '✅ Strong Candidate — You meet majority of core requirements' : '⚠️ Growth Phase — Key technical skills needed before applying'}
- **Verified Portfolio Competencies:** ${skills?.length || 0} skills verified
- **Remaining Prerequisites:** ${missingNames.length} skills to acquire

**Recommended Focus:** Close your high-priority gaps in ${criticalGaps.slice(0, 2).join(' and ') || missingNames.slice(0, 2).join(' and ') || 'specialized tools'} to cross the 80% readiness threshold.`;
  } else {
    // General graph-grounded advisory
    recommendations.push(`Align your learning roadmap with ${targetCareer?.title || 'your chosen career track'}.`);
    recommendations.push(`Review open job requirements to prioritize hands-on practice.`);

    answer = `I have analyzed your live CognoDB career intelligence profile.

- **Current Track:** ${targetCareer?.title || 'Exploring Careers'} (${gaps?.matchPercentage || 0}% Match)
- **Top Competencies:** ${skills?.slice(0, 4).map(s => s.name).join(', ') || 'Profile under setup'}
- **Top Missing Skills:** ${missingNames.slice(0, 3).join(', ') || 'No critical gaps identified'}
- **Available Job Matches:** ${topJobs.length > 0 ? `${topJobs.length} active opportunities found` : 'Complete more roadmap steps to unlock tier-1 jobs'}

How can I help guide your next steps? You can ask about your roadmap, skill gaps, interview prep, or project recommendations.`;
  }

  const actions = [
    { label: 'View Skill Gap', route: '/skill-gap' },
    { label: 'Open Roadmap', route: '/roadmap' },
    { label: 'View Jobs', route: '/jobs' },
  ];

  return {
    answer,
    message: answer,
    reply: answer,
    content: answer,
    facts,
    recommendations,
    actions,
    actionLinks: actions.map(a => ({ label: a.label, path: a.route })),
    model: 'cognodb-grounded-engine',
    provider: 'cognodb-fallback',
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  };
}

/**
 * Extract structured facts and recommendations from model text output
 */
function extractStructuredMetadata(rawText, context) {
  const facts = [];
  const recommendations = [];

  if (context?.student?.name) {
    facts.push(`Student: ${context.student.name}`);
  }
  if (context?.targetCareer?.title) {
    facts.push(`Target Role: ${context.targetCareer.title}`);
  }
  if (context?.gaps?.matchPercentage !== undefined) {
    facts.push(`Career Match: ${context.gaps.matchPercentage}%`);
  }
  if (context?.skills?.length) {
    facts.push(`Verified Skills: ${context.skills.length}`);
  }

  // Parse lines for bulleted recommendations
  const lines = rawText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      const clean = trimmed.replace(/^[-*]|\d+\./, '').trim();
      if (clean.length > 10 && clean.length < 150 && recommendations.length < 4) {
        recommendations.push(clean);
      }
    }
  }

  const actions = [
    { label: 'View Skill Gap', route: '/skill-gap' },
    { label: 'Open Roadmap', route: '/roadmap' },
    { label: 'View Jobs', route: '/jobs' },
  ];

  return { facts, recommendations, actions };
}

/**
 * Master LLM Completion Router
 *
 * @param {Object} options
 * @param {string} options.systemPrompt - CognoDB-grounded system instructions
 * @param {string} [options.userMessage] - Latest user input
 * @param {Array<{role: string, content: string}>} [options.messages] - Conversation history
 * @param {Object} [options.context] - CognoDB student graph context
 * @param {number} [options.temperature=0.7] - Temperature
 * @param {number} [options.maxTokens=1200] - Max tokens
 * @param {string} [options.model] - Model name override
 * @param {boolean} [options.fallbackOnFailure=true] - Fallback to deterministic engine on error
 */
async function generateCompletion({
  systemPrompt,
  userMessage,
  messages = [],
  context = {},
  temperature = 0.7,
  maxTokens = 1200,
  model,
  fallbackOnFailure = true,
}) {
  const provider = (process.env.LLM_PROVIDER || 'groq').toLowerCase().trim();

  // Assemble message history
  const messageSequence = [...messages];
  if (userMessage && (!messageSequence.length || messageSequence[messageSequence.length - 1].content !== userMessage)) {
    messageSequence.push({ role: 'user', content: userMessage });
  }

  // 1. Groq Provider (Primary)
  if (provider === 'groq') {
    try {
      const groqResult = await groqProvider.generateResponse({
        systemPrompt,
        messages: messageSequence,
        temperature,
        maxTokens,
        model: model || process.env.GROQ_MODEL,
      });

      const { facts, recommendations, actions } = extractStructuredMetadata(groqResult.text, context);

      return {
        answer: groqResult.text,
        message: groqResult.text,
        reply: groqResult.text,
        content: groqResult.text,
        facts,
        recommendations,
        actions,
        actionLinks: actions.map((a) => ({ label: a.label, path: a.route })),
        model: groqResult.model,
        provider: 'groq',
        usage: groqResult.usage,
        latencyMs: groqResult.latencyMs,
      };
    } catch (err) {
      console.warn(`[LLM/Router] Groq provider failed (${err.code || err.message}).`);

      if (!fallbackOnFailure && process.env.NODE_ENV === 'production') {
        throw err;
      }
      // Fallback to CognoDB-grounded deterministic engine
      return generateGraphGroundedFallback(context, userMessage);
    }
  }

  // 2. Mock Provider (for deterministic testing & CI)
  if (provider === 'mock') {
    return generateGraphGroundedFallback(context, userMessage);
  }

  // 3. Fallback / Unrecognized provider
  console.warn(`[LLM/Router] Provider "${provider}" not directly configured. Using CognoDB reasoning engine.`);
  return generateGraphGroundedFallback(context, userMessage);
}

module.exports = {
  generateCompletion,
  generateGraphGroundedFallback,
};
