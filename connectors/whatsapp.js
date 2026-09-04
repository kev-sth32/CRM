/**
 * Meta WhatsApp Cloud API Connector Adapter
 * Conforms to connectors/README.md interface
 * Implements PRD Sections 4, 38
 */

const crypto = require('crypto');
const { normalize } = require('../webhook');

class WhatsAppConnector {
  constructor(config = {}) {
    this.verifyToken = config.verifyToken || process.env.WHATSAPP_VERIFY_TOKEN || 'salesos-whatsapp-verify';
    this.appSecret = config.appSecret || process.env.WHATSAPP_APP_SECRET || '';
    this.phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = config.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || '';
  }

  getCapabilities() {
    return {
      inbound: true,
      outbound: true,
      media: true,
      templates: true,
      status_receipts: true
    };
  }

  /**
   * Meta Webhook Verification Handshake (GET /api/webhooks/whatsapp)
   */
  verifyWebhookHandshake(queryParams) {
    const mode = queryParams['hub.mode'];
    const token = queryParams['hub.verify_token'];
    const challenge = queryParams['hub.challenge'];

    if (mode === 'subscribe' && token === this.verifyToken) {
      return { verified: true, challenge };
    }
    return { verified: false, error: 'Invalid verify token or mode' };
  }

  /**
   * Cryptographically verify Meta X-Hub-Signature-256 header
   */
  verifySignature(rawBody, signatureHeader) {
    if (!this.appSecret) return true; // development mode bypass if secret not configured
    if (!signatureHeader) return false;

    const [algo, hash] = signatureHeader.split('=');
    if (algo !== 'sha256' || !hash) return false;

    const expectedHash = crypto.createHmac('sha256', this.appSecret).update(rawBody).digest('hex');
    const hashBuf = Buffer.from(hash, 'utf8');
    const expBuf = Buffer.from(expectedHash, 'utf8');

    if (hashBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, expBuf);
  }

  /**
   * Normalizes Meta WhatsApp Cloud webhook payload into unified SalesOS connector event
   */
  receiveEvent(payload) {
    if (!payload || payload.object !== 'whatsapp_business_account') {
      return null;
    }

    const entry = (payload.entry || [])[0];
    if (!entry) return null;
    const change = (entry.changes || [])[0];
    if (!change || change.field !== 'messages') return null;

    const value = change.value || {};
    const messages = value.messages || [];
    const statuses = value.statuses || [];

    // Handle delivery status update
    if (statuses.length > 0) {
      const status = statuses[0];
      return {
        channel: 'whatsapp',
        type: 'message.status',
        external_id: status.id,
        status: status.status, // sent, delivered, read, failed
        recipient_id: status.recipient_id,
        occurred_at: new Date(Number(status.timestamp) * 1000).toISOString()
      };
    }

    // Handle inbound customer message
    if (messages.length > 0) {
      const msg = messages[0];
      const contact = (value.contacts || [])[0] || {};
      const senderPhone = msg.from;
      const senderName = contact.profile ? contact.profile.name : senderPhone;

      let textContent = '';
      if (msg.type === 'text' && msg.text) {
        textContent = msg.text.body;
      } else if (msg.type === 'button' && msg.button) {
        textContent = msg.button.text;
      } else if (msg.type === 'interactive' && msg.interactive) {
        const interactive = msg.interactive;
        textContent = interactive.button_reply ? interactive.button_reply.title :
                      (interactive.list_reply ? interactive.list_reply.title : '');
      } else if (msg.type === 'image') {
        textContent = '[Image received] ' + (msg.image?.caption || '');
      } else if (msg.type === 'document') {
        textContent = '[Document received] ' + (msg.document?.filename || '');
      }

      return normalize('whatsapp', {
        external_id: msg.id,
        sender: {
          id: senderPhone,
          name: senderName,
          phone: senderPhone
        },
        text: textContent,
        occurred_at: new Date(Number(msg.timestamp) * 1000).toISOString(),
        metadata: {
          session_id: `wa-${String(senderPhone).replace(/[^0-9a-zA-Z]/g, '')}`,
          whatsapp_message_id: msg.id,
          phone_number_id: value.metadata?.phone_number_id
        }
      });
    }

    return null;
  }

  /**
   * Formats outbound message into Meta Cloud API payload
   */
  formatOutbound(toPhone, textMessage) {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone.replace(/[^0-9]/g, ''),
      type: 'text',
      text: {
        preview_url: false,
        body: textMessage
      }
    };
  }
}

module.exports = WhatsAppConnector;
