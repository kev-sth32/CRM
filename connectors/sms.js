/**
 * SMS Omnichannel Connector Adapter
 * Conforms to connectors/README.md interface
 * Implements PRD Sections 4, 38
 */

const { normalize } = require('../webhook');

class SmsConnector {
  constructor(config = {}) {
    this.provider = config.provider || 'generic_sms';
    this.accountSid = config.accountSid || process.env.SMS_ACCOUNT_SID || '';
    this.authToken = config.authToken || process.env.SMS_AUTH_TOKEN || '';
    this.fromNumber = config.fromNumber || process.env.SMS_FROM_NUMBER || '';
  }

  getCapabilities() {
    return {
      inbound: true,
      outbound: true,
      opt_out_enforcement: true
    };
  }

  /**
   * Checks if message is an explicit opt-out command
   */
  isOptOutMessage(text = '') {
    const cleaned = text.trim().toUpperCase();
    return ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(cleaned);
  }

  /**
   * Normalizes inbound SMS webhook payload
   */
  receiveEvent(body = {}) {
    const from = body.From || body.from || body.sender;
    const text = body.Body || body.body || body.message || body.text || '';
    const messageId = body.MessageSid || body.message_id || body.id || `sms-${Date.now()}`;

    if (!from || !text) return null;

    return normalize('sms', {
      external_id: messageId,
      sender: {
        id: from,
        phone: from,
        name: from
      },
      text: text,
      occurred_at: new Date().toISOString(),
      metadata: {
        session_id: `sms-${String(from).replace(/[^0-9a-zA-Z]/g, '')}`,
        is_opt_out: this.isOptOutMessage(text),
        carrier: body.Carrier || null,
        provider: this.provider
      }
    });
  }

  /**
   * Formats outbound SMS payload
   */
  formatOutbound(toPhone, messageText) {
    return {
      to: toPhone,
      from: this.fromNumber,
      body: messageText
    };
  }
}

module.exports = SmsConnector;
