require('dotenv').config();
const app = require('./app');
const { closeDriver } = require('./config/database');

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SkillOS API running on port ${PORT}`);
  console.log(`   Health: http://0.0.0.0:${PORT}/api/health\n`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await closeDriver();
    console.log('CognoDB driver closed. Goodbye.\n');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
