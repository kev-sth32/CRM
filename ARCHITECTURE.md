# SalesOS Architecture

## 1. System goal
SalesOS is a multi-tenant, AI-first sales operating system. The core platform captures, understands, qualifies, engages, converts, retains, and analyzes customer relationships without embedding industry-specific assumptions in the core. Industry-specific behavior is driven by configurable templates and tenant settings.

## 2. High-level topology

```text
Web App (21 HTML Templates + app.js + app.css)
        |
        v
API Gateway / HTTP API (server.js — Node.js single-process)
        |
  Auth + Session + Tenant Context (scrypt, memory sessions, cookie)
        |
+-------+--------+----------------+------------------+
| CRM   | Inbox   | Automation     | Enterprise       |
| Core  | Service | Engine          | (CPQ/E-Sign)     |
+-------+--------+----------------+------------------+
        |
+-------+---------------------------+
| AI Orchestrator / Tool Registry  |
| Scoring / SLA / Follow-up        |
+-------+---------------------------+
        |
PostgreSQL | JSON Fallback | Queue Workers | Vector Store
        |
Connectors: Email, WhatsApp, SMS, Telephony, Website Chat
        |
External: Stripe Billing, Calendar, AI Providers
```

## 3. Core architectural principles
- Tenant isolation on every tenant-owned table and query.
- API-first domain boundaries.
- AI accesses data only through permissioned tools; never direct database writes.
- Connectors implement interfaces and are replaceable by provider.
- Configuration and industry templates replace hardcoded vertical logic.
- Asynchronous jobs handle AI, ingestion, notifications, imports, and analytics.
- All mutations are auditable and soft-deletable where appropriate.
- SRE graceful shutdown with `SIGTERM`/`SIGINT` handlers and unhandled exception traps.

## 4. Services/modules

### Identity and access
Users, roles (owner/admin/manager/salesperson/superadmin), permissions, scrypt password hashing, memory sessions, cookie-based authentication, tenant context, audit events with secret redaction, self-serve registration, password reset with session invalidation.

### CRM core
Tenants, companies, contacts, leads (with qualification, scoring, SLA tracking), opportunities (Kanban pipeline), stages, products (SKU, price, tax, variants), activities, tasks, quotes (CPQ with multi-currency tax), campaigns, automations.

### Enterprise CPQ & E-Signature
Line-item quote builder with subtotal/discount/tax/total calculations. Multi-currency support (USD, EUR, NPR) with inclusive and exclusive tax modes. Public customer proposal view with digital signature acceptance. ESIGN Act/UETA/eIDAS-compliant non-repudiation audit trail (SHA-256, IP, User-Agent, certificate chain). Contract immutability enforcement (409 Conflict on re-signing). Automated deal advancement to "Closed Won" on signature.

### Conversations & Omnichannel
Channels, conversations, messages, contact matching, assignments, attachments, delivery status. Connectors: Website Chat, WhatsApp Cloud API, SMS (with opt-out enforcement), Telephony (with AI Call Intelligence). Unified inbox UI with three-panel layout (conversations sidebar, chat area, contact panel).

### AI platform
Agent registry and configuration (`copilot`/`assisted`/`autonomous` modes). Orchestration with prompt/policy configuration. Tool registry with permission enforcement and protected-tool wrapper. Knowledge base with chunking, embeddings, vector retrieval, and citation validation. Deterministic lead scoring engine. AI copilot suggestions with closed-loop evaluation feedback. Daily Sales Manager briefing engine. Conversation quality review and evaluation system. Prompt injection defense. Approval workflow with expiry worker.

### Automation & Follow-up
Triggers, conditions, branches, actions, sequences, retries, rate/frequency limits, execution logs. Follow-up sequence engine with opt-out/frequency/hours preflight. SLA engine with auto-escalation.

### Analytics & Reporting
Revenue metrics, pipeline analytics, lead conversion, forecast, AI daily brief, priority queue, risks. CSV export with formula injection defense. Workspace data portability export (GDPR Article 20).

### Billing
Stripe checkout session integration. SaaS subscription management. Billing portal.

### Superadmin
Platform-wide telemetry, tenant directory, tenant creation/update, cross-tenant switching, global SSE event monitoring.

## 5. Data model
Every tenant-owned record contains `tenant_id`, timestamps, and where relevant `deleted_at`. Key relationships:

```text
Tenant -> Users, Companies, Contacts, Leads, Opportunities, Conversations,
          Products, Campaigns, Activities, Automations, Knowledge, Audit Logs,
          Quotes, Tasks, Custom Fields, Webhooks, AI Approvals, AI Evaluations,
          Agents, Workflows, Settings, Follow-up Sequences
Lead -> Contact, Company, Conversation, Opportunity, Activities, SLA Status
Opportunity -> Contact, Company, Pipeline/Stage, Products, Quotes, Activities
Conversation -> Contact, Lead, Opportunity, Messages, Channel, Assignee
Quote -> Opportunity, Line Items, Access Token, E-Signature Bundle
```

PostgreSQL migrations live in `db/` (001–022).

## 6. AI tool safety
Tools must declare name, input schema, required permission, tenant scope, confirmation policy, and audit action. Implemented tools: `search_customer`, `get_customer_history`, `search_products`, `create_lead`, `update_lead`, `create_task`, `send_message`, `generate_quote`, `escalate_to_human`.

High-risk tools require approval: sending external messages, discounts, quotes, deletion, refunds, and policy exceptions. Tool calls log agent, user, tenant, inputs (redacted), result, confidence, and timestamp. Protected-tool wrapper enforces tenant AI policy at execution time.

## 7. Communication connector contract
Each connector implements:
- `connect(config)`
- `verifyWebhook(request)`
- `receiveEvent(event)`
- `sendMessage(message)`
- `getCapabilities()`
- `healthCheck()`

Provider payloads are normalized into platform `Conversation` and `Message` objects.

Implemented connectors:
- **Website Chat** (`connectors/webchat.js`): Session-based with page metadata.
- **WhatsApp** (`connectors/whatsapp.js`): Meta Cloud API with webhook verification.
- **SMS** (`connectors/sms.js`): Provider-neutral with opt-out keyword enforcement.
- **Telephony** (`connectors/telephony.js`): Call recording with AI transcript analysis.

## 8. Security
- HTTP-only SameSite=Lax secure sessions.
- Passwords hashed with scrypt; never plaintext.
- Parameterized SQL and input validation.
- Tenant derived from authenticated session, never trusted from body/query.
- RBAC plus record-level scope checks.
- Content-Security-Policy and Permissions-Policy headers.
- SSRF defense (cloud metadata, loopback, private subnets).
- CORS credential reflection defense.
- XSS payload escaping across all views.
- CSRF protection via SameSite cookies.
- Rate limiting (API, login, registration).
- Payload size limits (CWE-400 defense).
- Static asset sandboxing.
- Anti-IDOR with high-entropy access tokens.
- Mass assignment defense.
- Audit log secret redaction.
- Password reset Host-header poisoning defense.
- CSV formula injection defense (CWE-1236).
- Prompt injection defense and jailbreak neutralization.
- GDPR Article 17 Right to Erasure and Article 20 Data Portability.
- CAN-SPAM/RFC 8058 one-click unsubscribe with HMAC enforcement.
- ESIGN Act non-repudiation and contract immutability.
- 52-check automated security test suite.

## 9. Async processing
Use queue workers for webhook normalization, message classification, outbound delivery, knowledge ingestion, embeddings, follow-ups, notifications, imports, analytics, and SLA monitoring. Job envelopes carry tenant ID, idempotency key, attempts, availability time, and trace ID. See `QUEUE.md`.

Webhook dispatch uses exponential backoff retry (3 attempts) with Dead-Letter Queue quarantine for persistently failed deliveries. DLQ supports manual replay via API.

## 10. Deployment
Development uses the Node HTTP API with JSON fallback. Production should use managed PostgreSQL, Redis-compatible queue/cache, object storage, vector search, centralized logs, metrics, tracing, and a process supervisor/container platform.

SRE shutdown handlers capture `SIGTERM`, `SIGINT`, `uncaughtException`, and `unhandledRejection` for graceful drain.

## 11. Reliability
Use idempotency keys for inbound events and external sends, retry with backoff, dead-letter queues, provider circuit breakers, pagination, indexes, connection pooling, and background workers. AI requests must not block CRM writes.

## 12. Frontend architecture
21 HTML templates sharing a common design system:
- **`app.css`**: Enterprise design tokens, Plus Jakarta Sans + JetBrains Mono typography, glassmorphic accents, micro-interactions, WCAG 2.1 AA support, mobile touch ergonomics.
- **`app.js`**: Shared SalesOS shell with grouped navigation, `⌘K` global search, Quick Create dropdown, toast notifications, session management, and XSS-safe HTML escaping.

## 13. Current implementation status
All core CRM, enterprise CPQ/E-Sign, omnichannel, AI copilot foundation, agent framework, production security (52 checks), and UI/UX elevation are implemented and verified by 19 automated test suites. Remaining: live PostgreSQL deployment, AI/embedding/vector provider credentials, and external connector activation.
