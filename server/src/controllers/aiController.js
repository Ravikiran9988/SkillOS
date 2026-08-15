const { chatWithCopilot } = require('../services/llm/careerCopilotService');

/**
 * POST /api/ai/career-chat
 * Process a student's prompt with full CognoDB graph grounding
 */
async function handleCareerChat(req, res, next) {
  try {
    const { message } = req.body;
    const studentId = req.user.id;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'A message string is required.',
      });
    }

    const response = await chatWithCopilot(studentId, message.trim());

    res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleCareerChat,
};
