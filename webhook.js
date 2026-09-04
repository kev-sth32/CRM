const crypto = require('crypto');

function verifySignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(signature.replace(/^sha256=/, ''));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function externalId(event) {
  return String(event.external_id || event.id || '');
}

function normalize(channel, event) {
  return {
    external_id: externalId(event),
    channel,
    sender: event.sender || {},
    recipient: event.recipient || {},
    text: event.text || event.body || '',
    occurred_at: event.occurred_at || new Date().toISOString(),
    attachments: event.attachments || [],
    metadata: event.metadata || {}
  };
}

/**
 * Robust Outbound Webhook Dispatcher with Exponential Backoff Retries & DLQ support
 */
async function dispatchWithRetry(webhook, eventName, payload, options = {}) {
  const maxRetries = options.maxRetries !== undefined ? options.maxRetries : 3;
  const initialDelayMs = options.initialDelayMs || 400;
  const timeoutMs = options.timeoutMs || 5000;

  const timestamp = new Date().toISOString();
  const bodyStr = JSON.stringify({
    event: eventName,
    tenant_id: webhook.tenant_id,
    timestamp,
    data: payload
  });

  const signature = crypto.createHmac('sha256', webhook.secret || 'whsec_default').update(bodyStr).digest('hex');

  let attempt = 0;
  let lastError = null;
  let lastStatus = null;
  const startTime = Date.now();

  while (attempt < maxRetries) {
    attempt++;
    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-salesos-event': eventName,
          'x-salesos-signature': signature,
          'x-salesos-timestamp': timestamp,
          'x-salesos-attempt': String(attempt)
        },
        body: bodyStr,
        signal: AbortSignal.timeout(timeoutMs)
      });

      lastStatus = res.status;

      if (res.ok) {
        return {
          success: true,
          attempts: attempt,
          status: res.status,
          response_time_ms: Date.now() - startTime,
          delivered_at: new Date().toISOString()
        };
      }

      lastError = `HTTP ${res.status}: ${res.statusText || 'Delivery Rejected'}`;
    } catch (err) {
      lastError = err.name === 'TimeoutError' ? 'Webhook delivery timed out' : err.message;
    }

    if (attempt < maxRetries) {
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // Quarantined into Dead-Letter Queue (DLQ)
  return {
    success: false,
    attempts: attempt,
    status: lastStatus || 500,
    error: lastError,
    dlq: true,
    response_time_ms: Date.now() - startTime,
    failed_at: new Date().toISOString()
  };
}

module.exports = { verifySignature, normalize, dispatchWithRetry };
