/**
 * Request logger middleware
 * Logs method, URL, status code, and response time for every request
 */
const logger = (req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const color =
      res.statusCode >= 500
        ? '\x1b[31m' // red
        : res.statusCode >= 400
        ? '\x1b[33m' // yellow
        : '\x1b[32m' // green

    console.log(
      `${color}[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)\x1b[0m`
    )
  })

  next()
}

module.exports = logger
