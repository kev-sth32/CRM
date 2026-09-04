# SalesOS Omnichannel Engine & Event Pipeline

## Architecture Overview
SalesOS normalizes communications from heterogeneous third-party channels (WebChat, WhatsApp, Twilio SMS, Voice/Telephony, Email) into uniform, tenant-isolated message streams.

```
       [WebChat Widget]     [WhatsApp Cloud]     [Twilio SMS]     [Voice / SIP]     [Email / SMTP]
              │                    │                   │                │                  │
              ▼                    ▼                   ▼                ▼                  ▼
       ┌───────────────────────────────────────────────────────────────────────────────────┐
       │                       Channel Connector Adapters (/connectors)                    │
       │                 - Signature verification & replay detection                       │
       │                 - Payload normalization to Universal Message Event                │
       └─────────────────────────────────────────┬─────────────────────────────────────────┘
                                                 │
                                                 ▼
       ┌───────────────────────────────────────────────────────────────────────────────────┐
       │                       Ingestion Engine & Deduplication                            │
       │                 - Idempotency key: SHA256(tenant_id + provider_msg_id)            │
       │                 - Contact resolution (phone, email, external thread)              │
       └─────────────────────────────────────────┬─────────────────────────────────────────┘
                                                 │
                                                 ▼
       ┌───────────────────────────────────────────────────────────────────────────────────┐
       │                 Tenant Message Store & Omnichannel Inbox (/inbox.html)             │
       │                 - Real-time SLA tracking (sla-service.js)                         │
       │                 - AI Copilot intent & suggestion pipeline                         │
       │                 - Human takeover & handoff service (handoff-service.js)           │
       └───────────────────────────────────────────────────────────────────────────────────┘
```

## Universal Message Event Contract

All connectors transform provider payloads into this canonical schema before touching the database:

```json
{
  "id": "evt-uuid",
  "external_id": "wamid.HBgL...",
  "tenant_id": "tenant_123",
  "channel": "whatsapp",
  "direction": "inbound",
  "sender": {
    "identifier": "+15551234567",
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "recipient": {
    "identifier": "+15559876543",
    "name": "SalesOS Inbound"
  },
  "content": {
    "type": "text",
    "text": "Hi, I would like to inquire about the enterprise plan.",
    "attachments": []
  },
  "occurred_at": "2026-09-04T12:00:00.000Z",
  "raw_metadata": {}
}
```

## Contact & Conversation Resolution
1. **Resolution Hierarchy:**
   - Provider thread ID match.
   - Exact verified E.164 phone number match.
   - Exact email address match.
   - New Lead/Contact creation if no existing identifier matches.
2. **Never Merge On Display Name:** Display names are easily spoofed or non-unique. Records are merged strictly on cryptographic or verified contact coordinates.

## Outbound Delivery & Reliability
1. **Pre-flight Policy Gate:**
   - Verifies tenant subscription limits.
   - Verifies contact consent / opt-out status (compliance with TCPA / GDPR / CAN-SPAM).
   - Validates communication window (e.g. 8 AM - 8 PM local time).
2. **Retry & Dead-Letter Queue:**
   - 429/5xx provider errors trigger exponential backoff (1s, 2s, 4s, 8s, 16s).
   - Permanent 4xx failures route to `webhook_dlq` for operator inspection.
3. **Delivery Audit:**
   - Sent, Delivered, and Read receipts update message state in real-time.

## Automated Testing
- `test-e2e.js` — Full omnichannel flow test from inbound webhook to conversation timeline.
- `test-enterprise.js` — High-load message ingestion and concurrent thread deduplication.
- `connectors/*.test.js` — Connector unit tests for signature and parsing logic.
