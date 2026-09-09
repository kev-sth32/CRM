/**
 * routes/index.js — Route Registry (BACK-3: monolith decomposition)
 *
 * This is the central router that composes all feature-area route modules.
 * During migration, each module's handle() returns false (falls through to server.js).
 * As endpoints are fully migrated, they return true (handled) and are removed from server.js.
 *
 * Migration checklist:
 *   1. Copy handler block from server.js into the appropriate routes/*.js file
 *   2. Change return false -> return true in that handler
 *   3. Delete the corresponding block from server.js
 *   4. Run npm test to verify no regressions
 */
'use strict';
const { createAuthRouter } = require('./auth');
const { createLeadsRouter } = require('./leads');
const { createDealsRouter } = require('./deals');
const { createAIRouter } = require('./ai');
const { createSuperadminRouter } = require('./superadmin');
const { createWebhooksRouter } = require('./webhooks');
const { createSettingsRouter } = require('./settings');

function createRouter(ctx) {
  const routers = [
    createAuthRouter(ctx),
    createLeadsRouter(ctx),
    createDealsRouter(ctx),
    createAIRouter(ctx),
    createSuperadminRouter(ctx),
    createWebhooksRouter(ctx),
    createSettingsRouter(ctx),
  ];

  return {
    async handle(req, res, opts) {
      for (const router of routers) {
        if (await router.handle(req, res, opts)) return true;
      }
      return false; // Fall through to legacy server.js handlers
    }
  };
}

module.exports = { createRouter };
