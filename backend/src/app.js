const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./config/env');
const database = require('./config/database');
const redisClient = require('./config/redis');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimit');

// Import routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const aiRoutes = require('./routes/ai');
const chatRoutes = require('./routes/chat');

class App {
  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-New-Access-Token', 'X-Token-Expires-In']
    }));

    // Compression middleware
    this.app.use(compression());

    // Request parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true 
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Logging middleware
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Rate limiting (apply to all routes)
    this.app.use(generalLimiter);

    // Health check middleware
    this.app.use((req, res, next) => {
      res.set('X-Timestamp', new Date().toISOString());
      next();
    });
  }

  initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        services: {
          database: database.getConnection() ? 'connected' : 'disconnected',
          redis: redisClient.isReady() ? 'connected' : 'disconnected'
        }
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/sessions', sessionRoutes);
    this.app.use('/api/ai', aiRoutes);
    this.app.use('/api/chat', chatRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Component Generator API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: '/api/auth',
          sessions: '/api/sessions',
          ai: '/api/ai',
          health: '/health'
        }
      });
    });
  }

  initializeErrorHandling() {
    // 404 handler for unknown routes
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Component Generator API...');
      
      // Connect to databases
      await database.connect();
      await redisClient.connect();

      console.log('✅ Application initialized successfully');
      return this.app;
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }

  async shutdown() {
    try {
      console.log('🔄 Shutting down application...');
      
      // Close database connections
      await database.disconnect();
      await redisClient.disconnect();

      console.log('✅ Application shutdown completed');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  getApp() {
    return this.app;
  }
}

module.exports = App;
