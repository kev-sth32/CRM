/**
 * routes/leads.js — Leads CRUD Routes (BACK-3: monolith decomposition)
 * Owns: GET/POST /api/leads, GET/PATCH/DELETE /api/leads/:id
 * Also owns: lead scoring, SLA, deduplication, fuzzy search, activities
 */
'use strict';
function createLeadsRouter(ctx) {
  return {
    async handle(req, res, opts) {
      const { pathname } = opts;
      if (pathname.startsWith('/api/leads')) return false; // migration in progress
      return false;
    }
  };
}
module.exports = { createLeadsRouter };
