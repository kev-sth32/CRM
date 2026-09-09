/**
 * routes/auth.js — Authentication & Session Routes (BACK-3: monolith decomposition)
 *
 * Extracted home for all /api/auth/* handlers.
 * Mount via: const { createAuthRouter } = require('./routes/auth');
 * Long-term: migrate to Express/Fastify middleware pattern.
 */
'use strict';

function createAuthRouter(ctx) {
  return {
    async handle(req, res, { pathname } = {}) {
      // Stubs — full implementations still live in server.js during migration phase.
      // Move one endpoint at a time: copy handler body here, delete from server.js, wire up.
      if (pathname.startsWith('/api/auth/')) {
        return false; // Not yet migrated — fall through to server.js handlers
      }
      return false;
    }
  };
}

module.exports = { createAuthRouter };
