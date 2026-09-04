# SalesOS AI Runtime Activation & Architecture

## Overview
The SalesOS AI Runtime (`ai-runtime.js` & `app-runtime.js`) coordinates tenant-scoped retrieval, prompt grounding, provider generation, citation validation, and telemetry persistence.

## Runtime Pipeline

```
[Inbound Agent Request]
           │
           ▼
┌─────────────────────────────────┐
│ Dynamic Policy Guard            │ (ai-service.js: checks tenant policy & budget)
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Cognitive AppSec Barrier        │ (server.js: prompt injection & jailbreak screen)
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Tenant Knowledge Retrieval      │ (retrieval.js: pgvector cosine similarity search)
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Grounded Request Builder        │ (grounded-response.js: constructs cited prompt)
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Provider Adapter Dispatch       │ (providers/openai-compatible.js)
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Citation & Hallucination Guard  │ (response-validator.js: strictly fails closed)
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Tool Interceptor / Gate         │ (protected-tool.js: copilot vs autonomous)
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Telemetry & Audit Persistence   │ (ai_runs record: latency, token spend, citations)
└─────────────────────────────────┘
```

## Runtime Composition (`app-runtime.js`)
`app-runtime.js` initializes the AI runtime service using dependency injection:
- PostgreSQL connection pool.
- Registered AI tools (`search_customer`, `create_lead`, `schedule_task`, `draft_email`, etc.).
- Active embedding provider (`embedding-provider.js`).
- Knowledge vector store (`vector-store.js`).

## Activation Checklist & Prerequisites

### 1. Environment Configuration
```env
AI_PROVIDER=openai-compatible
AI_API_KEY=sk-prod-your-api-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

### 2. Infrastructure Activation Sequence
1. Deploy PostgreSQL 15+ with the `pgvector` extension enabled.
2. Execute database migrations (`npm run db:migrate`) up through `015_ai_approvals.sql`.
3. Ingest and approve tenant knowledge documents (`/api/knowledge-documents`).
4. Set tenant AI policy (`POST /api/ai/policy`) to `copilot` mode.
5. Verify approval worker heartbeat (`approval-worker.js`).
6. Run evaluation benchmark (`npm run test:all`) to verify groundedness and anti-injection defenses.

## Fail-Closed Guarantees
- If vector search returns no cited sources for a factual inquiry, the runtime responds with an explicit boundary message rather than generating unverified content.
- If the provider returns uncited or hallucinated assertions, `response-validator.js` rejects the completion and records a validation failure in `ai_runs`.
- If an agent attempts to call a tool outside the tenant's `allowed_tools` list, execution is blocked immediately.
