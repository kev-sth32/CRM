# SalesOS Changelog

## 2026-09-04 — Full UI/UX Elevation Across All Pages & Documentation Sync

### Added — UI/UX Overhaul Across All 16 Pages
- **Standardized Enterprise Shell:** Applied the unified typography (Plus Jakarta Sans & JetBrains Mono), glassmorphic topbar with live connection pulse indicator, 4-section grouped sidebar (Workspace, Revenue Pipeline, Autonomous AI, Analytics & Manage), `⌘K` global search, and `＋ Quick Create` dropdown across all 16 web pages:
  - `index.html` — Executive Dashboard with KPI cards, trend pills, and AI morning briefing.
  - `leads.html` — Leads directory with AI lead qualification, SLA indicators, and quick email composer.
  - `deals.html` — Kanban pipeline with WCAG 2.1 AA keyboard navigation, mobile touch ergonomics, and stage velocity metrics.
  - `quotes.html` — CPQ quote directory with line items, multi-currency tax (USD/EUR/NPR), and public e-sign link generator.
  - `contacts.html` — 360-degree customer contact directory with company linkages and communication history.
  - `companies.html` — Account and enterprise company management with ARR and tiering.
  - `products.html` — Goods & services catalog with SKU, variant, stock, and tax management.
  - `tasks.html` — Sales activity and task queue with SLA breach escalation tracking.
  - `campaigns.html` — Multi-channel marketing campaign manager with UTM tracking and ROI analytics.
  - `automations.html` — Visual workflow and trigger builder with sequence execution logs.
  - `inbox.html` — Unified 3-panel omnichannel inbox (WebChat, WhatsApp, SMS, Telephony) with SLA timers and AI copilot sidebar.
  - `approvals.html` — AI copilot approval queue with diff viewer, 24-hr expiry countdown, and 1-click execution.
  - `reports.html` — Advanced revenue and conversion analytics with CSV formula injection defense and GDPR export.
  - `settings.html` — Per-tenant workspace partitioning, No-Code Custom Fields, and Outbound Webhook DLQ management.
  - `superadmin.html` — Platform control plane with global tenant directory, tenant switching, and system telemetry.
  - `onboarding.html` — 12-Step Business Configuration Wizard with 6 industry vertical templates.
- **Glassmorphic Toast Notification System:** Integrated `SalesOS.showToast()` across all views with success, warning, error, and info variants.
- **Micro-Interactions:** Added subtle hover lifts, smooth transitions, and pulse indicators across buttons, cards, and modal dialogs.
- **Documentation Synchronization:** Updated all architectural, operational, security, AI, omnichannel, and phase acceptance markdown files (`API.md`, `ARCHITECTURE.md`, `RUNBOOK.md`, `SECURITY.md`, `PROJECT_STATUS.md`, `PHASES.md`, `PHASE2_ACCEPTANCE.md`, `PHASE3_ACCEPTANCE.md`, `PHASE4_ACCEPTANCE.md`, `AI_POLICIES.md`, `AI_APPROVALS.md`, `AI_EVALUATION.md`, `AI_TOOLS.md`, `AI_PROVIDER.md`, `AI_ROLLOUT.md`, `AI_RUNTIME.md`, `APPROVALS_OPERATIONS.md`, `FOLLOWUPS.md`, `CONNECTORS.md`, `WEBHOOKS.md`, `OMNICHANNEL.md`, `INBOX_SPEC.md`, `KNOWLEDGE_BASE.md`, `POSTGRESQL.md`, `QUEUE.md`, `SCORING.md`, `VECTOR_SEARCH.md`, `CONTRIBUTING.md`, `SAAS_DOCUMENTATION.md`, `TESTING.md`).

## 2026-09-04 — Specialist Council Enhancements (Round 1 & 2)

### Fixed
- Dashboard rendering failure caused by unclosed conditional block in `index.html` `loadDashboardStats()`.
- Priority leads table stuck on "Loading priority leads..." — added empty-state fallback.
- Test race condition in `test-security.js` step 26 (AI approval cross-tenant execute) caused by `readData()` overwriting `data.json` between test writes and API reads.

### Added — Specialist Council Enhancements (Round 1)
- Webhook retry engine with exponential backoff (`webhook.js`).
- Dead-Letter Queue (DLQ) for persistently failed webhook dispatches.
- Webhook deliveries and DLQ audit endpoints with one-click replay.
- Autonomous Lead SLA Engine (`sla-service.js`) with configurable hot/warm/standard tiers.
- Auto-escalation tasks for SLA breaches with SSE real-time alerts.
- AI closed-loop evaluation feedback injection from tenant quality reviews.
- WCAG 2.1 AA keyboard navigation for Kanban deal board (Space/Arrow/Enter/Escape).

### Added — Specialist Council Enhancements (Round 2)
- Cognitive AppSec: inbound prompt injection defense and adversarial jailbreak neutralization.
- Multi-currency CPQ: USD/EUR/NPR with inclusive and exclusive tax modes.
- Database schema parity verification (migration 022).
- SRE graceful shutdown and unhandled exception traps (`SIGTERM`, `SIGINT`, `uncaughtException`, `unhandledRejection`).
- Mobile touch ergonomics: touch-shift buttons and scroll-snapping for Kanban on mobile viewports.

## 2026-09-04 — Production Security Suite (52 checks)

### Added
- 52-check production security and commercial readiness test suite (`test-security.js`).
- SSRF defense (cloud metadata, loopback, private subnets).
- CORS credential reflection defense.
- XSS payload escaping across leads, inbox, superadmin, and AI approvals.
- CSRF protection via SameSite=Lax cookies.
- Content-Security-Policy and Permissions-Policy headers.
- GDPR Article 17 Right to Erasure with legal certificate.
- GDPR Article 20 full workspace data portability export.
- CAN-SPAM and RFC 8058 one-click unsubscribe with HMAC enforcement.
- ESIGN Act non-repudiation audit bundle (SHA-256, IP, User-Agent, certificate chain).
- ESIGN Act contract immutability (re-signing prevention with 409 Conflict).
- Payload size limits and CWE-400 memory exhaustion defense (HTTP 413).
- Password reset Host-header poisoning defense.
- CSV formula injection defense (CWE-1236) in reports.
- Anti-IDOR defense with 48-char high-entropy access tokens.
- Mass assignment tenant reassignment defense.
- EventStream (SSE) authentication and tenant protection.
- Sliding window brute-force rate limiter (login and registration).
- Static asset sandboxing (database/source file read prevention).
- Audit log secret redaction and credential masking.
- AI approval cross-tenant authorization, state gates, and execution idempotency.

## 2026-09-04 — Enterprise Features

### Added
- CPQ quote creation with line-item aggregation and tax calculations.
- Public customer proposal and E-Signature acceptance workflow.
- Automated deal advancement to "Closed Won" on quote signature.
- No-Code Custom Fields (definition, listing, deletion).
- Outbound Webhook registration with HMAC key generation.
- Per-tenant workspace settings partitioning.
- Stripe checkout session integration and billing portal.
- Self-serve workspace registration and automatic tenant provisioning.
- 12-Step Business Configuration Wizard with completion tracking.
- 6 industry vertical templates (SaaS, Real Estate, Education, Healthcare, Automotive, Hospitality).
- Omnichannel connectors: Meta WhatsApp Cloud API, SMS with opt-out keyword enforcement, Telephony with AI Call Intelligence.
- AI Daily Sales Manager and Morning Briefing Engine.
- AI Conversation Quality Review and Evaluation System.
- Superadmin platform control plane with tenant directory and telemetry.

## 2026-09-04 — Full Test Suite (19 suites, 100% pass)

### Verified
- `test.js` — API smoke tests.
- `test-e2e.js` — 19 CRM entity views and auth checks.
- `test-tenant-isolation.js` — Cross-tenant SSE and data isolation.
- `test-enterprise.js` — CPQ, E-Sign, Custom Fields, Webhooks.
- `test-security.js` — 52 security and production readiness checks.
- `agent-config.test.js` — Agent configuration validation.
- `ai-service.test.js` — AI policy enforcement.
- `ai-guardrails.test.js` — AI guardrails.
- `protected-tool.test.js` — Protected tool wrappers.
- `followup-policy.test.js` — Follow-up policy enforcement.
- `knowledge-processor.test.js` — Knowledge chunking.
- `lead-scoring.test.js` — Lead scoring.
- `response-validator.test.js` — Grounded response validation.
- `retrieval.test.js` — Knowledge retrieval.
- `phase4-utils.test.js` — Phase 4 utility integration.
- `connectors/webchat.test.js` — Website chat normalization.
- `test-prd-completion.js` — PRD advanced capabilities.
- `test-specialist-fixes.js` — Specialist council fixes.
- `test-specialist-round2.js` — Round 2 specialist fixes.
