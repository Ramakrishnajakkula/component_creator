const User = require('../models/User');
const jwtService = require('../utils/jwt');
const redisClient = require('../config/redis');
const { asyncHandler, createError } = require('../middleware/errorHandler');

// Register new user
const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw createError.conflict('User with this email already exists');
  }

  // Create new user
  const user = new User({
    email,
    password,
    name
  });

  await user.save();

  // Generate tokens
  const tokens = jwtService.generateTokens(user);

  // Save refresh token to user
  await user.addRefreshToken(tokens.refreshToken);

  // Cache user session in Redis
  if (redisClient.isReady()) {
    await redisClient.set(
      `user:${user._id}`, 
      {
        id: user._id,
        email: user.email,
        name: user.name,
        lastLogin: new Date()
      },
      3600 // 1 hour
    );
  }

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      tokens
    }
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await User.findByEmailWithPassword(email);
  if (!user) {
    throw createError.unauthorized('Invalid email or password');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw createError.unauthorized('Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const tokens = jwtService.generateTokens(user);

  // Save refresh token to user
  await user.addRefreshToken(tokens.refreshToken);

  // Cache user session in Redis
  if (redisClient.isReady()) {
    await redisClient.set(
      `user:${user._id}`, 
      {
        id: user._id,
        email: user.email,
        name: user.name,
        lastLogin: user.lastLogin
      },
      3600 // 1 hour
    );
  }

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        lastLogin: user.lastLogin
      },
      tokens
    }
  });
});

// Refresh access token
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError.badRequest('Refresh token is required');
  }

  // Verify refresh token
  const decoded = jwtService.verifyRefreshToken(refreshToken);

  // Find user and check if refresh token exists
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw createError.unauthorized('User not found');
  }

  // Check if refresh token exists in user's tokens
  const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
  if (!tokenExists) {
    throw createError.unauthorized('Invalid refresh token');
  }

  // Generate new tokens
  const tokens = jwtService.generateTokens(user);

  // Remove old refresh token and add new one
  await user.removeRefreshToken(refreshToken);
  await user.addRefreshToken(tokens.refreshToken);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens
    }
  });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  // Check Redis cache first
  let userData = null;
  if (redisClient.isReady()) {
    userData = await redisClient.get(`user:${req.user._id}`);
  }

  if (!userData) {
    // If not in cache, get from database
    const user = await User.findById(req.user._id);
    if (!user) {
      throw createError.notFound('User not found');
    }
    userData = user;

    // Cache for future requests
    if (redisClient.isReady()) {
      await redisClient.set(`user:${user._id}`, userData, 3600);
    }
  }

  res.json({
    success: true,
    data: {
      user: userData
    }
  });
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const updateData = {};

  if (name) updateData.name = name;
  if (avatar) updateData.avatar = avatar;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!user) {
    throw createError.notFound('User not found');
  }

  // Update cache
  if (redisClient.isReady()) {
    await redisClient.set(`user:${user._id}`, user, 3600);
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  // Add access token to blacklist
  if (redisClient.isReady()) {
    const tokenExp = req.tokenPayload.exp;
    const now = Math.floor(Date.now() / 1000);
    const ttl = tokenExp - now;

    if (ttl > 0) {
      await redisClient.set(`blacklist:${req.token}`, 'true', ttl);
    }
  }

  // Remove refresh token if provided
  if (refreshToken) {
    await req.user.removeRefreshToken(refreshToken);
  }

  // Remove user from cache
  if (redisClient.isReady()) {
    await redisClient.del(`user:${req.user._id}`);
  }

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Logout from all devices
const logoutAll = asyncHandler(async (req, res) => {
  // Clear all refresh tokens
  await req.user.clearRefreshTokens();

  // Add current access token to blacklist
  if (redisClient.isReady()) {
    const tokenExp = req.tokenPayload.exp;
    const now = Math.floor(Date.now() / 1000);
    const ttl = tokenExp - now;

    if (ttl > 0) {
      await redisClient.set(`blacklist:${req.token}`, 'true', ttl);
    }

    // Remove user from cache
    await redisClient.del(`user:${req.user._id}`);
  }

  res.json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
});

// Delete user account
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw createError.badRequest('Password is required to delete account');
  }

  // Verify password
  const user = await User.findByEmailWithPassword(req.user.email);
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    throw createError.unauthorized('Invalid password');
  }

  // Delete user and all associated data
  await User.findByIdAndDelete(req.user._id);

  // Clear cache
  if (redisClient.isReady()) {
    await redisClient.del(`user:${req.user._id}`);
  }

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  logout,
  logoutAll,
  deleteAccount
};
