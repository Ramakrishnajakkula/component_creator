const App = require('./src/app');
const config = require('./src/config/env');

let server;

async function startServer() {
  try {
    // Initialize the application
    const appInstance = new App();
    const app = await appInstance.initialize();

    // Start the server
    server = app.listen(config.port, () => {
      console.log(`
🚀 Component Generator API Server Started
📍 Environment: ${config.nodeEnv}
🌐 Server running on port ${config.port}
📊 Health check: http://localhost:${config.port}/health
📚 API Base URL: http://localhost:${config.port}/api
      `);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${config.port} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal) => {
      console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
      
      if (server) {
        server.close(async () => {
          console.log('🔄 HTTP server closed');
          
          try {
            await appInstance.shutdown();
            process.exit(0);
          } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
          }
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
          console.error('⚠️ Forced shutdown after timeout');
          process.exit(1);
        }, 10000);
      }
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
