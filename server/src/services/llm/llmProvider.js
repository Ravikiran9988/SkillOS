/**
 * SkillOS LLM Provider Abstraction
 * Supports configurable LLM endpoints (Gemini / OpenAI) with built-in
 * graph-grounded intelligent reasoning fallback when no API key is provided.
 */

const https = require('https');

async function callOpenAI(apiKey, model, systemPrompt, userMessage) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const req = https.request(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.choices && json.choices.length > 0) {
              resolve(json.choices[0].message.content);
            } else {
              reject(new Error(json.error?.message || 'OpenAI API error'));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function callGemini(apiKey, model, systemPrompt, userMessage) {
  const modelName = model || 'gemini-1.5-flash';
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMessage}` }],
        },
      ],
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              resolve(text);
            } else {
              reject(new Error(json.error?.message || 'Gemini API response format error'));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Intelligent deterministic graph-grounded fallback reasoning engine
 * Generates structured, highly personalized career advice based on the student's exact graph data.
 */
function generateGraphGroundedResponse(context, userMessage) {
  const { student, targetCareer, skills, gaps, roadmap, jobs, projects } = context;
  const lowerQuery = userMessage.toLowerCase();

  const missingNames = gaps.missingSkills?.map((s) => s.name) || [];
  const criticalGaps = gaps.missingSkills?.filter((s) => s.importance === 'critical').map((s) => s.name) || [];
  const topJobs = jobs?.slice(0, 3) || [];
  const topJobTitles = topJobs.map((j) => `${j.title} at ${j.company?.name || 'Top Company'}`).join(', ');

  // 1. "What should I learn next?" or prioritization
  if (
    lowerQuery.includes('learn next') ||
    lowerQuery.includes('prioritize') ||
    lowerQuery.includes('what should i do') ||
    lowerQuery.includes('next step')
  ) {
    const nextSkill = roadmap?.sequence?.[0]?.name || missingNames[0] || 'advanced domain frameworks';
    const topPrereq = roadmap?.sequence?.slice(0, 3).map((s, i) => `${i + 1}. **${s.name}** (Unlocks: ${s.prerequisiteOf || targetCareer?.title || 'next level'})`).join('\n') || '';

    return {
      message: `Based on your CognoDB career graph, **${nextSkill}** is your highest-priority competency.

You currently match **${gaps.matchPercentage || 0}%** of the requirements for **${targetCareer?.title || 'your target career'}**.

### Recommended Learning Sequence:
${topPrereq || `1. Master ${nextSkill}\n2. Apply it to an open-source project`}

### Why this matters:
- It directly resolves a ${criticalGaps.includes(nextSkill) ? 'critical' : 'high-priority'} requirement for **${targetCareer?.title || 'your goal'}**.
- It is required by top matching roles like **${topJobTitles || 'open industry roles'}**.`,
      actionLinks: [
        { label: 'View Learning Roadmap', path: '/roadmap' },
        { label: 'Inspect Skill Gap', path: '/skill-gap' },
        { label: 'Explore Job Matches', path: '/jobs' },
      ],
    };
  }

  // 2. "Am I ready for [role]?" or readiness check
  if (
    lowerQuery.includes('ready') ||
    lowerQuery.includes('prepared') ||
    lowerQuery.includes('chance') ||
    lowerQuery.includes('readiness')
  ) {
    const matchPct = gaps.matchPercentage || 0;
    const isClose = matchPct >= 70;

    return {
      message: `### Job Readiness Assessment for ${targetCareer?.title || 'Target Role'}

Your current verified match is **${matchPct}%**.

- **Verified Strengths**: ${skills?.map((s) => `${s.name} (${s.proficiency})`).join(', ') || 'None listed yet'}.
- **Key Competencies Needed**: ${missingNames.slice(0, 4).join(', ') || 'All prerequisites met'}.

${
  isClose
    ? `You have a strong foundation! Focusing on **${missingNames[0] || 'final project work'}** will make you highly competitive for entry-level and junior positions.`
    : `You are in active development. By following your personalized prerequisite roadmap, you can systematically bridge the remaining ${missingNames.length} missing skills.`
}`,
      actionLinks: [
        { label: 'Check Skill Gaps', path: '/skill-gap' },
        { label: 'View Matching Jobs', path: '/jobs' },
        { label: 'Open Career Roadmap', path: '/roadmap' },
      ],
    };
  }

  // 3. "Why is my career match only X%?"
  if (
    lowerQuery.includes('why') &&
    (lowerQuery.includes('match') || lowerQuery.includes('%') || lowerQuery.includes('low') || lowerQuery.includes('only'))
  ) {
    return {
      message: `Your career match with **${targetCareer?.title || 'your chosen role'}** is calculated at **${gaps.matchPercentage || 0}%** based on direct skill overlap in the CognoDB graph:

- **Skills You Have (${gaps.matchedCount || 0} / ${gaps.totalRequired || 0})**: ${gaps.matchedSkills?.map((s) => s.name).join(', ') || 'None yet'}.
- **Missing Requirements (${gaps.missingSkills?.length || 0})**: ${missingNames.join(', ')}.

${
  criticalGaps.length > 0
    ? `🔴 **Critical Blockers**: ${criticalGaps.join(', ')} are strictly required for this role.`
    : 'All remaining gaps are high/medium priority and can be learned in parallel.'
}`,
      actionLinks: [
        { label: 'Bridge Missing Skills', path: '/skill-gap' },
        { label: 'Follow Roadmap', path: '/roadmap' },
      ],
    };
  }

  // 4. "What projects should I build / put on resume?"
  if (lowerQuery.includes('project') || lowerQuery.includes('resume') || lowerQuery.includes('portfolio')) {
    const missingSkill = missingNames[0] || 'Docker';
    return {
      message: `### Recommended Project Strategy for ${student?.name || 'you'}

To strengthen your profile for **${targetCareer?.title || 'Target Career'}**, build a project that explicitly incorporates **${missingSkill}** alongside your existing stack (${skills?.slice(0, 2).map((s) => s.name).join(', ') || 'core skills'}).

**Suggested Project Concept**:
- **Goal**: Full-stack application demonstrating ${missingSkill} and ${skills?.[0]?.name || 'Python'}.
- **Technologies**: ${skills?.[0]?.name || 'Python'}, ${missingSkill}, REST APIs, Git.
- **Why**: SkillOS uses technology inference (Query H) to detect real-world competency from project tech stacks. Adding this will unlock inferred skills and improve your job match score.`,
      actionLinks: [
        { label: 'Add Project to SkillOS', path: '/projects' },
        { label: 'View Inferred Skills', path: '/projects' },
      ],
    };
  }

  // 5. Default personalized overview
  return {
    message: `Hello ${student?.name || 'there'}! I am your SkillOS Career Copilot.

Here is your current career snapshot:
- **Target Goal**: **${targetCareer?.title || 'Not selected yet'}**
- **Match Score**: **${gaps.matchPercentage || 0}%** (${gaps.matchedCount || 0}/${gaps.totalRequired || 0} required skills)
- **Verified Skills**: ${skills?.length || 0} skills in your portfolio
- **Next High-Impact Competency**: **${missingNames[0] || 'Explore new frameworks'}**
- **Top Job Opportunity**: ${topJobs[0] ? `${topJobs[0].title} at ${topJobs[0].company?.name}` : 'Check Jobs tab'}

How can I help you accelerate your career preparation today?`,
    actionLinks: [
      { label: 'View Learning Roadmap', path: '/roadmap' },
      { label: 'Inspect Skill Gaps', path: '/skill-gap' },
      { label: 'Browse Jobs', path: '/jobs' },
    ],
  };
}

/**
 * Main generateCompletion method
 */
async function generateCompletion(systemPrompt, userMessage, context) {
  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  const provider = (process.env.LLM_PROVIDER || 'auto').toLowerCase();
  const model = process.env.LLM_MODEL;

  if (apiKey) {
    try {
      if (provider === 'openai' || (!provider.includes('gemini') && apiKey.startsWith('sk-'))) {
        const text = await callOpenAI(apiKey, model, systemPrompt, userMessage);
        return {
          message: text,
          actionLinks: [
            { label: 'View Roadmap', path: '/roadmap' },
            { label: 'View Skill Gaps', path: '/skill-gap' },
            { label: 'Job Matches', path: '/jobs' },
          ],
        };
      } else {
        const text = await callGemini(apiKey, model, systemPrompt, userMessage);
        return {
          message: text,
          actionLinks: [
            { label: 'View Roadmap', path: '/roadmap' },
            { label: 'View Skill Gaps', path: '/skill-gap' },
            { label: 'Job Matches', path: '/jobs' },
          ],
        };
      }
    } catch (err) {
      console.warn('External LLM API call failed, falling back to graph-grounded reasoning engine:', err.message);
    }
  }

  // Fallback to graph-grounded deterministic engine
  return generateGraphGroundedResponse(context, userMessage);
}

module.exports = {
  generateCompletion,
};
