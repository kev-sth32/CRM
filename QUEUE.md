# SalesOS Async Job & Queue Architecture

## Purpose & Scope
To ensure low-latency user interactions and high API responsiveness, compute-heavy and I/O-bound workflows execute asynchronously via durable background queues.

These tasks include:
- Inbound connector event ingestion & deduplication.
- AI classification, sentiment scoring, and intent analysis.
- Knowledge base text chunking & embedding generation.
- Outbound webhook notifications and retries.
- Scheduled follow-up sequences and SLA escalation checks.

## Queue Envelope & Event Schema

```json
{
  "id": "job_e91b10a2-4a4b",
  "tenant_id": "tenant_acme",
  "type": "message.classify",
  "payload": {
    "conversation_id": "conv_891",
    "message_id": "msg_412",
    "text": "Can you provide volume pricing for 500 seats?"
  },
  "attempt": 1,
  "max_attempts": 5,
  "status": "pending",
  "available_at": "2026-09-04T12:00:00.000Z",
  "trace_id": "trace-77c8e9"
}
```

## Durable Worker & Lease Architecture (`worker.js` & `processor.js`)

1. **Transactional Leases (`FOR UPDATE SKIP LOCKED`):**
   Workers acquire pending jobs using row-level locking semantics to prevent race conditions across multi-instance clusters:
   ```sql
   UPDATE connector_events
   SET status = 'processing',
       worker_id = $1,
       processing_started_at = NOW(),
       attempt = attempt + 1
   WHERE id IN (
     SELECT id FROM connector_events
     WHERE status = 'pending' AND available_at <= NOW()
     ORDER BY available_at ASC
     LIMIT $2
     FOR UPDATE SKIP LOCKED
   )
   RETURNING *;
   ```
2. **Stale Lease Recovery:**
   If a worker process crashes, jobs held in `processing` state for longer than 10 minutes are automatically reclaimed and reset to `pending`.
3. **Exponential Backoff & Jitter:**
   Transient provider failures recalculate `available_at` using:
   $$\text{delay} = \min(600, 2^{\text{attempt}} \times 5) \pm \text{jitter}$$
4. **Dead-Letter Queue (DLQ):**
   Jobs that exceed 5 attempts are automatically transitioned to `dead_letter`. Operators can inspect payloads and error logs via the Admin Console (`/superadmin.html`) or API and trigger one-click replays.

## Queue Health & Telemetry Metrics
- **Queue Depth:** Total items in `pending` status.
- **Processing Lag:** Time delta between `available_at` and `processing_started_at`.
- **Failure / DLQ Rate:** Ratio of `failed` + `dead_letter` to total processed items.
- **Worker Concurrency:** Active worker IDs reporting heartbeats.

## Automated Testing
- `test-enterprise.js` — Validates high-concurrency event processing, lease contention, and graceful worker shutdown.
- `phase4-utils.test.js` — Tests backoff calculations and dead-letter queue transitions.
