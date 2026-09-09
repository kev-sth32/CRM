/**
 * routes/deals.js — Deals / Opportunities Routes (BACK-3: monolith decomposition)
 * Owns: GET/POST /api/deals, /api/opportunities, /api/pipeline
 */
'use strict';
function createDealsRouter(ctx) {
  return {
    async handle(req, res, opts) {
      const { pathname } = opts;
      if (pathname.startsWith('/api/deals') || pathname.startsWith('/api/opportunities') || pathname.startsWith('/api/pipeline')) return false;
      return false;
    }
  };
}
module.exports = { createDealsRouter };
