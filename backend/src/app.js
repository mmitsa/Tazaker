require('dotenv').config();
require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler.middleware');
const { testConnection: testDatabaseConnection } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { testSMSConfig } = require('./config/sms');

// Initialize Express app
const app = express();

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// HTTP request logger (Morgan)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Custom morgan format with Winston
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.http(message.trim()),
      },
    })
  );
}

// ============================================
// Health check endpoint
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API version info
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hospital Queue Management System API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
  });
});

// ============================================
// API Routes
// ============================================

// Auth routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/v1/auth', authRoutes);

// TODO: Add more routes
// const clinicRoutes = require('./routes/clinic.routes');
// const ticketRoutes = require('./routes/ticket.routes');
// const patientRoutes = require('./routes/patient.routes');
// const doctorRoutes = require('./routes/doctor.routes');
// const reportRoutes = require('./routes/report.routes');
//
// app.use('/api/v1/clinics', clinicRoutes);
// app.use('/api/v1/tickets', ticketRoutes);
// app.use('/api/v1/patients', patientRoutes);
// app.use('/api/v1/doctors', doctorRoutes);
// app.use('/api/v1/reports', reportRoutes);

// ============================================
// Error Handling
// ============================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// Server Initialization
// ============================================

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

/**
 * Initialize all connections and start server
 */
const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    await testDatabaseConnection();

    // Connect to Redis
    logger.info('Connecting to Redis...');
    await connectRedis();

    // Test SMS configuration
    logger.info('Testing SMS configuration...');
    await testSMSConfig();

    // Start Express server
    app.listen(PORT, HOST, () => {
      logger.info(`============================================`);
      logger.info(`🏥 Hospital Queue Management System`);
      logger.info(`============================================`);
      logger.info(`Server running on: http://${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://${HOST}:${PORT}/health`);
      logger.info(`API endpoint: http://${HOST}:${PORT}/api/v1`);
      logger.info(`============================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Close database connections
    const { pool } = require('./config/database');
    await pool.end();
    logger.info('Database connections closed');

    // Close Redis connection
    const { client } = require('./config/redis');
    await client.quit();
    logger.info('Redis connection closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
