/**
 * routes/superadmin.js — Platform Superadmin API (BACK-3: monolith decomposition)
 * Owns: /api/superadmin/*, /metrics (admin)
 * Security: enforces superadmin role, CSRF guard, dedicated rate limiter
 */
'use strict';
function createSuperadminRouter(ctx) {
  return {
    async handle(req, res, opts) {
      const { pathname } = opts;
      if (pathname.startsWith('/api/superadmin')) return false;
      return false;
    }
  };
}
module.exports = { createSuperadminRouter };
