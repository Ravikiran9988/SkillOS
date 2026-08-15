require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const healthRouter = require('./routes/health');
const studentsRouter = require('./routes/students');
const careersRouter = require('./routes/careers');
const jobsRouter = require('./routes/jobs');
const projectsRouter = require('./routes/projects');

const app = express();

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
    // Allow non-browser requests (e.g. curl, health checks, server-to-server)
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
  exposedHeaders: ['Access-Control-Allow-Origin'],
  optionsSuccessStatus: 200,
  maxAge: 86400,
};

// Register CORS middleware BEFORE all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(morgan('dev'));

// ─── Root Info ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'SkillOS Graph API',
    status: 'online',
    health: '/api/health',
    version: '1.0.0',
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'SkillOS Graph API',
    status: 'online',
    health: '/api/health',
    version: '1.0.0',
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/students', studentsRouter);
app.use('/api/careers', careersRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/projects', projectsRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'not_found',
    message: `Route ${req.method} ${req.path} not found.`,
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
