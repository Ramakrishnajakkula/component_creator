const aiService = require('../services/aiService');
const Session = require('../models/Session');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const redisClient = require('../config/redis');
const mongoose = require('mongoose');

// Generate a new component
const generateComponent = asyncHandler(async (req, res) => {
  const { prompt, sessionId, model, images = [] } = req.body;
  const userId = req.user._id;

  console.log('AI Controller received:', { 
    sessionId, 
    prompt: prompt?.substring(0, 50), 
    userId,
    imageCount: images.length,
    model 
  });
  console.log('SessionId type:', typeof sessionId);
  console.log('SessionId value:', sessionId);
  
  // Log image details if present
  if (images.length > 0) {
    console.log('Images received:', images.map(img => ({
      name: img.name,
      type: img.type,
      dataLength: img.data?.length || 0
    })));
  }

  // Validate sessionId format
  if (!sessionId) {
    console.error('No sessionId provided');
    throw createError.badRequest('Session ID is required');
  }

  if (sessionId === 'undefined' || sessionId === 'null') {
    console.error('SessionId is string undefined/null:', sessionId);
    throw createError.badRequest('Invalid session ID: received string "undefined" or "null"');
  }

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    console.error('Invalid ObjectId format:', sessionId);
    throw createError.badRequest('Invalid session ID format');
  }

  // Validate session exists and belongs to user
  const session = await Session.findOne({ 
    _id: sessionId, 
    userId, 
    isActive: true 
  });

  if (!session) {
    console.error('Session not found for:', { sessionId, userId });
    throw createError.notFound('Session not found or inactive');
  }

  console.log('Session found successfully:', session._id);

  // Check rate limiting for AI requests (temporarily disabled for debugging)
  const rateLimitKey = `ai_requests:${userId}`;
  console.log('Redis rate limiting check - Redis ready:', redisClient.isReady());
  if (redisClient.isReady()) {
    try {
      const currentRequests = await redisClient.get(rateLimitKey) || 0;
      console.log('Current AI requests count:', currentRequests);
      if (currentRequests >= 50) { // Increased limit for testing
        throw createError.tooManyRequests('AI request limit exceeded. Please try again later.');
      }
    } catch (redisError) {
      console.log('Redis error during rate limiting, continuing anyway:', redisError.message);
    }
  } else {
    console.log('Redis not ready, skipping rate limiting check');
  }

  try {
    // Generate component using AI service
    console.log('🚀 Starting AI generation for prompt:', prompt.substring(0, 100));
    if (images.length > 0) {
      console.log('📸 Including', images.length, 'images in generation');
    }
    const startTime = Date.now();
    const result = await aiService.generateComponent(prompt, model, images);
    const processingTime = Date.now() - startTime;
    console.log('✅ AI generation completed in', processingTime, 'ms');

    if (!result.success) {
      console.error('❌ AI service returned failure:', result);
      throw createError.badGateway('Failed to generate component');
    }

    console.log('📝 AI result summary:', {
      hasJSX: !!result.data.jsx,
      hasCSS: !!result.data.css,
      explanation: result.data.explanation?.substring(0, 50)
    });

    // Add user message to chat history
    await session.addMessage({
      type: 'user',
      content: prompt,
      metadata: {
        hasImage: images.length > 0,
        imageCount: images.length,
        timestamp: new Date()
      }
    });

    // Add AI response to chat history
    await session.addMessage({
      type: 'ai',
      content: result.data.explanation || `I've generated a React component for you.`,
      code: result.data.jsx,
      component: {
        jsx: result.data.jsx,
        css: result.data.css,
        dependencies: result.data.dependencies || []
      },
      metadata: {
        model: result.metadata.model,
        tokens: result.metadata.tokens,
        processingTime: processingTime,
        componentGenerated: true
      }
    });

    // Update session with new component code
    await session.updateComponentCode({
      jsx: result.data.jsx,
      css: result.data.css,
      dependencies: result.data.dependencies || []
    });

    // Update rate limiting counter
    if (redisClient.isReady()) {
      try {
        await redisClient.set(rateLimitKey, String(parseInt(await redisClient.get(rateLimitKey) || 0) + 1), 3600);
        console.log('✅ Updated Redis rate limiting counter');
      } catch (redisError) {
        console.log('⚠️ Failed to update Redis rate limiting, continuing anyway:', redisError.message);
      }
    } else {
      console.log('⚠️ Redis not ready, skipping rate limiting update');
    }

    // Update session cache
    if (redisClient.isReady()) {
      try {
        await redisClient.set(`session:${sessionId}`, session.toObject(), 600);
        console.log('✅ Updated Redis session cache');
      } catch (redisError) {
        console.log('⚠️ Failed to update Redis session cache, continuing anyway:', redisError.message);
      }
    } else {
      console.log('⚠️ Redis not ready, skipping session cache update');
    }

    res.json({
      success: true,
      message: 'Component generated successfully',
      data: {
        code: result.data.jsx,
        component: {
          jsx: result.data.jsx,
          css: result.data.css,
          dependencies: result.data.dependencies || []
        },
        explanation: result.data.explanation,
        session: {
          id: session._id,
          componentCode: session.componentCode,
          stats: session.stats
        },
        metadata: {
          ...result.metadata,
          processingTime
        }
      }
    });

  } catch (error) {
    // Log the error for debugging
    console.error('Component generation failed:', error);
    
    // Add error message to chat history
    await session.addMessage({
      type: 'ai',
      content: 'I apologize, but I encountered an error while generating your component. Please try again with a different prompt.',
      metadata: {
        error: error.message,
        timestamp: new Date()
      }
    });

    throw createError.badGateway(String(error.message) || 'Failed to generate component');
  }
});

// Refine an existing component
const refineComponent = asyncHandler(async (req, res) => {
  const { prompt, sessionId, model } = req.body;
  const userId = req.user._id;

  // Validate session exists and belongs to user
  const session = await Session.findOne({ 
    _id: sessionId, 
    userId, 
    isActive: true 
  });

  if (!session) {
    throw createError.notFound('Session not found');
  }

  if (!session.componentCode || !session.componentCode.jsx) {
    throw createError.badRequest('No component code found to refine');
  }

  // Check rate limiting
  const rateLimitKey = `ai_requests:${userId}`;
  if (redisClient.isReady()) {
    const currentRequests = await redisClient.get(rateLimitKey) || 0;
    if (currentRequests >= 10) {
      throw createError.tooManyRequests('AI request limit exceeded. Please try again later.');
    }
  }

  try {
    const startTime = Date.now();
    const result = await aiService.refineComponent(
      prompt, 
      session.componentCode, 
      model
    );
    const processingTime = Date.now() - startTime;

    if (!result.success) {
      throw createError.badGateway('Failed to refine component');
    }

    // Add user refinement request to chat history
    await session.addMessage({
      type: 'user',
      content: prompt,
      metadata: {
        isRefinement: true,
        timestamp: new Date()
      }
    });

    // Add AI refinement response to chat history
    await session.addMessage({
      type: 'ai',
      content: result.data.explanation || 'Component updated based on your request.',
      code: result.data.jsx,
      component: {
        jsx: result.data.jsx,
        css: result.data.css,
        dependencies: result.data.dependencies || []
      },
      metadata: {
        model: result.metadata.model,
        tokens: result.metadata.tokens,
        processingTime: processingTime,
        isRefinement: true
      }
    });

    // Update session with refined component code
    await session.updateComponentCode({
      jsx: result.data.jsx,
      css: result.data.css,
      dependencies: result.data.dependencies || session.componentCode.dependencies
    });

    // Update rate limiting counter
    if (redisClient.isReady()) {
      await redisClient.set(rateLimitKey, String(parseInt(await redisClient.get(rateLimitKey) || 0) + 1), 3600);
    }

    // Update session cache
    if (redisClient.isReady()) {
      await redisClient.set(`session:${sessionId}`, session.toObject(), 600);
    }

    res.json({
      success: true,
      message: 'Component refined successfully',
      data: {
        code: result.data.jsx,
        component: {
          jsx: result.data.jsx,
          css: result.data.css,
          dependencies: result.data.dependencies || []
        },
        explanation: result.data.explanation,
        session: {
          id: session._id,
          componentCode: session.componentCode,
          stats: session.stats
        },
        metadata: {
          ...result.metadata,
          processingTime
        }
      }
    });

  } catch (error) {
    console.error('Component refinement failed:', error);
    
    // Add error message to chat history
    await session.addMessage({
      type: 'ai',
      content: 'I apologize, but I encountered an error while refining your component. Please try again with a different approach.',
      metadata: {
        error: error.message,
        isRefinement: true,
        timestamp: new Date()
      }
    });

    throw createError.badGateway(String(error.message) || 'Failed to refine component');
  }
});

// Chat with AI (non-component generation)
const chatWithAI = asyncHandler(async (req, res) => {
  const { message, sessionId, model } = req.body;
  const userId = req.user._id;

  // Validate session
  const session = await Session.findOne({ 
    _id: sessionId, 
    userId, 
    isActive: true 
  });

  if (!session) {
    throw createError.notFound('Session not found');
  }

  // Check rate limiting
  const rateLimitKey = `ai_chat:${userId}`;
  if (redisClient.isReady()) {
    const currentRequests = await redisClient.get(rateLimitKey) || 0;
    if (currentRequests >= 20) { // 20 chat messages per hour
      throw createError.tooManyRequests('Chat rate limit exceeded. Please try again later.');
    }
  }

  try {
    // Get recent chat history for context
    const recentMessages = session.chatHistory.slice(-5).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    recentMessages.push({
      role: 'user',
      content: message
    });

    const result = await aiService.chatCompletion(recentMessages, model);

    if (!result.success) {
      throw createError.badGateway('Failed to get AI response');
    }

    // Add messages to chat history
    await session.addMessage({
      type: 'user',
      content: message,
      metadata: { timestamp: new Date() }
    });

    await session.addMessage({
      type: 'ai',
      content: result.message,
      metadata: {
        model: result.metadata.model,
        tokens: result.metadata.tokens,
        isChat: true
      }
    });

    // Update rate limiting counter
    if (redisClient.isReady()) {
      await redisClient.set(rateLimitKey, String(parseInt(await redisClient.get(rateLimitKey) || 0) + 1), 3600);
    }

    res.json({
      success: true,
      message: 'Chat response received',
      data: {
        response: result.message,
        metadata: result.metadata
      }
    });

  } catch (error) {
    console.error('Chat failed:', error);
    throw createError.badGateway(String(error.message) || 'Failed to get AI response');
  }
});

// Get available AI models
const getModels = asyncHandler(async (req, res) => {
  try {
    const models = await aiService.getAvailableModels();
    
    res.json({
      success: true,
      data: {
        models: models.map(model => ({
          id: model.id,
          name: model.id,
          description: model.description || '',
          pricing: model.pricing || {}
        }))
      }
    });
  } catch (error) {
    console.error('Failed to fetch models:', error);
    
    // Return default models if API call fails
    res.json({
      success: true,
      data: {
        models: [
          { id: 'openai/gpt-4o-mini', name: 'GPT-4 Omni Mini', description: 'Fast and efficient' },
          { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', description: 'Free model' },
          { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', description: 'Free Google model' }
        ]
      }
    });
  }
});

// Get AI usage statistics for user
const getUsageStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let stats = {
    requests: 0,
    chatMessages: 0,
    resetTime: null
  };

  if (redisClient.isReady()) {
    const requestsKey = `ai_requests:${userId}`;
    const chatKey = `ai_chat:${userId}`;
    
    stats.requests = parseInt(await redisClient.get(requestsKey) || 0);
    stats.chatMessages = parseInt(await redisClient.get(chatKey) || 0);
    
    // Get TTL for reset time
    const ttl = await redisClient.client.ttl(requestsKey);
    if (ttl > 0) {
      stats.resetTime = new Date(Date.now() + (ttl * 1000));
    }
  }

  res.json({
    success: true,
    data: {
      usage: stats,
      limits: {
        requests: 10,
        chatMessages: 20,
        windowMinutes: 60
      }
    }
  });
});

module.exports = {
  generateComponent,
  refineComponent,
  chatWithAI,
  getModels,
  getUsageStats
};
