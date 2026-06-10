const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }
}

function errorHandler(err, req, res, _next) {
  if (err.name === 'AppError') {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  logger.error({ err, path: req.originalUrl, method: req.method }, 'Unhandled error');

  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProduction ? 'Internal Server Error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

module.exports = { errorHandler, notFoundHandler, AppError };
