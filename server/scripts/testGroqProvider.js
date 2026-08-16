process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-skillos-development-key-64-bytes-long-super-secure';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-skillos-development-key-64-bytes-long';
process.env.LLM_PROVIDER = 'groq';

const http = require('http');
const app = require('../src/app');
const groqProvider = require('../src/services/llm/groqProvider');
const { generateCompletion } = require('../src/services/llm/llmProvider');
const { buildStudentGraphContext, chatWithCopilot } = require('../src/services/llm/careerCopilotService');
const { generateResumeSummary } = require('../src/services/llm/resumeAiService');
const { generateInterviewQuestions, evaluateInterviewAnswer } = require('../src/services/llm/interviewAiService');

function req(port, method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const request = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    request.on('error', reject);
    if (data) request.write(data);
    request.end();
  });
}

async function runGroqAndAiTests() {
  console.log('🤖 ==========================================================');
  console.log('🤖 SkillOS Groq LLM Provider & CognoDB Grounding Audit');
  console.log('🤖 ==========================================================\n');

  const server = app.listen(3094);
  const port = 3094;

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${extra}`);
      failed++;
    }
  }

  try {
    // ─── 1. Groq Provider Interface & Missing Key Handling ───────────────────
    console.log('--- 1. Groq Provider Unit Verification ---');

    // Test missing key error handling
    const originalKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    let missingKeyThrew = false;
    try {
      await groqProvider.generateResponse({ systemPrompt: 'Test', messages: [] });
    } catch (err) {
      missingKeyThrew = err.code === 'MISSING_API_KEY' && err.provider === 'groq';
    }
    assert('Groq Provider Missing API Key Error Code (MISSING_API_KEY)', missingKeyThrew);

    // Verify error message never contains credentials
    try {
      await groqProvider.generateResponse({ systemPrompt: 'Test' });
    } catch (err) {
      assert('Groq Provider Error Zero Secret Leakage', !/bearer|password|jwt|sk-/i.test(err.message));
    }

    if (originalKey) process.env.GROQ_API_KEY = originalKey;

    // ─── 2. CognoDB Graph Context Retrieval Scoping ──────────────────────────
    console.log('\n--- 2. CognoDB Graph Context Scoping & Integrity ---');

    const contextStudent5 = await buildStudentGraphContext('student-5');
    assert('Graph Context: Student Profile Loaded (Aditya Singh)', contextStudent5.student?.name === 'Aditya Singh');
    assert('Graph Context: Verified Skills Loaded from Graph', Array.isArray(contextStudent5.skills) && contextStudent5.skills.length >= 5);
    assert('Graph Context: Target Career Loaded from Graph', !!contextStudent5.targetCareer);
    assert('Graph Context: Skill Gaps Computed from Graph', contextStudent5.gaps?.matchPercentage !== undefined);
    assert('Graph Context: Learning Roadmap Loaded from Graph', Array.isArray(contextStudent5.roadmap?.orderedSkills) || Array.isArray(contextStudent5.roadmap?.steps));
    assert('Graph Context: Recommended Jobs Loaded from Graph', Array.isArray(contextStudent5.jobs) && contextStudent5.jobs.length > 0);

    // Verify context is strictly scoped to requested student
    const contextStudent1 = await buildStudentGraphContext('student-1');
    assert('Graph Context Scoping: Student 1 has different ID & profile from Student 5', contextStudent1.student?.id === 'student-1' && contextStudent1.student?.name !== contextStudent5.student?.name);

    // ─── 3. Career Copilot Grounded Chat ─────────────────────────────────────
    console.log('\n--- 3. Career Copilot Grounded Chat ---');

    const copilotResult = await chatWithCopilot('student-5', 'What should I learn next?');
    assert('Career Copilot Returns Answer', !!(copilotResult.answer || copilotResult.message));
    assert('Career Copilot Returns Structured Action Links', Array.isArray(copilotResult.actions) && copilotResult.actions.length >= 3);
    assert('Career Copilot Context Grounded (Mentions Verified Skills / Target)', /skills|gap|career|roadmap|learning|python|aditya/i.test(copilotResult.answer || copilotResult.message));

    // ─── 4. Resume AI Service ───────────────────────────────────────────────
    console.log('\n--- 4. Resume AI Service ---');

    const resumeResult = await generateResumeSummary('student-5', 'Machine Learning Engineer');
    assert('Resume AI Generates Summary', !!(resumeResult.answer || resumeResult.message));

    // ─── 5. Interview AI Service ────────────────────────────────────────────
    console.log('\n--- 5. Interview AI Service ---');

    const questionsResult = await generateInterviewQuestions('student-5', 'technical');
    assert('Interview AI Generates Questions', !!(questionsResult.answer || questionsResult.message));

    const evalResult = await evaluateInterviewAnswer('student-5', 'Explain gradient descent', 'Gradient descent is an optimization algorithm used to minimize loss.');
    assert('Interview AI Evaluates Candidate Answer', !!(evalResult.answer || evalResult.message));

    // ─── 6. HTTP API Validation & Security ──────────────────────────────────
    console.log('\n--- 6. HTTP AI Endpoint Security & Validation ---');

    // Login to get token
    const loginRes = await req(port, 'POST', '/api/auth/login', { studentId: 'student-5' });
    const token = loginRes.body?.accessToken || loginRes.body?.token;

    // 6a. Unauthenticated request -> 401
    const unauthAi = await req(port, 'POST', '/api/ai/career-chat', { message: 'Hello' });
    assert('Unauthenticated AI Request returns HTTP 401', unauthAi.status === 401);

    // 6b. Missing message -> 400
    const emptyMsg = await req(port, 'POST', '/api/ai/career-chat', { message: '' }, token);
    assert('Empty Message returns HTTP 400 Bad Request', emptyMsg.status === 400);

    // 6c. Oversized message -> 400
    const oversizedMsg = await req(port, 'POST', '/api/ai/career-chat', { message: 'x'.repeat(2500) }, token);
    assert('Oversized Message (>2000 chars) returns HTTP 400 Bad Request', oversizedMsg.status === 400);

    // 6d. Valid authenticated request -> 200
    const validAi = await req(port, 'POST', '/api/ai/career-chat', {
      message: 'Why is my career match 57%?',
      history: [{ role: 'user', content: 'Hi' }],
    }, token);
    assert('Valid Authenticated AI Chat returns HTTP 200', validAi.status === 200 && !!validAi.body.data);

    // 6e. AI Status endpoint -> 200
    const statusRes = await req(port, 'GET', '/api/ai/status', null, token);
    assert('AI Status Endpoint (/api/ai/status) returns provider info', statusRes.status === 200 && statusRes.body.data?.groundedSource === 'CognoDB Knowledge Graph');

    console.log(`\n==========================================================`);
    console.log(`Groq & AI Audit Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==========================================================\n`);

    if (failed > 0) process.exitCode = 1;
  } catch (err) {
    console.error('Fatal Groq test error:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
    setTimeout(() => process.exit(failed > 0 ? 1 : 0), 500).unref();
  }
}

runGroqAndAiTests();
