# SalesOS Operations Runbook

## Start locally
```bash
npm install
npm start
```

Without `DATABASE_URL`, the API uses `data.json` development fallback. Never use fallback storage for production. The server starts on port 3000 by default (`PORT` environment variable).

Default login: `arjun@acmecloud.com` / `secret`

## Run all tests
```bash
npm run test:all
```

Runs 19 test suites covering smoke, end-to-end, tenant isolation, enterprise features, security (52 checks), AI agents, scoring, retrieval, connectors, PRD completion, and specialist fixes. Server must be running.

## PostgreSQL activation
```bash
export DATABASE_URL=postgresql://user:password@host:5432/salesos
export PGSSL=require
npm run db:migrate
npm start
curl http://localhost:3000/api/health
```

The health response must report `postgresql`. Migrations are idempotent (001–022).

## Health checks
- HTTP: `GET /api/health` — returns service status, database mode, and security configuration.
- Database: connection pool errors and migration status.
- Queue: backlog, failed jobs, dead letters.
- Connectors: webhook failures and delivery latency.
- AI: latency, cost, tool errors, escalation rate.
- SLA: `GET /api/leads/sla-status` — compliance rate, breached leads, pending deadlines.

## Environment variables
```env
PORT=3000                           # Server port
DATABASE_URL=postgresql://...       # PostgreSQL connection
PGSSL=require                       # SSL mode for PostgreSQL
AI_PROVIDER=openai-compatible       # AI provider adapter
AI_API_KEY=secret                   # AI provider API key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
STRIPE_SECRET_KEY=sk_test_...       # Stripe billing
STRIPE_PRICE_ID=price_...           # Stripe price ID
WEBCHAT_TOKEN=...                   # Website chat webhook token
NODE_ENV=production                 # Production mode (enables Secure cookies)
```

## SRE & Graceful Shutdown
The server registers handlers for `SIGTERM`, `SIGINT`, `uncaughtException`, and `unhandledRejection`. On shutdown signal, it drains active connections and closes cleanly. Unhandled exceptions are logged and the process exits with code 1.

## Backups
Use managed PostgreSQL point-in-time recovery. Test restoration regularly into an isolated database. Back up object storage and connector configuration separately. Do not include secrets in backups without encryption.

## Common incidents

### Database unavailable
Stop writes if necessary, inspect pool and provider status, preserve queued work, and never switch production to JSON fallback silently.

### Connector outage
Disable retries that can duplicate messages, use idempotency keys, notify affected users, and replay verified events after recovery.

### AI quality degradation
Switch affected agent to Copilot mode, review recent evaluations/tool calls, roll back prompt or knowledge version, and require human approval.

### Queue backlog
Inspect worker errors and provider throttling, scale workers within rate limits, and monitor dead-letter volume.

### SLA breach alerts
Monitor `lead.sla_breached` SSE events. Auto-escalation creates high-priority manager tasks. Review via `/api/leads/sla-status`.

### Webhook delivery failures
Check `GET /api/settings/webhooks/deliveries` for DLQ entries. Replay individual deliveries with `POST /api/settings/webhooks/deliveries/:id/retry`. Webhook retry uses exponential backoff (3 attempts).

## Deployment checklist
1. Run `npm run test:all` and verify all 19 suites pass.
2. Run PostgreSQL migrations (`npm run db:migrate`).
3. Configure environment variables.
4. Verify `GET /api/health` reports `postgresql`.
5. Run security scans and dependency audits.
6. Enable TLS and set `NODE_ENV=production`.
7. Deploy with process supervisor (PM2, systemd, or container).
8. Verify rollback capability.
