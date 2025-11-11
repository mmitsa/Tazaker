const socketIO = require('socket.io');
const { verifyAccessToken } = require('../config/jwt');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialize Socket.IO
 */
const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.username = decoded.username;

      logger.info('Socket authenticated', {
        socketId: socket.id,
        userId: decoded.userId,
        role: decoded.role,
      });

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info('Client connected', {
      socketId: socket.id,
      userId: socket.userId,
      role: socket.userRole,
    });

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join role-specific room
    socket.join(`role:${socket.userRole}`);

    // Handle clinic subscription
    socket.on('subscribe:clinic', (clinicId) => {
      socket.join(`clinic:${clinicId}`);
      logger.debug('Subscribed to clinic', { socketId: socket.id, clinicId });
    });

    // Handle clinic unsubscription
    socket.on('unsubscribe:clinic', (clinicId) => {
      socket.leave(`clinic:${clinicId}`);
      logger.debug('Unsubscribed from clinic', { socketId: socket.id, clinicId });
    });

    // Handle display screen subscription (all clinics)
    socket.on('subscribe:display', () => {
      socket.join('display:all');
      logger.debug('Subscribed to display updates', { socketId: socket.id });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info('Client disconnected', {
        socketId: socket.id,
        userId: socket.userId,
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message,
      });
    });
  });

  logger.info('Socket.IO initialized successfully');
  return io;
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

/**
 * Emit event to specific user
 */
const emitToUser = (userId, event, data) => {
  try {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, data);
    logger.debug('Event emitted to user', { userId, event });
  } catch (error) {
    logger.error('Error emitting to user:', error);
  }
};

/**
 * Emit event to specific role
 */
const emitToRole = (role, event, data) => {
  try {
    if (!io) return;
    io.to(`role:${role}`).emit(event, data);
    logger.debug('Event emitted to role', { role, event });
  } catch (error) {
    logger.error('Error emitting to role:', error);
  }
};

/**
 * Emit event to specific clinic
 */
const emitToClinic = (clinicId, event, data) => {
  try {
    if (!io) return;
    io.to(`clinic:${clinicId}`).emit(event, data);
    logger.debug('Event emitted to clinic', { clinicId, event });
  } catch (error) {
    logger.error('Error emitting to clinic:', error);
  }
};

/**
 * Emit event to all display screens
 */
const emitToDisplays = (event, data) => {
  try {
    if (!io) return;
    io.to('display:all').emit(event, data);
    logger.debug('Event emitted to displays', { event });
  } catch (error) {
    logger.error('Error emitting to displays:', error);
  }
};

/**
 * Broadcast event to all connected clients
 */
const broadcast = (event, data) => {
  try {
    if (!io) return;
    io.emit(event, data);
    logger.debug('Event broadcasted', { event });
  } catch (error) {
    logger.error('Error broadcasting:', error);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRole,
  emitToClinic,
  emitToDisplays,
  broadcast,
};
