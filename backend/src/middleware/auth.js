const jwtService = require('../utils/jwt');
const User = require('../models/User');
const redisClient = require('../config/redis');

// Authentication middleware to verify JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = jwtService.extractTokenFromHeader(authHeader);
    
    // Check if token is blacklisted (for logout functionality)
    if (redisClient.isReady()) {
      const isBlacklisted = await redisClient.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked'
        });
      }
    }

    // Verify the token
    const decoded = jwtService.verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add user and token info to request
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    let message = 'Invalid token';
    if (error.message.includes('expired')) {
      message = 'Token has expired';
    } else if (error.message.includes('malformed')) {
      message = 'Malformed token';
    }

    return res.status(401).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = jwtService.extractTokenFromHeader(authHeader);
    const decoded = jwtService.verifyAccessToken(token);
    
    const user = await User.findById(decoded.userId);
    req.user = user || null;
    req.token = token;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    req.user = null;
    next();
  }
};

// Middleware to check if user owns the resource
const checkResourceOwnership = (resourceIdField = 'userId') => {
  return (req, res, next) => {
    try {
      const resourceUserId = req.body[resourceIdField] || 
                           req.params[resourceIdField] || 
                           req.query[resourceIdField];
      
      if (!resourceUserId) {
        return res.status(400).json({
          success: false,
          message: 'Resource user ID not provided'
        });
      }

      if (resourceUserId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only access your own resources'
        });
      }

      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

// Middleware to refresh token if it's about to expire
const refreshTokenIfNeeded = async (req, res, next) => {
  try {
    if (!req.token || !req.tokenPayload) {
      return next();
    }

    const tokenExp = req.tokenPayload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = tokenExp - now;
    
    // If token expires in less than 5 minutes, include new token in response
    if (timeUntilExpiry < 5 * 60 * 1000) {
      const newTokens = jwtService.generateTokens(req.user);
      
      // Add new token to response headers
      res.set('X-New-Access-Token', newTokens.accessToken);
      res.set('X-Token-Expires-In', newTokens.expiresIn);
    }

    next();
  } catch (error) {
    console.error('Token refresh error:', error);
    // Don't fail the request, just continue without refreshing
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  checkResourceOwnership,
  refreshTokenIfNeeded
};
