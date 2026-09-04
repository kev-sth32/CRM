# SalesOS SaaS Documentation

## Product overview
SalesOS is an AI-native omnichannel CRM and autonomous sales machine for retail, wholesale, SaaS, education, hospitality, real estate, automotive, insurance, healthcare, travel, agencies, manufacturing, and B2B/B2C businesses.

The product loop is:

```text
Capture -> Understand -> Qualify -> Engage -> Follow up -> Recommend
-> Convert -> Retain -> Analyze -> Improve
```

## Users and roles
- **Super Admin:** platform and tenant administration, telemetry, cross-tenant switching.
- **Business Owner:** workspace, billing, policies, reports, approvals.
- **Admin:** configuration and operational management.
- **Sales Manager:** assignment, pipeline, coaching, forecasting.
- **Salesperson:** leads, conversations, activities, deals.
- **Marketing:** campaigns, sources, segments, attribution.
- **Support:** conversations and customer service.
- **Finance:** products, pricing, quotes, payments.
- **AI Agent:** controlled, auditable agent actions.

## Workspace setup
A new business is configured through a 12-Step Configuration Wizard:
1. Business information
2. Industry/template (6 verticals: SaaS, Real Estate, Education, Healthcare, Automotive, Hospitality)
3. Products and services
4. Pricing and tax (multi-currency, inclusive/exclusive tax modes)
5. Pipeline and stages
6. Channels
7. AI persona and languages
8. Knowledge base
9. Qualification rules
10. AI permissions
11. Data import
12. Agent activation

Industry templates are configuration presets that apply pipeline stages, custom fields, products, currency, and AI persona — not separate applications.

## Core modules

### Dashboard
Revenue, active pipeline, leads, conversion rate, forecast, AI daily brief, priority queue, risks, activities. KPI metric cards with trend delta pills. AI copilot quick-action recommendations.

### Inbox
One timeline across website chat, email, WhatsApp, SMS, telephony, forms, and calls. Three-panel layout: conversation sidebar, chat area, contact panel. Every message links to contact, company, lead, opportunity, source, channel, assignee, and AI context.

### CRM
Contacts and companies provide the 360-degree profile. Leads contain source, score, qualification, SLA status, owner, intent, budget, timeline, interests, sentiment, and next action. Opportunities displayed as Kanban board with pipeline stages, amounts, probability, age, velocity, risk, and expected close date.

### Quotes & CPQ
Line-item quote builder with subtotal, discount, tax (inclusive/exclusive), and total. Multi-currency support (USD, EUR, NPR). Public customer proposal view with digital E-Signature acceptance. ESIGN Act/UETA/eIDAS compliant non-repudiation audit trail. Automated deal advancement to "Closed Won" on signature. 48-character high-entropy access tokens for public URLs.

### Products
Flexible goods/services catalog with SKU, price, cost, tax, stock, variants, packages, discounts, availability, features, and service duration/deliverables.

### Tasks and activities
Calls, meetings, tasks, notes, messages, emails, and follow-ups. AI may create activities only through permissioned tools. SLA tracking with auto-escalation for breached response times.

### Campaigns
UTM/source tracking, forms, landing pages, QR codes, audiences, leads, revenue, ROI, and channel conversion.

### Automations
Triggers include lead creation, score changes, replies, stage changes, quote creation, payment, inactivity, overdue tasks, and forms. Actions include send, assign, update, task creation, notification, sequence, opportunity, and quote generation.

### Reports & Analytics
Revenue metrics, pipeline analytics, conversion rates, AI performance, lead scoring distribution. CSV export with formula injection defense. GDPR Article 20 workspace data portability export.

### Settings
Per-tenant workspace settings with partitioning. No-Code Custom Fields (lead, contact, company, opportunity, product, task, quote). Outbound Webhook registration with HMAC key generation, delivery audit, and DLQ replay. Billing portal with Stripe integration.

### Superadmin
Platform-wide telemetry dashboard. Tenant directory with creation, updates, and status management. Cross-tenant switching. Global SSE event monitoring.

## AI capabilities
- Lead extraction, deduplication, qualification, scoring, explanation.
- Conversation summary, intent, sentiment, requirements, objections, budget, timeline, competitors, action items.
- Product recommendation grounded in approved catalog.
- Copilot drafting and rewriting.
- Autonomous qualification and follow-up within policy.
- Next-best action and best-time recommendation.
- Deal risk, probability, forecast, churn, upsell, cross-sell.
- Natural-language CRM search and safe action planning.
- Daily sales manager brief and sales coaching.
- Proposal and quotation drafting with configurable approval.
- Conversation quality review and evaluation with closed-loop feedback injection.
- Prompt injection defense and adversarial jailbreak neutralization.

### Agent modes
- **Copilot:** suggestions only.
- **Assisted:** drafts and approved actions.
- **Autonomous:** approved actions without per-message approval.
- **Human handoff:** immediate transfer under rules.

### Grounding and guardrails
The agent uses tenant-approved knowledge, catalog, pricing, inventory, and policy tools. It does not invent prices, stock, policies, discounts, availability, customer data, or promises. Low confidence, complaints, legal issues, sensitive requests, human requests, and unauthorized negotiations escalate.

## Omnichannel connectors
- **Website Chat** (`connectors/webchat.js`): Session-based with page metadata and dynamic tenant resolution.
- **WhatsApp** (`connectors/whatsapp.js`): Meta Cloud API with webhook verification and message ingestion.
- **SMS** (`connectors/sms.js`): Provider-neutral with opt-out keyword enforcement (STOP/UNSUBSCRIBE/QUIT).
- **Telephony** (`connectors/telephony.js`): Call recording with AI Call Intelligence transcript analysis.

## Data and privacy
Tenant-owned records are isolated by `tenant_id`. Sessions are HTTP-only SameSite=Lax. Passwords are scrypt hashed. All mutations are audited with secret redaction. GDPR Article 17 Right to Erasure with legal certificate. GDPR Article 20 data portability export. CAN-SPAM/RFC 8058 one-click unsubscribe with HMAC enforcement.

## API conventions
Base path: `/api`

See `API.md` for the complete endpoint reference. All API requests require authenticated sessions except public endpoints (health, login, register, password reset, public quotes, unsubscribe, webhooks).

Use JSON, parameterized queries, validation, pagination, idempotency for external events, and consistent errors:

```json
{"error":"Human-readable message"}
```

## PostgreSQL setup
1. Install dependencies: `npm install`.
2. Set `DATABASE_URL` using `.env.example`.
3. Run `npm run db:migrate` (22 migrations).
4. Start with `npm start`.
5. Verify `/api/health` reports `postgresql`.

Migrations are in `db/` (001–022). JSON storage is development fallback only.

## Operations
Use background workers for ingestion, AI, follow-ups, imports, notifications, embeddings, and analytics. Webhook dispatch uses exponential backoff retry with Dead-Letter Queue quarantine. Monitor API latency, database health, queue depth, AI latency/cost, tool failures, handoff rate, SLA compliance, message delivery, and webhook failures.

## Testing strategy
19 automated test suites cover CRM CRUD, tenant isolation, permissions, security (52 checks), enterprise CPQ/E-Sign, AI grounding, tool-call schemas, escalation, automation retries, quote approvals, audit logging, connectors, PRD completion, and specialist fixes. Run with `npm run test:all`.

## Delivery roadmap

### Phase 1 Foundation — Complete
Dashboard, Node API, JSON fallback, PostgreSQL migrations (001–022), CRM entities, authentication, RBAC, audit logging, 21 UI templates, Stripe billing, self-serve registration, superadmin control plane.

### Phase 2 Omnichannel — Core complete
Channels, conversations, messages APIs, message idempotency, Website Chat, WhatsApp Cloud API, SMS, Telephony connectors, unified inbox UI, webhook retry/DLQ. Remaining: outbound delivery workers, contact merge, real-time updates.

### Phase 3 Copilot — Foundation complete; activation blocked
Provider abstraction, AI tools, scoring, knowledge retrieval, grounding, citation validation, approvals, copilot suggestions, daily briefing, quality reviews, prompt injection defense. Blocked: live provider/vector credentials, runtime wiring, document extraction.

### Phase 4 Sales Agent — Foundation complete
Agent configuration, modes, handoffs, follow-up sequences, product recommendations, evaluation trends. Remaining: qualification orchestrator, calendar connector, confidence routing.

### Phase 5 Automation
Visual workflows, sequences, conditions, retries, frequency controls.

### Phase 6 Intelligence
Forecasting, deal risk, churn, upsell, coaching, daily manager.

### Phase 7 Ecosystem
Public API, webhooks, connectors, imports, templates, advanced analytics, developer tools.

## Definition of done
A feature is complete only when its UI, API, persistence, permissions, error/loading/empty states, tests, audit behavior, tenant isolation, and documentation work end-to-end. Placeholders must be explicitly labeled and never presented as live AI or integrations.
