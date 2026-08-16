/**
 * SkillOS Groq LLM Provider
 * Connects to the official Groq API (OpenAI-compatible endpoints).
 * Safe, robust, with timeout handling, normalized error codes, and zero secret leakage.
 */

const https = require('https');
const { URL } = require('url');

const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_TIMEOUT_MS = 25000;

/**
 * Make an HTTPS request to Groq API
 */
function postToGroq(endpointUrl, apiKey, payload, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(endpointUrl);
    const postData = JSON.stringify(payload);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: `${urlObj.pathname}${urlObj.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'SkillOS-Career-Copilot/2.0',
      },
      timeout: timeoutMs,
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });

      res.on('end', () => {
        const statusCode = res.statusCode || 500;
        let parsed;

        try {
          parsed = rawData ? JSON.parse(rawData) : {};
        } catch (parseErr) {
          const err = new Error('Groq returned a malformed response.');
          err.status = 502;
          err.code = 'MALFORMED_RESPONSE';
          return reject(err);
        }

        if (statusCode >= 200 && statusCode < 300) {
          return resolve({ statusCode, data: parsed });
        }

        // Handle error status codes gracefully
        const errorMsg = parsed.error?.message || `Groq API responded with HTTP status ${statusCode}`;
        const err = new Error(errorMsg);
        err.status = statusCode === 429 ? 429 : statusCode >= 500 ? 502 : 500;
        err.code = statusCode === 429 ? 'RATE_LIMITED' : statusCode === 401 ? 'INVALID_API_KEY' : 'PROVIDER_ERROR';
        err.provider = 'groq';
        reject(err);
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const err = new Error('Groq API request timed out.');
      err.status = 504;
      err.code = 'TIMEOUT';
      err.provider = 'groq';
      reject(err);
    });

    req.on('error', (netErr) => {
      const err = new Error('Network error communicating with Groq API.');
      err.status = 502;
      err.code = 'NETWORK_ERROR';
      err.provider = 'groq';
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Generate a response using Groq
 *
 * @param {Object} params
 * @param {string} params.systemPrompt - The grounded system prompt
 * @param {Array<{role: string, content: string}>} [params.messages] - Conversation messages
 * @param {number} [params.temperature=0.7] - Model temperature
 * @param {number} [params.maxTokens=1200] - Max completion tokens
 * @param {string} [params.model] - Specific model override
 * @returns {Promise<{text: string, model: string, provider: string, usage: Object}>}
 */
async function generateResponse({
  systemPrompt,
  messages = [],
  temperature = 0.7,
  maxTokens = 1200,
  model,
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    const err = new Error('GROQ_API_KEY is not configured on the server.');
    err.status = 500;
    err.code = 'MISSING_API_KEY';
    err.provider = 'groq';
    throw err;
  }

  const selectedModel = model || process.env.GROQ_MODEL || DEFAULT_MODEL;
  const baseUrl = (process.env.GROQ_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const endpoint = `${baseUrl}/chat/completions`;

  // Assemble full message sequence with system prompt first
  const formattedMessages = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }

  if (Array.isArray(messages)) {
    for (const msg of messages) {
      if (msg && msg.role && msg.content) {
        formattedMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: String(msg.content),
        });
      }
    }
  }

  const payload = {
    model: selectedModel,
    messages: formattedMessages,
    temperature: Math.max(0, Math.min(2, temperature)),
    max_tokens: Math.max(50, Math.min(4096, maxTokens)),
  };

  const startTime = Date.now();
  const { data } = await postToGroq(endpoint, apiKey.trim(), payload);
  const latencyMs = Date.now() - startTime;

  const choice = data.choices && data.choices[0];
  const responseText = choice?.message?.content || choice?.text;

  if (!responseText || typeof responseText !== 'string' || responseText.trim().length === 0) {
    const err = new Error('Groq returned an empty response.');
    err.status = 502;
    err.code = 'EMPTY_RESPONSE';
    err.provider = 'groq';
    throw err;
  }

  // Safe structured observability logging (no keys or prompts logged)
  console.log(`[LLM/Groq] model=${data.model || selectedModel} latency_ms=${latencyMs} tokens=${data.usage?.total_tokens || 'unknown'}`);

  return {
    text: responseText.trim(),
    model: data.model || selectedModel,
    provider: 'groq',
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
    latencyMs,
  };
}

module.exports = {
  generateResponse,
  DEFAULT_MODEL,
  DEFAULT_BASE_URL,
};
