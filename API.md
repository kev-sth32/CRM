# SalesOS API Reference

## Conventions
Base URL: `/api`. Requests and responses use JSON. All API requests require an authenticated session cookie (`salesos_session`) except public endpoints listed below. Tenant context is derived from the authenticated user's session.

## Public Endpoints (No Authentication Required)
- `GET /api/health` — Service and database mode.
- `POST /api/auth/login` — Login with email/password.
- `POST /api/auth/register` — Self-serve workspace registration.
- `POST /api/auth/forgot-password` — Request password reset.
- `POST /api/auth/reset-password` — Complete password reset with token.
- `GET /api/quotes/:access_token` — Public customer proposal view.
- `POST /api/quotes/sign/:access_token` — Public E-Signature acceptance.
- `GET /api/unsubscribe` — CAN-SPAM one-click unsubscribe.
- `POST /api/webhooks/website_chat` — Inbound webchat webhook.

## Health
`GET /api/health`

Returns service status, database mode (`postgresql` or `json-fallback`), and security configuration.

## Authentication
```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

Login sets an HTTP-only `salesos_session` cookie. `GET /api/auth/me` returns the current user with credentials stripped. Registration provisions a new tenant, owner user, and session. Password reset invalidates existing sessions.

## Dashboard
`GET /api/dashboard/stats` — Tenant KPIs: total leads, deals, pipeline value, conversion rate, active tasks, priority leads, recent activities, and AI summary.

## Leads
```http
GET    /api/leads
POST   /api/leads
PATCH  /api/leads/:id
DELETE /api/leads/:id
POST   /api/leads/:id/qualify
POST   /api/leads/:id/send-email
DELETE /api/leads/:id/gdpr-erase
GET    /api/leads/sla-status
```

Create requires `name`. Qualify evaluates tenant scoring rules, updates score, and returns matched signals. GDPR erase permanently scrubs PII and returns a legal certificate. SLA status returns compliance rates, breached leads, and pending deadlines.

## Contacts, Companies, Opportunities, Products, Tasks, Campaigns, Automations
```http
GET  /api/{collection}
POST /api/{collection}
```

All collections are tenant-scoped. Required fields vary by entity (e.g., Companies: `name`, Products: `name`).

## Deals / Opportunities
Pipeline Kanban with stage management. Stage updates via `PATCH /api/opportunities/:id`.

## Quotes (CPQ)
```http
GET  /api/quotes
POST /api/quotes
GET  /api/quotes/:access_token        (public)
POST /api/quotes/sign/:access_token   (public)
```

Create builds a quote with line items, subtotal, discount, tax (inclusive/exclusive), and total. Each quote receives a 48-character high-entropy access token. Public sign accepts `signer_name` and creates an ESIGN Act non-repudiation audit bundle.

## Custom Fields
```http
GET    /api/settings/custom-fields
POST   /api/settings/custom-fields
DELETE /api/settings/custom-fields/:id
```

Entity whitelist validation: `lead`, `contact`, `company`, `opportunity`, `product`, `task`, `quote`.

## Webhooks
```http
GET    /api/settings/webhooks
POST   /api/settings/webhooks
DELETE /api/settings/webhooks/:id
GET    /api/settings/webhooks/deliveries
POST   /api/settings/webhooks/deliveries/:id/retry
```

Each webhook gets an HMAC secret key. Deliveries endpoint shows dispatch status, latency, attempt count, and DLQ status. Retry replays a failed/quarantined delivery.

## Settings
```http
GET   /api/settings
PATCH /api/settings
POST  /api/onboarding/complete
GET   /api/onboarding/status
GET   /api/industry-templates
POST  /api/industry-templates/:id/apply
```

Per-tenant workspace settings. 12-step onboarding wizard. 6 industry vertical templates.

## AI Endpoints
```http
GET  /api/ai/status
GET  /api/ai/copilot/suggest
POST /api/ai/respond
GET  /api/ai/daily-brief
GET  /api/ai/evaluations
POST /api/ai/evaluations
```

Copilot suggest returns AI recommendations enriched with tenant quality evaluations. Daily brief returns the AI morning sales manager briefing.

## AI Agents
```http
GET  /api/ai-agents
POST /api/ai-agents
POST /api/ai-agents/:id/activate
POST /api/ai-agents/:id/deactivate
```

Agent modes: `copilot`, `assisted`, `autonomous`. Activation requires escalation rules and validates tools against the registry. All changes are audited.

## AI Approvals
```http
GET   /api/ai-approvals
PATCH /api/ai-approvals/:id
POST  /api/ai-approvals/:id/execute
```

Review pending AI actions. PATCH accepts `approved` or `rejected` with optional reason. Execute runs the approved action with idempotency (409 on duplicate). Cross-tenant access returns 403. Status gates enforce lifecycle: `pending → approved → executed` or `pending → rejected/expired`.

## AI Policy
```http
GET   /api/ai-policies
PATCH /api/ai-policies
```

Tenant AI mode, allowed tools, approval-required tools, and daily budget. Only `owner` and `admin` roles may update.

## Handoffs
```http
POST /api/handoffs/:id/resolve
```

Resolves an open tenant handoff for authorized personnel.

## Lead Scoring Rules
```http
GET  /api/scoring-rules
POST /api/scoring-rules
```

Tenant-scoped rules with field, operator, value, points, reason, and priority.

## Knowledge Documents
```http
GET  /api/knowledge-documents
POST /api/knowledge-documents
```

Tenant-scoped document metadata. Upload, extraction, chunking, and embedding are async.

## Omnichannel
```http
GET  /api/channels
GET  /api/conversations
GET  /api/messages
POST /api/channels
POST /api/conversations
POST /api/messages
```

Tenant-scoped. Messages use `(tenant_id, external_id)` idempotency.

## Audit Logs
`GET /api/audit-logs` — Tenant-scoped audit trail with secret redaction.

## Workspace Data Export
`GET /api/workspace/export` — GDPR Article 20 full workspace data portability archive (JSON). Requires `owner` or `admin` role.

## Superadmin
```http
GET    /api/superadmin/tenants
POST   /api/superadmin/tenants
PATCH  /api/superadmin/tenants/:id
DELETE /api/superadmin/tenants/:id
POST   /api/superadmin/switch-tenant
POST   /api/superadmin/switch-back
GET    /api/superadmin/stats
GET    /api/superadmin/telemetry
GET    /api/superadmin/dlq
POST   /api/superadmin/dlq/:id/replay
GET    /api/superadmin/audit-logs
```

Platform-wide tenant directory, provisioning, cascade purge, cross-tenant impersonation switching and switch-back, runtime telemetry, Dead-Letter Queue inspection and replay, and global audit logging. Requires `superadmin` role. Mutating endpoints include CSRF and cross-origin guards. Rate limited to 60 req/min.

## Billing
```http
POST /api/billing/create-checkout
GET  /api/billing/portal
```

Stripe checkout session creation and billing portal redirect.

## SSE Events
`GET /api/events/stream` — Server-Sent Events for real-time tenant-scoped updates. Requires authentication via session cookie or `?token=` query parameter. Tenant-isolated.

## Unsubscribe
`GET /api/unsubscribe?email=...&token=...` — CAN-SPAM/RFC 8058 one-click unsubscribe with HMAC token verification.

## Errors
```json
{"error":"Human-readable message"}
```

Status codes: `200` success, `201` created, `400` validation, `401` unauthenticated, `403` forbidden, `404` missing, `409` conflict, `413` payload too large, `429` rate limited, `500` server error, `503` unavailable.

## Security Headers
All responses include: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy`, `Permissions-Policy`.

## Enterprise Parity Endpoints (Salesforce / Zoho Parity)

### Blueprints & State Machine Gates
```http
GET  /api/blueprints
POST /api/blueprints
```
Manage and enforce stage transition validation rules (`from_stage`, `to_stage`, `required_fields`, `min_amount`). Evaluated on `PATCH /api/opportunities/:id`.

### Collaborative Forecasting & Opportunity Splits
```http
GET  /api/forecasts/summary
GET  /api/forecasts/quotas
POST /api/forecasts/adjust
PUT  /api/opportunities/:id/splits
```
Rolls up Closed Won, Commit, Best Case, and Pipeline categories with manager overrides and strict 100% sum multi-owner opportunity split allocations.

### Advanced CPQ, Volume Slabs & Subscription Amendments (CLM)
```http
POST /api/quotes/volume-price
POST /api/quotes/validate-bundle
POST /api/quotes/amend
```
Calculates tiered slab volume discounts, validates product bundle dependencies and conflict exclusions, and prorates mid-term co-terming contract amendments.

### Field-Level Security (FLS) & Enterprise SSO / SCIM
```http
GET  /api/settings/fls
PUT  /api/settings/fls
GET  /api/settings/sso
PUT  /api/settings/sso
POST /api/auth/saml/callback
GET  /scim/v2/Users
POST /scim/v2/Users
```
Enforces role-based masking (`••••••••`) and read-only field restrictions across CRM objects. Configures SAML 2.0 Identity Providers, JIT provisioning, and standard RFC 7643/7644 SCIM 2.0 user directory synchronization.

### WebRTC Softphone Dialer & Telephony CTI
```http
POST  /api/telephony/dial
PATCH /api/telephony/call-state
POST  /api/telephony/call-end
```
Manages active softphone sessions and automatically commits completed call duration and notes into customer timeline activities.

### Data Deduplication & 3-Column Record Merge
```http
GET  /api/leads/duplicates
POST /api/leads/merge
GET  /api/contacts/duplicates
POST /api/contacts/merge
```
Runs Levenshtein string similarity matching and performs atomic 3-column field survivor merge, consolidating timeline activities and archiving merged records.

### AI Co-Founder & Social Selling Engine (Alippo Parity)
```http
GET  /api/webhooks/meta-lead-gen
POST /api/webhooks/meta-lead-gen
GET  /api/ai/cofounder/ops-digest
POST /api/ai/pitch-studio/generate
GET  /api/products/:id/flyer-data
```
- `GET /api/webhooks/meta-lead-gen`: Standard Meta Lead Ads webhook challenge verification handshake (`hub.mode` & `hub.verify_token`).
- `POST /api/webhooks/meta-lead-gen`: Cryptographic HMAC-SHA256 authenticated inbound lead capture from Facebook & Instagram ad forms.
- `GET /api/ai/cofounder/ops-digest`: Autonomous executive digest aggregating overnight actions (leads qualified, deals guarded, quotes staged) and top 3 daily founder priorities.
- `POST /api/ai/pitch-studio/generate`: 1-click generation of personalized WhatsApp pitches (Nepglish/Nepali/English) and social ad creatives with platform-targeted hooks and hashtags.
- `GET /api/products/:id/flyer-data`: Generates commercial product proposal specifications with exact 13% Nepal VAT calculations, instant QR codes, and pre-formatted WhatsApp share text.

### Deep Local Integrations & Observability (Phases 1–3)
```http
GET  /metrics
GET  /api/calendar/dual-date
POST /api/webhooks/fonepay
POST /api/webhooks/esewa
```
- `GET /metrics`: High-throughput Prometheus metrics scrape endpoint exposing request counts, P95/P99 latency histograms, active SSE clients, and memory gauges.
- `GET /api/calendar/dual-date`: Converts any Gregorian (AD) date to Bikram Sambat (BS) with month names, dual formatted strings, and Nepal fiscal year (`FY YYYY/YY`).
- `POST /api/webhooks/fonepay`: Inbound Fonepay payment verification webhook; reconciles matching quotes to `Paid` and advances linked opportunities to `Closed Won`.
- `POST /api/webhooks/esewa`: Inbound eSewa mobile wallet payment verification webhook; clears quotes and marks deals `Closed Won`.

