const Session = require('../models/Session');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const redisClient = require('../config/redis');

// Get all sessions for a user
const getSessions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = '-lastAccessedAt' } = req.query;
  const userId = req.user._id;

  // Check cache first
  const cacheKey = `sessions:${userId}:${page}:${limit}:${sort}`;
  let sessions = null;

  if (redisClient.isReady()) {
    sessions = await redisClient.get(cacheKey);
  }

  if (!sessions) {
    const options = {
      limit: parseInt(limit),
      sort: sort,
      select: '-chatHistory' // Exclude chat history for list view
    };

    sessions = await Session.findByUserId(userId, options);

    // Cache the results for 5 minutes
    if (redisClient.isReady()) {
      await redisClient.set(cacheKey, sessions, 300);
    }
  }

  // Get session count for pagination
  const totalSessions = await Session.countDocuments({ 
    userId, 
    isActive: true 
  });

  res.json({
    success: true,
    data: {
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSessions,
        pages: Math.ceil(totalSessions / limit)
      }
    }
  });
});

// Get a specific session by ID
const getSessionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Check cache first
  const cacheKey = `session:${id}`;
  let session = null;

  if (redisClient.isReady()) {
    session = await redisClient.get(cacheKey);
  }

  let isFromCache = !!session;

  if (!session) {
    session = await Session.findOne({ 
      _id: id, 
      userId, 
      isActive: true 
    });

    if (!session) {
      throw createError.notFound('Session not found');
    }

    // Cache the session for 10 minutes
    if (redisClient.isReady()) {
      await redisClient.set(cacheKey, session, 600);
    }
  }

  // Update last accessed time
  if (isFromCache) {
    // If session came from cache, update directly in database
    await Session.findByIdAndUpdate(id, { lastAccessedAt: new Date() });
    session.lastAccessedAt = new Date();
  } else {
    // If session came from database, it has save method
    session.lastAccessedAt = new Date();
    await session.save();
  }

  res.json({
    success: true,
    data: {
      session
    }
  });
});

// Create a new session
const createSession = asyncHandler(async (req, res) => {
  const { name, description = '' } = req.body;
  const userId = req.user._id;

  const session = new Session({
    userId,
    name,
    description,
    chatHistory: [],
    componentCode: {
      jsx: '',
      css: '',
      dependencies: [],
      version: 1
    },
    uiState: {
      selectedElement: null,
      editorTab: 'jsx',
      propertyPanel: {
        isOpen: false,
        elementId: null,
        properties: {}
      }
    }
  });

  await session.save();

  // Cache the new session
  if (redisClient.isReady()) {
    await redisClient.set(`session:${session._id}`, session, 600);
    // Invalidate sessions list cache
    const cachePattern = `sessions:${userId}:*`;
    // Note: In production, you'd want a more efficient cache invalidation strategy
  }

  res.status(201).json({
    success: true,
    message: 'Session created successfully',
    data: {
      session
    }
  });
});

// Update a session
const updateSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, componentCode, uiState, chatHistory } = req.body;
  const userId = req.user._id;

  const session = await Session.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!session) {
    throw createError.notFound('Session not found');
  }

  // Update fields if provided
  if (name) session.name = name;
  if (description !== undefined) session.description = description;
  
  if (componentCode) {
    await session.updateComponentCode(componentCode);
  }
  
  if (uiState) {
    await session.updateUIState(uiState);
  }

  if (chatHistory && Array.isArray(chatHistory)) {
    // Add new messages to chat history
    for (const message of chatHistory) {
      await session.addMessage(message);
    }
  }

  await session.save();

  // Update cache
  if (redisClient.isReady()) {
    await redisClient.set(`session:${session._id}`, session, 600);
  }

  res.json({
    success: true,
    message: 'Session updated successfully',
    data: {
      session
    }
  });
});

// Delete a session (soft delete)
const deleteSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const session = await Session.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!session) {
    throw createError.notFound('Session not found');
  }

  // Soft delete by setting isActive to false
  session.isActive = false;
  await session.save();

  // Remove from cache
  if (redisClient.isReady()) {
    await redisClient.del(`session:${session._id}`);
  }

  res.json({
    success: true,
    message: 'Session deleted successfully'
  });
});

// Get the most recent active session
const getActiveSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const session = await Session.findActiveSession(userId);

  if (!session) {
    return res.json({
      success: true,
      data: {
        session: null
      }
    });
  }

  // Update last accessed time
  session.lastAccessedAt = new Date();
  await session.save();

  res.json({
    success: true,
    data: {
      session
    }
  });
});

// Duplicate a session
const duplicateSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user._id;

  const originalSession = await Session.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!originalSession) {
    throw createError.notFound('Session not found');
  }

  const duplicatedSession = new Session({
    userId,
    name: name || `${originalSession.name} (Copy)`,
    description: originalSession.description,
    chatHistory: [], // Start with empty chat history
    componentCode: {
      jsx: originalSession.componentCode.jsx,
      css: originalSession.componentCode.css,
      dependencies: [...originalSession.componentCode.dependencies],
      version: 1
    },
    uiState: {
      selectedElement: null,
      editorTab: 'jsx',
      propertyPanel: {
        isOpen: false,
        elementId: null,
        properties: {}
      }
    }
  });

  await duplicatedSession.save();

  res.status(201).json({
    success: true,
    message: 'Session duplicated successfully',
    data: {
      session: duplicatedSession
    }
  });
});

// Auto-save session data
const autoSave = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { componentCode, uiState, lastMessage } = req.body;
  const userId = req.user._id;

  const session = await Session.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!session) {
    throw createError.notFound('Session not found');
  }

  // Update only the changed data
  let hasChanges = false;

  if (componentCode) {
    await session.updateComponentCode(componentCode);
    hasChanges = true;
  }

  if (uiState) {
    await session.updateUIState(uiState);
    hasChanges = true;
  }

  if (lastMessage) {
    await session.addMessage(lastMessage);
    hasChanges = true;
  }

  if (hasChanges) {
    session.lastAccessedAt = new Date();
    await session.save();

    // Update cache
    if (redisClient.isReady()) {
      await redisClient.set(`session:${session._id}`, session, 600);
    }
  }

  res.json({
    success: true,
    message: 'Session auto-saved successfully',
    data: {
      sessionId: session._id,
      lastSaved: session.lastAccessedAt
    }
  });
});

// Add message to session's chat history
const addMessageToSession = asyncHandler(async (req, res) => {
  const { sessionId, content, type, metadata, timestamp, id } = req.body;
  const userId = req.user._id;

  if (!sessionId || sessionId === 'undefined') {
    throw createError.badRequest('Session ID is required');
  }

  const session = await Session.findOne({ 
    _id: sessionId, 
    userId, 
    isActive: true 
  });

  if (!session) {
    throw createError.notFound('Session not found');
  }

  const message = {
    id: id || require('crypto').randomUUID(),
    content,
    type: type || 'user',
    metadata,
    timestamp: timestamp || new Date().toISOString(),
    status: 'sent'
  };

  // Use atomic operation to avoid parallel save issues
  await Session.findByIdAndUpdate(
    sessionId,
    { 
      $push: { chatHistory: message },
      $set: { 
        lastAccessedAt: new Date(),
        updatedAt: new Date()
      }
    },
    { new: true }
  );

  // Clear cache
  const cacheKey = `session:${sessionId}`;
  if (redisClient.isReady()) {
    await redisClient.del(cacheKey);
  }

  res.json({
    success: true,
    data: message
  });
});

module.exports = {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getActiveSession,
  duplicateSession,
  autoSave,
  addMessageToSession
};
