/**
 * TradeView Server - Entry Point
 * REST API + WebSocket server for financial data
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { env } from './config/env.js';
import { testConnection } from './db/index.js';
import { setupWebSocket, cleanup } from './websocket/index.js';

// API imports
import apiRoutes from './api/routes/index.js';
import { notFoundHandler, errorHandler, requestLogger } from './api/middleware/index.js';

const app = express();
const server = createServer(app);

// ===================
// Global Middleware
// ===================

// CORS
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Parse cookies (for session management)
app.use(cookieParser());

// Request logging (only in development)
if (env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// ===================
// Routes
// ===================

// API routes (mounted at /api)
app.use('/api', apiRoutes);

// ===================
// Error Handling
// ===================

// 404 handler (must be after routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ===================
// Server Start
// ===================

const PORT = parseInt(env.PORT, 10);

async function start() {
  console.log('');
  console.log('🚀 ═══════════════════════════════════════');
  console.log('   TradeView Server Starting...');
  console.log('═══════════════════════════════════════════');
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Client URL: ${env.CLIENT_URL}`);

  // Test database connection
  if (env.DATABASE_URL) {
    await testConnection();
  } else {
    console.log('⚠️  No DATABASE_URL configured, running without database');
  }

  server.listen(PORT, () => {
    console.log('');
    console.log('✅ Server is ready!');
    console.log('───────────────────────────────────────────');
    console.log(`   REST API: http://localhost:${PORT}/api`);
    console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log('───────────────────────────────────────────');
    console.log('');

    // Initialize WebSocket after server is listening
    setupWebSocket(server);

    console.log('📚 API Endpoints:');
    console.log('   GET  /api/stocks/:symbol');
    console.log('   GET  /api/stocks?symbols=AAPL,GOOGL');
    console.log('   GET  /api/crypto/:symbol');
    console.log('   POST /api/currencies/convert');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/preferences');
    console.log('');
  });
}

// ===================
// Graceful Shutdown
// ===================

function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down gracefully...`);
  cleanup();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  // Don't exit, just log
});

// Start the server
start().catch((error) => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});
