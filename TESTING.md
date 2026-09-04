# SalesOS Testing Plan

## Running the full suite

```bash
npm run test:all
```

This runs all 19 test suites sequentially. The server must be running on port 3000 (`npm start`) for API-level tests.

## Test suites

### 1. API Smoke Tests (`test.js`)
- Health endpoint in JSON fallback mode.
- Lead creation and listing.
- Server persistence verification.

### 2. End-to-End Tests (`test-e2e.js`)
- Health check, dashboard stats API.
- Leads CRUD and AI qualification.
- Contacts, companies, opportunities, products, tasks, campaigns, automations APIs.
- Omnichannel conversations and messages.
- AI copilot suggestions and approvals.
- Authentication, session inspection, and logout.
- Superadmin platform telemetry and tenant directory.
- All 19 UI routes verified returning 200 OK.

### 3. Tenant Isolation (`test-tenant-isolation.js`)
- Cross-tenant EventStream (SSE) real-time event isolation.
- Tenant-scoped data access enforcement.

### 4. Enterprise Parity (`test-enterprise.js`)
- CPQ quote creation with line-item aggregation and calculations.
- Public E-Signature acceptance and automated deal advancement to "Closed Won".
- No-Code Custom Fields definition, listing, and deletion.
- Outbound Webhook registration, HMAC key generation, and management.
- Quotes directory and public customer sign-off page delivery.

### 5. Production Security (`test-security.js`) — 52 checks
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP, Permissions-Policy).
- Authentication enforcement (401 for unauthenticated requests).
- Password verification (scrypt, bad credentials rejection).
- Session cookie issuance and management.
- RBAC enforcement (superadmin-only operations return 403).
- Email engine and timeline activity logging.
- Stripe checkout integration.
- Brute-force rate limiting (429).
- Public proposal access.
- Self-serve registration and tenant provisioning.
- SQL injection defense (column name sanitization).
- Anti-IDOR (48-char access tokens).
- ESIGN Act audit bundle and contract immutability.
- Password reset workflow and session invalidation.
- GDPR Article 20 data portability export.
- Static asset sandboxing.
- SSRF defense.
- CORS reflection defense.
- GDPR Article 17 Right to Erasure.
- CAN-SPAM/RFC 8058 unsubscribe.
- Payload size limits (413).
- SSE authentication and tenant protection.
- AI approval authorization, state gates, and execution idempotency.
- Stripe webhook anti-replay defense.
- Cryptographic hash buffer length safety.
- Stored XSS payload escaping.
- Email sender domain anti-spoofing.
- Session credential stripping.
- Audit log secret redaction.
- Webhook secret masking.
- Password reset Host-header poisoning defense.
- AI policy enforcement on empty tool arrays.
- CORS host-header reflection defense.
- Quote BOLA and signed contract immutability.
- Mass assignment tenant reassignment defense.
- Registration rate limiter.
- HMAC token enforcement on unsubscribe.
- Per-tenant settings isolation.
- Omnichannel cross-tenant leakage defense.
- Workspace export RBAC enforcement.
- Custom field and webhook deletion BOLA defense.
- AI approval cross-tenant patch and state tampering.
- CSV formula injection defense.
- Custom field entity whitelist validation.
- Webchat webhook tenant resolution.
- Cross-tenant sequence enrollment isolation.

### 6–11. AI & Agent Unit Tests
- `agent-config.test.js` — Agent configuration validation, mode enforcement, tool registry validation.
- `ai-service.test.js` — AI policy enforcement, disabled/allowed-tool runtime checks.
- `ai-guardrails.test.js` — Copilot actions create approvals; autonomous non-approval actions execute.
- `protected-tool.test.js` — High-risk tools return approval requests in copilot mode.
- `followup-policy.test.js` — Follow-up policy enforcement, opt-out/frequency checks.
- `knowledge-processor.test.js` — Knowledge chunking, whitespace normalization.

### 12–15. Scoring, Validation & Retrieval
- `lead-scoring.test.js` — Deterministic scoring, rule matching, score clamping.
- `response-validator.test.js` — Grounded response validation, citation checking.
- `retrieval.test.js` — Tenant-safe knowledge retrieval.
- `phase4-utils.test.js` — Agent transitions, confidence routing, handoff routing, calendar normalization.

### 16. Connector Tests
- `connectors/webchat.test.js` — Website chat payload normalization.

### 17–19. PRD & Specialist Verification
- `test-prd-completion.js` — 12-Step wizard, industry templates, WhatsApp/SMS/Telephony connectors, AI daily briefing, AI quality reviews, all 20 UI routes.
- `test-specialist-fixes.js` — SLA engine, AI evaluation feedback, webhook DLQ, toast system, WCAG keyboard Kanban, webhook deliveries table.
- `test-specialist-round2.js` — Prompt injection defense, multi-currency CPQ tax, database migration parity, SRE graceful shutdown, mobile touch ergonomics.

## PostgreSQL tests
`npm run test:postgres` verifies PostgreSQL connectivity and required tables when `DATABASE_URL` is configured; otherwise exits safely with an explicit skip.

## Test data
Use isolated test tenants and anonymized records. Never use production credentials or customer data. The JSON fallback `data.json` is seeded automatically with default tenants, users, and leads.

## Release gates
All 19 test suites must pass before any phase is marked complete. No autonomous AI release if unauthorized actions, invented prices, opt-out violations, cross-tenant leakage, or escalation failures are detected.
