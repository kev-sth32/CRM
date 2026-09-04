# SalesOS PostgreSQL & Database Architecture

## Overview
SalesOS uses PostgreSQL (version 15+) as its primary multi-tenant relational and vector store, backed by connection pooling and transactional isolation. In local development or standalone testing, it supports a dual-mode fallback (in-memory or file-backed storage) without requiring external services.

## Quickstart & Setup

### 1. Database Provisioning
```bash
createdb salesos
```

### 2. Environment Configuration
Create or update `.env` with connection parameters:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/salesos
PGSSL=disable
PG_POOL_MIN=2
PG_POOL_MAX=20
```

### 3. Run Migrations
```bash
npm run db:migrate
```

The migration runner in `db/migrate.js` executes versioned SQL scripts in numerical order inside atomic transactions:
- `001_initial_schema.sql` — Core entities: tenants, users, leads, companies, contacts, deals, activities.
- `002_add_sessions.sql` — Secure session tokens, expiries, and user roles.
- `003_audit_logs.sql` — Immutable tenant-scoped audit logging table.
- `004_messages_conversations.sql` — Omnichannel threads, messages, channels.
- `005_webhooks_connectors.sql` — Inbound/outbound webhook configurations.
- `006_scoring_rules.sql` — Deterministic lead scoring rules table.
- `007_connector_events.sql` — Inbound event deduplication queue.
- `008_worker_leases.sql` — Distributed queue leases (`processing`, `dead_letter`, exponential backoff).
- `009_knowledge_base.sql` — Knowledge documents and chunks.
- `010_sequences.sql` — Automated follow-up sequences and enrollments.
- `011_ai_runs.sql` — AI execution telemetry, latency, token spend, and citations.
- `012_vector_store.sql` — pgvector extension and chunk embedding columns.
- `013_daily_briefings.sql` — AI daily briefing summaries and rep action items.
- `014_ai_policies.sql` — Tenant AI governance policy, kill-switches, and tool permissions.
- `015_ai_approvals.sql` — AI copilot approval queue and state machine.

### 4. Database Health Verification
```bash
curl http://localhost:3000/api/health
```
Output reports:
```json
{
  "status": "healthy",
  "database": "postgresql",
  "pool": { "total": 5, "idle": 4, "waiting": 0 }
}
```

## Multi-Tenant Isolation
All tables contain `tenant_id VARCHAR(64) NOT NULL`. Every SQL query initiated by `server.js` or domain services explicitly includes `WHERE tenant_id = $1` or uses tenant-bound session context. 

Cross-tenant access attempts are strictly rejected and logged as security anomalies.

## Automated Verification
Run the database test suite to verify connectivity, schema integrity, and tenant isolation:
```bash
node test-postgres.js
node test-tenant-isolation.js
```
