/**
 * session-store.js — Pluggable session store (DEVOPS-3: Redis migration path)
 *
 * Provides a unified session interface that works with either:
 *   - In-memory Map (current, dev-only, single-instance)
 *   - Redis (production, horizontal scaling)
 *
 * Switch to Redis by setting REDIS_URL env var. No server.js changes needed.
 *
 * Usage (server.js):
 *   const sessionStore = require('./session-store');
 *   // Instead of: memorySessions.set(token, data)
 *   await sessionStore.set(token, data, ttlSeconds);
 *   // Instead of: memorySessions.get(token)
 *   const session = await sessionStore.get(token);
 *   // Instead of: memorySessions.delete(token)
 *   await sessionStore.delete(token);
 */
'use strict';

const logger = require('./logger');

class InMemorySessionStore {
  constructor() {
    this._map = new Map();
  }

  async get(key) {
    const entry = this._map.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._map.delete(key);
      return null;
    }
    return entry.data;
  }

  async set(key, data, ttlSeconds = 604800) {
    this._map.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  async delete(key) {
    this._map.delete(key);
  }

  async size() {
    return this._map.size;
  }

  // Compatibility shim: expose as Map-like for existing code during migration
  get size_sync() { return this._map.size; }
}

class RedisSessionStore {
  constructor(redisClient) {
    this._client = redisClient;
    this._prefix = 'salesos:session:';
  }

  async get(key) {
    try {
      const val = await this._client.get(this._prefix + key);
      return val ? JSON.parse(val) : null;
    } catch (e) {
      logger.error('Redis session GET failed', { error: e.message });
      return null;
    }
  }

  async set(key, data, ttlSeconds = 604800) {
    try {
      await this._client.setEx(this._prefix + key, ttlSeconds, JSON.stringify(data));
    } catch (e) {
      logger.error('Redis session SET failed', { error: e.message });
    }
  }

  async delete(key) {
    try {
      await this._client.del(this._prefix + key);
    } catch (e) {
      logger.error('Redis session DEL failed', { error: e.message });
    }
  }

  async size() {
    try {
      const keys = await this._client.keys(this._prefix + '*');
      return keys.length;
    } catch (_) { return 0; }
  }
}

let _store = null;

async function createSessionStore() {
  if (_store) return _store;

  if (process.env.REDIS_URL) {
    try {
      // DEVOPS-3: Use Redis when REDIS_URL is configured
      // Install: npm install redis
      const { createClient } = require('redis');
      const client = createClient({ url: process.env.REDIS_URL });
      client.on('error', (e) => logger.error('Redis client error', { error: e.message }));
      await client.connect();
      _store = new RedisSessionStore(client);
      logger.info('Session store: Redis connected', { url: process.env.REDIS_URL.replace(/:[^:@]+@/, ':***@') });
    } catch (e) {
      logger.warn('Redis unavailable, falling back to in-memory sessions', { error: e.message });
      _store = new InMemorySessionStore();
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('DEVOPS-3: REDIS_URL not set in production. Using in-memory sessions — horizontal scaling will NOT work. Set REDIS_URL for a Redis instance.');
    }
    _store = new InMemorySessionStore();
  }

  return _store;
}

// Synchronous accessor for existing code compatibility
function getSessionStore() {
  if (!_store) _store = new InMemorySessionStore();
  return _store;
}

module.exports = { createSessionStore, getSessionStore, InMemorySessionStore, RedisSessionStore };
