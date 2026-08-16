const { chatWithCopilot } = require('../services/llm/careerCopilotService');
const { generateInterviewQuestions, evaluateInterviewAnswer } = require('../services/llm/interviewAiService');
const { generateResumeSummary, optimizeResumeForJob } = require('../services/llm/resumeAiService');

const MAX_MESSAGE_LENGTH = 2000;

/**
 * POST /api/ai/career-chat
 * Process a student's prompt with full CognoDB graph grounding via Groq
 */
async function handleCareerChat(req, res, next) {
  try {
    const { message, history, sessionId } = req.body;
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'Authentication required for Career Copilot.',
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'A non-empty message string is required.',
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters.`,
      });
    }

    const cleanHistory = Array.isArray(history) ? history.slice(-10) : [];
    const response = await chatWithCopilot(studentId, message.trim(), cleanHistory);

    res.json({
      success: true,
      data: response,
      sessionId: sessionId || `session-${Date.now()}`,
    });
  } catch (err) {
    if (err.code === 'RATE_LIMITED' || err.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'rate_limited',
        message: 'AI request limit reached. Please wait a moment before sending more messages.',
      });
    }

    if (err.code === 'TIMEOUT' || err.status === 504) {
      return res.status(504).json({
        success: false,
        error: 'gateway_timeout',
        message: 'AI service timed out while reasoning. Please try again.',
      });
    }

    if (err.provider || err.status === 502) {
      return res.status(502).json({
        success: false,
        error: 'provider_error',
        message: 'AI service temporarily unavailable. Please retry in a few moments.',
      });
    }

    next(err);
  }
}

/**
 * POST /api/ai/interview-eval
 */
async function handleInterviewEval(req, res, next) {
  try {
    const { question, answer } = req.body;
    const studentId = req.user?.id;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Both question and answer are required.',
      });
    }

    const evaluation = await evaluateInterviewAnswer(studentId, question, answer);
    res.json({ success: true, data: evaluation });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ai/interview-questions
 */
async function handleInterviewQuestions(req, res, next) {
  try {
    const { category } = req.body;
    const studentId = req.user?.id;
    const result = await generateInterviewQuestions(studentId, category || 'technical');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ai/resume-summary
 */
async function handleResumeSummary(req, res, next) {
  try {
    const { targetRole } = req.body;
    const studentId = req.user?.id;
    const result = await generateResumeSummary(studentId, targetRole);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ai/status
 */
async function handleAiStatus(req, res) {
  const provider = (process.env.LLM_PROVIDER || 'groq').toLowerCase();
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const hasKey = Boolean(process.env.GROQ_API_KEY);

  res.json({
    success: true,
    data: {
      provider,
      model,
      ready: hasKey || process.env.NODE_ENV !== 'production',
      groundedSource: 'CognoDB Knowledge Graph',
    },
  });
}

module.exports = {
  handleCareerChat,
  handleInterviewEval,
  handleInterviewQuestions,
  handleResumeSummary,
  handleAiStatus,
};
