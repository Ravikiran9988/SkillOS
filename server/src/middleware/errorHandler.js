const neo4j = require('neo4j-driver');

/**
 * Centralized error handler middleware.
 * Maps Neo4j driver errors to appropriate HTTP status codes.
 * Never exposes credentials or internal stack traces.
 */
function errorHandler(err, req, res, next) {
  console.error('[SkillOS Error]', err.code || err.name, err.message);

  // Neo4j ServiceUnavailable — database unreachable
  if (
    err.code === 'ServiceUnavailable' ||
    err.name === 'ServiceUnavailable' ||
    (err.message && err.message.includes('Could not perform discovery'))
  ) {
    return res.status(503).json({
      error: 'database_unavailable',
      message:
        'SkillOS could not connect to the career graph database. Please try again shortly.',
    });
  }

  // Neo4j authentication failure
  if (err.code === 'Neo.ClientError.Security.Unauthorized') {
    return res.status(503).json({
      error: 'database_unavailable',
      message: 'SkillOS could not authenticate with the database.',
    });
  }

  // Neo4j generic client errors (bad query syntax, etc.)
  if (err.code && err.code.startsWith('Neo.')) {
    return res.status(500).json({
      error: 'query_error',
      message: 'A database query error occurred. Please report this.',
    });
  }

  // Not found
  if (err.status === 404) {
    return res.status(404).json({
      error: 'not_found',
      message: err.message || 'Resource not found.',
    });
  }

  // Validation errors
  if (err.status === 400) {
    return res.status(400).json({
      error: 'bad_request',
      message: err.message || 'Invalid request parameters.',
    });
  }

  // Default 500
  return res.status(500).json({
    error: 'internal_error',
    message: 'An unexpected error occurred.',
  });
}

module.exports = errorHandler;
