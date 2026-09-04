/**
 * logger.js
 * Production-Grade Structured JSON Logging Engine
 * Supports NDJSON streaming for Loki, Datadog, and CloudWatch with built-in DLP Secret Redaction.
 */

class StructuredLogger {
  constructor() {
    this.isJson = process.env.LOG_FORMAT === 'json' || process.env.NODE_ENV === 'production';
    this.sensitiveKeys = ['password', 'password_hash', 'secret', 'token', 'token_hash', 'access_token', 'authorization', 'api_key'];
  }

  redact(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 4) return obj;
    if (Array.isArray(obj)) return obj.map(item => this.redact(item, depth + 1));
    const sanitized = {};
    for (const [k, v] of Object.entries(obj)) {
      if (this.sensitiveKeys.some(sk => k.toLowerCase().includes(sk))) {
        sanitized[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null) {
        sanitized[k] = this.redact(v, depth + 1);
      } else {
        sanitized[k] = v;
      }
    }
    return sanitized;
  }

  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = this.redact(meta);

    if (this.isJson) {
      const entry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...sanitizedMeta
      };
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      const metaStr = Object.keys(sanitizedMeta).length ? ' ' + JSON.stringify(sanitizedMeta) : '';
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`);
    }
  }

  info(msg, meta) { this.log('info', msg, meta); }
  warn(msg, meta) { this.log('warn', msg, meta); }
  error(msg, meta) { this.log('error', msg, meta); }

  http(req, res, durationMs) {
    this.log('info', `${req.method} ${req.url} ${res.statusCode} (${durationMs}ms)`, {
      http: {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration_ms: durationMs,
        user_agent: req.headers['user-agent'] || 'unknown',
        ip: req.socket?.remoteAddress || '127.0.0.1'
      }
    });
  }
}

module.exports = new StructuredLogger();
