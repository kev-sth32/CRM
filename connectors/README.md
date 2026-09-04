# Connector Adapter Template

A provider adapter must be isolated from CRM domain logic.

## Adapter responsibilities
- Store provider credentials in a secret manager.
- Verify raw webhook signatures.
- Resolve configured tenant and channel.
- Normalize provider events using `../webhook.js`.
- Return idempotent event envelopes.
- Implement outbound send and delivery status mapping.
- Never expose provider secrets to the browser or logs.

## Adapter interface
```js
class Connector {
  async connect(config) {}
  async verifyWebhook(rawBody, headers, config) {}
  async receiveEvent(rawBody, headers, config) {}
  async sendMessage(message, config) {}
  getCapabilities() { return { inbound: true, outbound: true }; }
  async healthCheck(config) {}
}
```

## Implementation order
1. Website chat (internal, easiest control).
2. Email inbound/outbound.
3. WhatsApp Cloud API.
4. SMS provider.
5. Messenger and Instagram.
6. Telephony and call events.

Do not mark an adapter live until signature tests, retry tests, delivery tests, opt-out tests, and end-to-end tenant persistence pass.
