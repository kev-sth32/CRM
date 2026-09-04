# Phase 2 Omnichannel Acceptance Checklist

## Verified Complete in Codebase
- [x] Multi-tenant channel, conversation, and message schema (`004_messages_conversations.sql`).
- [x] Channel configuration API with tenant scoping.
- [x] Conversation and message REST APIs (`/api/conversations`, `/api/conversations/:id/messages`).
- [x] External message idempotency constraint via `(tenant_id, external_id)` and SHA256 deduplication.
- [x] Normalized Universal Message Event contract.
- [x] Constant-time HMAC-SHA256 webhook signature verification (`crypto.timingSafeEqual`).
- [x] Public webhook ingestion router (`/api/webhooks/:channel`) with tenant dynamic resolution.
- [x] Durable connector event queue (`connector_events`) with worker lease locks (`FOR UPDATE SKIP LOCKED`).
- [x] Website Chat connector & normalizer (`connectors/webchat.js`).
- [x] WhatsApp Cloud API connector & message ingestion (`connectors/whatsapp.js`).
- [x] SMS connector with TCPA/CTIA opt-out keyword detection (`STOP`, `UNSUBSCRIBE`, `QUIT`) (`connectors/sms.js`).
- [x] Telephony/Voice connector with AI Call Intelligence transcript analysis (`connectors/telephony.js`).
- [x] Outbound webhook retry engine with exponential backoff and Dead-Letter Queue (DLQ).
- [x] Autonomous Lead & Conversation SLA engine (`sla-service.js`) with hot/warm tiers and breach escalation.
- [x] Human handoff takeover service (`handoff-service.js`).
- [x] Unified omnichannel inbox interface (`/inbox.html`) with 3-panel layout, SLA indicators, and copilot panel.
- [x] Automated test coverage: `connectors/*.test.js`, `test-e2e.js`, `test-enterprise.js`.

## Operational Prerequisites for Live External Deployment
- [ ] Configure live Meta WhatsApp Business API Cloud tokens and webhook URL.
- [ ] Configure live Twilio / SMS provider credentials.
- [ ] Configure live SIP/Telephony provider webhook.
- [ ] Connect production Redis cluster (if migrating off PostgreSQL `FOR UPDATE SKIP LOCKED` worker queue).

## Production Gate
Every omnichannel connector includes a mock/verification suite. Third-party channels fail closed when secrets are missing and never leak raw webhook payloads or credentials to clients.
