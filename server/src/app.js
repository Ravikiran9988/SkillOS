require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { authLimiter, aiLimiter, generalLimiter } = require('./middleware/rateLimiter');

const authRouter = require('./routes/auth');
const healthRouter = require('./routes/health');
const studentsRouter = require('./routes/students');
const careersRouter = require('./routes/careers');
const jobsRouter = require('./routes/jobs');
const projectsRouter = require('./routes/projects');
const aiRouter = require('./routes/ai');
const adminRouter = require('./routes/admin');

const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false, // needed for React Flow
    hsts: process.env.NODE_ENV === 'production',
  })
);

// ─── Production CORS Configuration ───────────────────────────────────────────
const allowedOrigins = [
  'https://skill-os-vert.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const envFrontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN;
if (envFrontendUrl) {
  envFrontendUrl.split(',').forEach((o) => {
    const trimmed = o.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/skill-os-.*\.vercel\.app$/.test(origin) ||
      /^https:\/\/.*\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin ${origin} not allowed by SkillOS API`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Access-Control-Allow-Origin', 'X-Request-Id'],
  optionsSuccessStatus: 200,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// ─── API Documentation (Swagger) ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  try {
    const swaggerUi = require('swagger-ui-express');
    const swaggerJsdoc = require('swagger-jsdoc');
    const swaggerSpec = swaggerJsdoc({
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'SkillOS API',
          version: '2.0.0',
          description: 'SkillOS Student Career Intelligence Graph API',
        },
        servers: [{ url: '/api' }],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
        security: [{ bearerAuth: [] }],
      },
      apis: ['./src/routes/*.js'],
    });
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('[DOCS] Swagger available at /api/docs');
  } catch (e) {
    console.warn('[DOCS] Swagger setup failed:', e.message);
  }
}

// ─── Root Info ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ name: 'SkillOS API', status: 'online', health: '/api/health', docs: '/api/docs', version: '2.0.0' });
});
app.get('/api', (req, res) => {
  res.json({ name: 'SkillOS API', status: 'online', health: '/api/health', docs: '/api/docs', version: '2.0.0' });
});

// ─── Routes with Rate Limiting ───────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/health', healthRouter);
app.use('/api/students', generalLimiter, studentsRouter);
app.use('/api/careers', generalLimiter, careersRouter);
app.use('/api/jobs', generalLimiter, jobsRouter);
app.use('/api/projects', generalLimiter, projectsRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/admin', generalLimiter, adminRouter);

// ─── Metrics ─────────────────────────────────────────────────────────────────
app.get('/api/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'not_found', message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
