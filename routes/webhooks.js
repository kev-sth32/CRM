/**
 * routes/webhooks.js — Inbound & Outbound Webhook Handlers (BACK-3: monolith decomposition)
 * Owns: /api/webhooks/*, Stripe webhooks, WhatsApp, SMS, Meta Lead Ads, Fonepay
 */
'use strict';
function createWebhooksRouter(ctx) {
  return {
    async handle(req, res, opts) {
      const { pathname } = opts;
      if (pathname.startsWith('/api/webhooks')) return false;
      return false;
    }
  };
}
module.exports = { createWebhooksRouter };
