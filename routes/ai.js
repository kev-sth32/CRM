/**
 * routes/ai.js — AI Copilot, Agents, Approvals & Guardrails (BACK-3: monolith decomposition)
 * Owns: /api/ai/*, /api/agents/*, /api/approvals/*, /api/handoffs/*
 */
'use strict';
function createAIRouter(ctx) {
  return {
    async handle(req, res, opts) {
      const { pathname } = opts;
      if (pathname.startsWith('/api/ai') || pathname.startsWith('/api/agents') || pathname.startsWith('/api/approvals') || pathname.startsWith('/api/handoffs')) return false;
      return false;
    }
  };
}
module.exports = { createAIRouter };
