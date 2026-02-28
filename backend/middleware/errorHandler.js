const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';
  let code       = err.code       || 'INTERNAL_ERROR';

  if (err.name === 'ValidationError') {
    statusCode = 400; code = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map(e => e.message).join('. ');
  }
  if (err.code === 11000) {
    statusCode = 409; code = 'DUPLICATE_KEY';
    message = `${Object.keys(err.keyValue)[0]} already exists.`;
  }
  if (err.name === 'CastError') {
    statusCode = 400; code = 'INVALID_ID';
    message = `Invalid value for ${err.path}.`;
  }
  if (err.name === 'JsonWebTokenError') { statusCode = 401; code = 'INVALID_TOKEN'; message = 'Invalid token.'; }
  if (err.name === 'TokenExpiredError')  { statusCode = 401; code = 'TOKEN_EXPIRED';  message = 'Token expired.'; }

  // Log 5xx errors as error, 4xx as warn
  const logFn = statusCode >= 500 ? 'error' : 'warn';
  logger[logFn]({
    msg: 'Request error',
    code,
    statusCode,
    message,
    method: req.method,
    path: req.path,
    userId: req.user?._id,
    ...(statusCode >= 500 && { stack: err.stack }),
  });

  res.status(statusCode).json({
    success: false, code, message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
