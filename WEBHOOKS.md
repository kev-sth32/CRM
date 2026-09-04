# Webhook Ingestion & Dispatch Contract

## Inbound Webhook Endpoint
```text
POST /api/webhooks/:channel
```

Provider-specific adapters must verify signatures before calling the normalized ingestion service. The route must resolve tenant from the connector configuration, not from a client-provided tenant ID.

## Required adapter steps
1. Read raw request bytes.
2. Verify provider signature and timestamp.
3. Reject replayed events.
4. Normalize sender, thread, body, external ID, and occurrence time.
5. Resolve tenant and channel.
6. Match or create a contact using verified identifiers.
7. Find or create a conversation.
8. Insert message using `(tenant_id, external_id)` idempotency.
9. Return success only after durable persistence.
10. Enqueue AI classification and notifications asynchronously.

## Outbound Webhook Dispatch
Outbound webhooks are registered per-tenant via `POST /api/settings/webhooks` and dispatched by the webhook retry engine (`webhook.js`).

### Dispatch behavior
- Each registered webhook receives an auto-generated HMAC-SHA256 secret key.
- Dispatches include headers: `x-salesos-event`, `x-salesos-signature`, `x-salesos-timestamp`, `x-salesos-attempt`.
- Retry engine uses exponential backoff: 3 attempts with `400ms * 2^(attempt-1)` delay.
- `AbortSignal.timeout(5000)` enforces a 5-second delivery timeout.
- Persistently failed dispatches are quarantined into the Dead-Letter Queue (DLQ).

### Delivery audit
- `GET /api/settings/webhooks/deliveries` — Lists tenant-scoped deliveries with status (`delivered` or `dlq`), latency, attempt count, and HTTP status code.
- `POST /api/settings/webhooks/deliveries/:id/retry` — Manual replay of failed/quarantined deliveries.

### Webhook management
- `GET /api/settings/webhooks` — List tenant webhooks (secrets masked).
- `POST /api/settings/webhooks` — Register a new webhook with auto-generated HMAC key.
- `DELETE /api/settings/webhooks/:id` — Delete a webhook (tenant-scoped, BOLA-protected).

## Failure behavior
- `400`: malformed payload.
- `401`: invalid signature.
- `409`: duplicate event when provider requires explicit conflict handling.
- `429`: provider/platform rate limit.
- `500`: temporary persistence failure; provider may retry.

## Security
- Never log raw authorization headers, connector secrets, or unredacted sensitive message content.
- Webhook secrets are masked in API responses (only last 4 characters shown).
- Cross-tenant webhook deletion is blocked with 403 Forbidden.
- Stripe webhook anti-replay defense enforces 300-second timestamp drift tolerance.
