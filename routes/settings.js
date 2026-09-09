/**
 * routes/settings.js — Tenant Settings, Knowledge Base, Custom Fields, Integrations (BACK-3)
 * Owns: /api/settings/*, /api/knowledge/*, /api/custom-fields/*
 */
'use strict';
function createSettingsRouter(ctx) {
  return {
    async handle(req, res, opts) {
      const { pathname } = opts;
      if (pathname.startsWith('/api/settings') || pathname.startsWith('/api/knowledge') || pathname.startsWith('/api/custom-fields')) return false;
      return false;
    }
  };
}
module.exports = { createSettingsRouter };
