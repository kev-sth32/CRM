# SalesOS Connector Guide

## Design
Connectors translate provider events into normalized platform objects. The CRM core must never depend on a provider-specific payload.

## Connector contract
```text
connect(config)
verifyWebhook(request)
receiveEvent(event)
sendMessage(message)
getCapabilities()
healthCheck()
```

## Normalized inbound event
```json
{"external_id":"provider-event-id","channel":"email","sender":{},"recipient":{},"text":"...","occurred_at":"...","attachments":[]}
```

## Implemented connectors

### Website Chat (`connectors/webchat.js`)
Normalizes website chat payloads containing `session_id` and `message`. Preserves session and page metadata and derives an idempotent external event ID. Unit test: `connectors/webchat.test.js`.

### WhatsApp (`connectors/whatsapp.js`)
Meta WhatsApp Cloud API connector. Implements webhook verification handshake, inbound message normalization, and outbound message sending. Supports text, image, and document message types. Requires `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_VERIFY_TOKEN` configuration.

### SMS (`connectors/sms.js`)
Provider-neutral SMS connector. Implements opt-out keyword enforcement (STOP, UNSUBSCRIBE, QUIT, CANCEL, END). Normalizes inbound SMS events with sender phone number, message body, and timestamps. Respects frequency limits and working hours.

### Telephony (`connectors/telephony.js`)
Telephony connector with AI Call Intelligence. Normalizes call events including caller ID, duration, recording URL, and transcript. AI transcript analysis extracts intent, sentiment, action items, and key topics from call recordings.

### Meta Lead Ads (`connectors/meta-leadgen.js`)
Dedicated connector for Facebook & Instagram Lead Ads webhooks. Features HMAC-SHA256 signature verification (`x-hub-signature-256`), challenge verification handshake (`hub.mode` & `hub.verify_token`), and field data normalization into standard SalesOS CRM Lead records with platform attribution and Nepal contact enrichment. Test suite: `test-alippo-inspired.js`.

## Requirements
- Verify signatures.
- Reject replayed events.
- Use external IDs for idempotency.
- Normalize timestamps to UTC.
- Store provider IDs and delivery status.
- Retry transient failures with backoff.
- Respect opt-outs, working hours, frequency limits, and channel rules.
- Redact secrets from logs.

## Channel security
Inbound connector tokens should be stored as hashes in `channels.inbound_token_hash`. Resolve the channel and tenant by hashing the presented token; never trust a tenant ID from a public webhook payload. Dynamic tenant resolution implemented for webchat webhook endpoint.

## Shared webhook utilities
`webhook.js` provides HMAC-SHA256 signature verification, a provider-neutral event normalizer, and an outbound dispatch engine with exponential backoff retry and Dead-Letter Queue (DLQ). Provider adapters must still implement their own signature header extraction, secret lookup, replay protection, and tenant/channel resolution.

## Testing
- `connectors/webchat.test.js` — Website chat normalization.
- `test-prd-completion.js` — WhatsApp Cloud API handshake, SMS opt-out enforcement, Telephony AI Call Intelligence.
- `test-security.js` — Inbound webchat webhook dynamic tenant resolution and message tagging.
- Test signature verification, duplicate events, malformed payloads, attachment handling, rate limits, provider outage, retry behavior, opt-out propagation, and contact matching.
