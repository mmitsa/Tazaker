const redis = require('redis');
const logger = require('../utils/logger');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Create Redis client
const client = redis.createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
  password: redisConfig.password,
  database: redisConfig.db,
});

// Handle Redis events
client.on('connect', () => {
  logger.info('Redis client connecting...');
});

client.on('ready', () => {
  logger.info('Redis client ready');
});

client.on('error', (err) => {
  logger.error('Redis client error:', err);
});

client.on('end', () => {
  logger.info('Redis client disconnected');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await client.connect();
    logger.info('Redis connected successfully');
    return true;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

// Redis helper functions
const redisHelpers = {
  // Set key with expiry
  async set(key, value, expiryInSeconds = 3600) {
    try {
      await client.setEx(key, expiryInSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      throw error;
    }
  },

  // Get key
  async get(key) {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      throw error;
    }
  },

  // Delete key
  async del(key) {
    try {
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      throw error;
    }
  },

  // Check if key exists
  async exists(key) {
    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      throw error;
    }
  },

  // Set expiry on existing key
  async expire(key, seconds) {
    try {
      await client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Redis EXPIRE error:', error);
      throw error;
    }
  },

  // Get keys by pattern
  async keys(pattern) {
    try {
      const keys = await client.keys(pattern);
      return keys;
    } catch (error) {
      logger.error('Redis KEYS error:', error);
      throw error;
    }
  },

  // Increment value
  async incr(key) {
    try {
      const value = await client.incr(key);
      return value;
    } catch (error) {
      logger.error('Redis INCR error:', error);
      throw error;
    }
  },

  // Hash operations
  async hSet(key, field, value) {
    try {
      await client.hSet(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis HSET error:', error);
      throw error;
    }
  },

  async hGet(key, field) {
    try {
      const value = await client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis HGET error:', error);
      throw error;
    }
  },

  async hGetAll(key) {
    try {
      const values = await client.hGetAll(key);
      const parsed = {};
      for (const [field, value] of Object.entries(values)) {
        parsed[field] = JSON.parse(value);
      }
      return parsed;
    } catch (error) {
      logger.error('Redis HGETALL error:', error);
      throw error;
    }
  },

  // List operations
  async lPush(key, value) {
    try {
      await client.lPush(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis LPUSH error:', error);
      throw error;
    }
  },

  async rPush(key, value) {
    try {
      await client.rPush(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis RPUSH error:', error);
      throw error;
    }
  },

  async lRange(key, start, stop) {
    try {
      const values = await client.lRange(key, start, stop);
      return values.map((v) => JSON.parse(v));
    } catch (error) {
      logger.error('Redis LRANGE error:', error);
      throw error;
    }
  },

  // Flush database (use with caution!)
  async flushDb() {
    try {
      await client.flushDb();
      logger.warn('Redis database flushed');
      return true;
    } catch (error) {
      logger.error('Redis FLUSHDB error:', error);
      throw error;
    }
  },
};

module.exports = {
  client,
  connectRedis,
  ...redisHelpers,
};
