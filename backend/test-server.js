const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./src/config/env');

const app = express();

// Security middleware
app.use(helmet({
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
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    message: 'Component Generator API is running (Test Mode)',
    services: {
      database: 'not connected (test mode)',
      redis: 'not connected (test mode)'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Component Generator API',
    version: '1.0.0',
    status: 'running (test mode)',
    timestamp: new Date().toISOString(),
    message: 'Backend is working! Ready for database connections.',
    endpoints: {
      health: '/health',
      auth: '/api/auth (requires database)',
      sessions: '/api/sessions (requires database)',
      ai: '/api/ai (requires database)'
    },
    nextSteps: [
      'Set up MongoDB (local or Atlas)',
      'Set up Redis (local or cloud)',
      'Add OpenRouter API key to .env',
      'Restart server with full database support'
    ]
  });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    server: 'Express.js backend is functioning correctly'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: ['/', '/health', '/test']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// Start the server
const PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`
🚀 Component Generator API Server Started (Test Mode)
📍 Environment: ${config.nodeEnv}
🌐 Server running on http://localhost:${PORT}
📊 Health check: http://localhost:${PORT}/health
🧪 Test endpoint: http://localhost:${PORT}/test

⚠️  NOTE: This is test mode without database connections.
   To enable full functionality:
   1. Set up MongoDB and Redis
   2. Update .env file with connection strings
   3. Restart with 'node server.js' for full features
  `);
});

module.exports = app;
