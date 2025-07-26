const config = require('../config/env');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let error = {
    success: false,
    message: 'Internal server error',
    ...(config.nodeEnv === 'development' && { 
      stack: err.stack,
      originalError: err.message 
    })
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    error.message = 'Validation failed';
    error.errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    return res.status(400).json(error);
  }

  if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId, etc.)
    error.message = 'Invalid data format';
    error.field = err.path;
    return res.status(400).json(error);
  }

  if (err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyPattern)[0];
    error.message = `${field} already exists`;
    error.field = field;
    return res.status(409).json(error);
  }

  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token has expired';
    return res.status(401).json(error);
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'File size too large';
      error.maxSize = config.upload.maxFileSize;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error.message = 'Too many files';
    } else {
      error.message = 'File upload error';
    }
    return res.status(400).json(error);
  }

  // Handle custom application errors
  if (err.statusCode) {
    error.message = err.message;
    return res.status(err.statusCode).json(error);
  }

  // Handle axios errors (from AI API calls)
  if (err.isAxiosError) {
    error.message = 'External API error';
    if (config.nodeEnv === 'development') {
      error.apiError = {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      };
    }
    return res.status(502).json(error);
  }

  // Default to 500 for unknown errors
  res.status(500).json(error);
};

// 404 handler for unknown routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
};

// Async error wrapper to catch async errors in route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error class for application-specific errors
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper function to create specific error types
const createError = {
  badRequest: (message = 'Bad request') => new AppError(message, 400),
  unauthorized: (message = 'Unauthorized') => new AppError(message, 401),
  forbidden: (message = 'Forbidden') => new AppError(message, 403),
  notFound: (message = 'Not found') => new AppError(message, 404),
  conflict: (message = 'Conflict') => new AppError(message, 409),
  tooManyRequests: (message = 'Too many requests') => new AppError(message, 429),
  internal: (message = 'Internal server error') => new AppError(message, 500),
  badGateway: (message = 'Bad gateway') => new AppError(message, 502),
  serviceUnavailable: (message = 'Service unavailable') => new AppError(message, 503)
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  createError
};
