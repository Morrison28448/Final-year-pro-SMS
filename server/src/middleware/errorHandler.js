const env = require('../config/env')

/**
 * Centralized error handler middleware
 * Must be registered LAST in app.js (after all routes)
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500

  // Log full stack in development only
  if (env.NODE_ENV === 'development') {
    console.error(`\x1b[31m[ERROR]\x1b[0m`, err)
  } else {
    console.error(`[ERROR] ${err.message}`)
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    // Only expose stack trace in development
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = errorHandler
