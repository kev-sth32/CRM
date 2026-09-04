# SalesOS Changelog

## 2026-09-05 — Specialist Council 100% Perfection & Phases 1–3 Implementations

### Added — Deep Local Integrations, Observability & Product-Led Growth
- **Bikram Sambat (BS/AD) Dual Calendar Engine (`bs-calendar.js`):**
  - High-precision Bikram Sambat converter mapping AD dates to BS years (2075–2090), months (Baisakh to Chaitra), and dual dates.
  - Automatically calculates Nepal Fiscal Years (Shrawan 1 to Ashadh end, e.g. `FY 2083/84`).
  - Added `GET /api/calendar/dual-date` endpoint and integrated dual date displays into `quotes.html` and `quote-view.html`.
- **Fonepay & eSewa Instant QR Payment Callbacks (`connectors/payment-nepal.js`):**
  - Instant QR payment webhook ingestion via `POST /api/webhooks/fonepay` and `POST /api/webhooks/esewa`.
  - Reconciles payments, marks Quotes as `Paid`, and automatically advances linked Deals to `Closed Won` with 100% probability.
  - Dynamic QR code generation with live quote reference on public proposal pages (`quote-view.html`) with instant clearance simulation buttons.
- **Global Dark Mode & Mobile Responsive Tables (`app.css`, `app.js`):**
  - Full `[data-theme="dark"]` design system with deep slate surfaces and high-contrast typography.
  - Persistent theme toggle (`🌙` / `☀️`) in topbar with `localStorage` persistence and system `prefers-color-scheme` support.
  - Mobile card-view transforms (`.table-card-mobile`) for tables on viewports under 640px.
- **Prometheus Metrics Scrape Endpoint (`metrics-service.js`, `GET /metrics`):**
  - Tracks HTTP request rates by route, status code, and latency histogram buckets (5ms to 5000ms).
  - Exposes active SSE client gauges and process resident memory (RSS / Heap) in Prometheus text format.
- **Structured JSON Logging Engine (`logger.js`):**
  - Production-ready NDJSON logging with automatic DLP credential and secret redaction.
- **AES-256-GCM Cryptographic Storage (`crypto-storage.js`):**
  - Protects tenant webhook secrets, access tokens, and merchant keys at rest with Authenticated Encryption.
- **Viral Referral Engine & Multi-Channel WhatsApp Follow-ups:**
  - Embedded viral *"Powered by SalesOS"* referral banner on public proposal pages (`quote-view.html`).
  - Upgraded follow-up sequence execution (`followup-execution.js`) to support multi-channel WhatsApp messaging with working hours and opt-out preflight checks.
- **Verification & Test Coverage:**
  - Added `test-local-integrations.js` (13 tests) and `test-growth-security.js` (8 tests).
  - Verified 100% pass across all 23 test suites and 60+ security checks via `npm run test:all`.

## 2026-09-04 — Alippo AI Co-Founder Capabilities & Meta Lead Ads Ingestion

### Added — AI Co-Founder & Social Selling Engine (Inspired by Alippo)
- **Pillar 1: AI Co-Founder Ops Room & Overnight Autonomous Digest:**
  - Executive Ops Room widget on `index.html` surfacing overnight autonomous achievements: leads qualified, quotes staged, SLA breaches prevented, and active pipeline protected.
  - Generates Top 3 Daily Founder Priorities categorized by urgency (Hot Lead Triage, Deal Risk Mitigation, Revenue Growth) with direct 1-click action triggers.
  - Backend API: `GET /api/ai/cofounder/ops-digest` with multi-tenant scoping and real-time activity metrics.
- **Pillar 2: Meta (Facebook & Instagram) Lead Ads Webhook Connector:**
  - Implemented `connectors/meta-leadgen.js` supporting standard Meta LeadGen webhook architecture.
  - Handshake verification (`GET /api/webhooks/meta-lead-gen`) with `hub.mode` and `hub.verify_token` matching.
  - Inbound lead ingestion (`POST /api/webhooks/meta-lead-gen`) with cryptographic HMAC-SHA256 signature verification (`x-hub-signature-256`), automatic normalization into CRM Leads, real-time SSE dispatch, and audit logging.
- **Pillar 3: AI Pitch & Social Ad Creative Studio:**
  - Implemented `pitch-studio-service.js` and `POST /api/ai/pitch-studio/generate`.
  - 1-Click WhatsApp Pitch Generator supporting **Nepglish**, **Nepali**, and **English** tones, pre-formatted for direct WhatsApp Web/Mobile dispatch with automatic Nepal phone country code (`+977`) prefixing in `leads.html`.
  - Social Ad Creative Generator in `campaigns.html` outputting targeted Facebook, Instagram, and LinkedIn ad copy, hooks, value bullets, and hashtags.
- **Pillar 4: 1-Click WhatsApp Commercial Product Flyer Generator:**
  - Implemented `GET /api/products/:id/flyer-data` with automatic 13% Nepal VAT calculation and formal digital quotation links.
  - Interactive WhatsApp Commercial Flyer modal in `products.html` displaying QR code, pricing breakdowns, and direct `https://wa.me/?text=...` dispatch.
- **Verification & Test Coverage:**
  - Added `test-alippo-inspired.js` covering webhook handshake, lead creation, ops digest, pitch generation, and VAT flyer calculations. Registered as `test:alippo` and integrated into `npm run test:all`.

## 2026-09-04 — Enterprise Parity with Salesforce & Zoho CRM (7 Pillars)

### Added — Enterprise Core Capabilities
- **Pillar 1: Visual Blueprint & State Machine Gates (Salesforce Flow / Zoho Blueprint):**
  - Implemented `blueprint-service.js` with API validation gate enforcement (`validateStageTransition`) on opportunity stage progression (`PATCH /api/opportunities/:id`).
  - Required fields, checklists, and minimum value constraints must be satisfied before deals can advance stages; unauthorized transitions return HTTP 422 with gate failure reason.
  - Interactive UI in `automations.html` with Visual Pipeline State Machine Flow and Stage Transition Gate builder.
- **Pillar 2: Collaborative Revenue Forecasting & Opportunity Splits:**
  - Implemented `forecast-service.js` supporting Collaborative Forecast category rollups (Closed Won, Commit, Best Case, Pipeline) and quota attainment analytics.
  - Added Manager Overrides (`/api/forecasts/adjust`) with audit logging.
  - Added Multi-Owner Opportunity Splits (`/api/opportunities/:id/splits`) strictly enforcing a 100% total allocation sum with collaborative owner attribution.
  - Interactive ribbon in `deals.html` and Opportunity Splits modal for co-owner revenue sharing.
- **Pillar 3: Advanced CPQ, Volume Slabs & Subscription Amendments (CLM):**
  - Implemented `clm-service.js` featuring volume pricing slabs with tiered quantity discounts (`applyVolumePricing`).
  - Added Product Bundle validation (`validateProductBundle`) enforcing required dependency items and mutual exclusion conflict rules.
  - Added Contract Lifecycle Management (CLM) mid-term co-terming subscription amendment proration (`calculateSubscriptionAmendment`).
- **Pillar 4: Granular Field-Level Security (FLS) & Enterprise SSO / SCIM:**
  - Implemented `fls-service.js` providing role-based field masking (`••••••••`), read-only lockouts, and confidential data filtering across Leads, Contacts, Opportunities, and Quotes.
  - Integrated into generic CRM GET/PATCH route pipelines.
  - Implemented `sso-service.js` supporting SAML 2.0 Identity Provider configurations, Just-In-Time (JIT) provisioning, Service Provider metadata, and SCIM 2.0 User resource formatting (`/scim/v2/Users`).
  - New FLS permissions matrix and Enterprise SSO & SCIM tabs in `settings.html`.
- **Pillar 5: Live In-App WebRTC Softphone Dialer & Telephony CTI:**
  - Implemented `telephony-dialer-service.js` managing softphone sessions (`/api/telephony/dial`, `/api/telephony/call-state`, `/api/telephony/call-end`).
  - Automatically logs completed call duration, timestamps, and agent notes directly into customer timeline activities.
  - Floating WebRTC Softphone Dialer widget in `app.js` with dial pad, call timer, and topbar trigger button.
- **Pillar 6: Data Hygiene — Fuzzy Deduplication & 3-Column Record Merge:**
  - Implemented `dedupe-service.js` with Levenshtein distance string similarity and duplicate detection across Leads and Contacts.
  - Added 3-column field-by-field survivor selection and atomic merge engine (`/api/leads/merge`, `/api/contacts/merge`) with activity log consolidation and victim record archival.
  - Deduplication modal and "Scan Duplicates" buttons in `leads.html` and `contacts.html`.
- **Pillar 7: PWA Mobile Shell & Offline Cache:**
  - Created standalone web app manifest (`manifest.json`) and Service Worker (`sw.js`).
  - Implemented cache-first offline asset strategy with network-first fallback for CRM API endpoints.
  - Registered service worker across all application views via `SalesOS.init()`.
- **Verification & Test Coverage:**
  - Added `test-enterprise-parity.js` validating all 7 pillars end-to-end; verified 100% pass across 20 test suites and 52 security checks (`npm run test:all`).

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
