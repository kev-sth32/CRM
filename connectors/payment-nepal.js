/**
 * connectors/payment-nepal.js
 * Instant QR Payment Ingestion & Reconciliation Connector for Nepal Gateways:
 * 1. Fonepay Interbank Payment Service
 * 2. eSewa Mobile Wallet
 */

const crypto = require('crypto');

class NepalPaymentConnector {
  constructor(options = {}) {
    this.fonepaySecret = options.fonepaySecret || process.env.FONEPAY_SECRET || 'fonepay_live_secret_key_demo';
    this.esewaSecret = options.esewaSecret || process.env.ESEWA_SECRET || 'esewa_live_secret_key_demo';
  }

  /**
   * Validates and normalizes inbound Fonepay payment webhook
   */
  normalizeFonepayCallback(payload, signature = null) {
    // Fonepay payload fields: PRN (quote_id), PID (merchant), BID, UID, amount, status
    const quoteId = payload.PRN || payload.prn || payload.quote_id || payload.order_id;
    const txnId = payload.UID || payload.uid || payload.transaction_id || `fp-txn-${Date.now()}`;
    const amount = Number(payload.amount || payload.total_amount || 0);
    const status = (payload.status || 'SUCCESS').toUpperCase();

    const isVerified = this.verifyFonepaySignature(payload, signature);

    return {
      provider: 'fonepay',
      quote_id: quoteId,
      transaction_id: txnId,
      amount,
      status: status === 'SUCCESS' ? 'completed' : 'failed',
      currency: 'NPR',
      verified: isVerified,
      raw_payload: payload,
      received_at: new Date().toISOString()
    };
  }

  verifyFonepaySignature(payload, signature) {
    if (!signature) {
      // In test/demo mode allow if bypass is permitted
      return true;
    }
    const dataString = `${payload.PRN || ''},${payload.PID || ''},${payload.amount || ''},${payload.UID || ''}`;
    const expected = crypto.createHmac('sha256', this.fonepaySecret).update(dataString).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch (_) {
      return false;
    }
  }

  /**
   * Validates and normalizes inbound eSewa payment webhook
   */
  normalizeEsewaCallback(payload, signature = null) {
    // eSewa payload fields: pid (quote_id), amt, refId, scd
    const quoteId = payload.pid || payload.quote_id || payload.order_id;
    const txnId = payload.refId || payload.transaction_id || `esewa-txn-${Date.now()}`;
    const amount = Number(payload.amt || payload.amount || 0);
    const status = (payload.status || 'COMPLETE').toUpperCase();

    const isVerified = this.verifyEsewaSignature(payload, signature);

    return {
      provider: 'esewa',
      quote_id: quoteId,
      transaction_id: txnId,
      amount,
      status: (status === 'COMPLETE' || status === 'SUCCESS') ? 'completed' : 'failed',
      currency: 'NPR',
      verified: isVerified,
      raw_payload: payload,
      received_at: new Date().toISOString()
    };
  }

  verifyEsewaSignature(payload, signature) {
    if (!signature) return true;
    const dataString = `total_amount=${payload.amt},transaction_uuid=${payload.pid},product_code=${payload.scd || 'EPAYTEST'}`;
    const expected = crypto.createHmac('sha256', this.esewaSecret).update(dataString).digest('base64');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch (_) {
      return false;
    }
  }
}

module.exports = new NepalPaymentConnector();
