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

// ─── CORS Configuration ───────────────────────────────────────────────────────
const allowedOrigins = [
  'https://skill-os-vert.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
];

if (process.env.CLIENT_ORIGIN) {
  process.env.CLIENT_ORIGIN.split(',').forEach((o) => {
    const trimmed = o.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/skill-os-.*\.vercel\.app$/.test(origin) ||
      /^https:\/\/.*-ravikiran9988.*\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

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
