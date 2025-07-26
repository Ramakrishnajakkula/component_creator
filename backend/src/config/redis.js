const redis = require('redis');
const config = require('./env');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.client && this.isConnected) {
        console.log('Redis already connected');
        return this.client;
      }

      console.log('Connecting to Redis...');
      
      this.client = redis.createClient({
        url: config.redis.url,
      });

      // Handle Redis events
      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔄 Redis Client Connected');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis Client Ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('⚠️ Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.client = null;
        this.isConnected = false;
        console.log('📴 Redis disconnected');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from Redis:', error.message);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }

  isReady() {
    return this.isConnected && this.client;
  }

  // Helper methods for common operations
  async set(key, value, expireInSeconds = null) {
    try {
      if (!this.isReady()) {
        throw new Error('Redis client not ready');
      }

      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      
      if (expireInSeconds) {
        return await this.client.setEx(key, expireInSeconds, stringValue);
      }
      
      return await this.client.set(key, stringValue);
    } catch (error) {
      console.error('Redis SET error:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      if (!this.isReady()) {
        throw new Error('Redis client not ready');
      }

      const value = await this.client.get(key);
      
      if (!value) return null;
      
      // Try to parse as JSON, if fails return as string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis GET error:', error);
      throw error;
    }
  }

  async del(key) {
    try {
      if (!this.isReady()) {
        throw new Error('Redis client not ready');
      }

      return await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
      throw error;
    }
  }

  async exists(key) {
    try {
      if (!this.isReady()) {
        throw new Error('Redis client not ready');
      }

      return await this.client.exists(key);
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      throw error;
    }
  }
}

module.exports = new RedisClient();
