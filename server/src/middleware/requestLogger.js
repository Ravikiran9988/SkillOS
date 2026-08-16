const { v4: uuidv4 } = require('uuid');

/**
 * Structured request logging middleware.
 * Logs: requestId, timestamp, method, path, status, duration, userId
 */
function requestLogger(req, res, next) {
  const requestId = uuidv4();
  const start = Date.now();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || null,
      ip: req.ip,
    };

    // In production, use structured JSON logging
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(log));
    } else {
      const statusColor = res.statusCode >= 400 ? '\x1b[31m' : res.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';
      console.log(
        `${statusColor}${res.statusCode}${reset} ${req.method} ${req.path} ${duration}ms${log.userId ? ` [${log.userId}]` : ''}`
      );
    }
  });

  next();
}

module.exports = requestLogger;
