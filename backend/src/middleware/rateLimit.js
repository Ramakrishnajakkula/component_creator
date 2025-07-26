const rateLimit = require('express-rate-limit');
const config = require('../config/env');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/';
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

// AI request limiter (more restrictive due to cost)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
  message: {
    success: false,
    message: 'Too many AI requests, please wait before sending another request.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 uploads per minute
  message: {
    success: false,
    message: 'Too many file uploads, please wait before uploading again.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again in an hour.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Dynamic rate limiter based on user tier (for future premium features)
const createUserBasedLimiter = (limits) => {
  return rateLimit({
    windowMs: limits.windowMs,
    max: (req) => {
      // Default limit for unauthenticated users
      if (!req.user) return limits.anonymous || 10;
      
      // Could extend this for premium users
      return limits.authenticated || 50;
    },
    message: (req) => ({
      success: false,
      message: 'Rate limit exceeded for your account tier.',
      retryAfter: Math.ceil(limits.windowMs / 1000)
    }),
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = {
  generalLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
  passwordResetLimiter,
  createUserBasedLimiter
};
