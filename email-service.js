const crypto = require('crypto');

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('CRITICAL CONFIGURATION ERROR: UNSUBSCRIBE_SECRET is required in production.'); })() : 'unsub_sec_default_salesos_99');

function generateUnsubscribeToken(leadId, email) {
  return crypto.createHmac('sha256', UNSUBSCRIBE_SECRET).update(`${leadId || 'general'}:${(email || '').toLowerCase().trim()}`).digest('hex');
}

function getValidatedFromAddress(from) {
  const defaultSender = process.env.EMAIL_FROM || 'SalesOS Dispatch <notifications@salesos.io>';
  if (!from) return defaultSender;
  if (process.env.NODE_ENV === 'test') return from;

  // Validate sender domain against configured domain (anti-spoofing / anti-relay)
  const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || 'salesos.io').toLowerCase();
  const emailMatch = from.match(/<([^>]+)>/) || [null, from.trim()];
  const emailAddr = (emailMatch[1] || '').toLowerCase().trim();
  if (emailAddr.endsWith(`@${allowedDomain}`)) {
    return from;
  }
  return defaultSender;
}

/**
 * Enterprise Outbound Email Service
 * Supports Resend API (RESEND_API_KEY) and safe Sandbox Outbox mode for testing.
 * Automatically injects CAN-SPAM compliance footers and RFC 8058 List-Unsubscribe headers.
 */
async function sendEmail({ to, subject, html, text, from, tenantId, leadId, metadata = {} }) {
  const fromAddress = getValidatedFromAddress(from);
  const primaryRecipient = Array.isArray(to) ? to[0] : to;

  // CAN-SPAM & RFC 8058 One-Click Unsubscribe Generation
  const host = process.env.BASE_URL || 'http://localhost:3000';
  let unsubUrl = null;
  let headers = {};

  if (leadId && primaryRecipient) {
    const token = generateUnsubscribeToken(leadId, primaryRecipient);
    unsubUrl = `${host}/api/unsubscribe?lead_id=${encodeURIComponent(leadId)}&token=${token}`;
    headers['List-Unsubscribe'] = `<${unsubUrl}>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  const unsubFooterHtml = unsubUrl ? `
    <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.5;">
      You received this message from SalesOS Workspace.<br>
      To opt out of future communications, <a href="${unsubUrl}" style="color: #0284c7; text-decoration: underline;">click here to unsubscribe</a>.
    </div>
  ` : '';

  const finalHtml = html ? `${html}${unsubFooterHtml}` : `<p style="font-family:sans-serif;line-height:1.6">${(text || '').replace(/\n/g, '<br>')}</p>${unsubFooterHtml}`;

  const emailRecord = {
    id: `email-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    tenant_id: tenantId || null,
    lead_id: leadId || null,
    to,
    from: fromAddress,
    subject,
    body: text || finalHtml || '',
    status: 'queued',
    provider: 'sandbox',
    metadata: { ...metadata, unsubscribe_url: unsubUrl },
    created_at: new Date().toISOString()
  };

  // 1. Resend API Integration
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: Array.isArray(to) ? to : [to],
          subject,
          html: finalHtml,
          text,
          headers
        })
      });

      const resData = await response.json();
      if (response.ok) {
        emailRecord.status = 'delivered';
        emailRecord.provider = 'resend';
        emailRecord.external_id = resData.id;
        emailRecord.delivered_at = new Date().toISOString();
        return { success: true, id: emailRecord.id, provider: 'resend', messageId: resData.id };
      } else {
        console.error('Resend delivery error:', resData);
        emailRecord.status = 'failed';
        emailRecord.error = resData.message || 'Resend delivery failed';
        return { success: false, error: emailRecord.error, id: emailRecord.id };
      }
    } catch (err) {
      console.error('Resend network error:', err.message);
      emailRecord.status = 'failed';
      emailRecord.error = err.message;
      return { success: false, error: err.message, id: emailRecord.id };
    }
  }

  // 2. Safe Sandbox Outbox Mode (Default for local & testing without live keys)
  emailRecord.status = 'delivered_sandbox';
  emailRecord.provider = 'sandbox';
  emailRecord.delivered_at = new Date().toISOString();

  return {
    success: true,
    id: emailRecord.id,
    mode: 'sandbox',
    delivered_to: to,
    subject,
    note: 'Delivered to SalesOS Sandbox Outbox (Configure RESEND_API_KEY for live external dispatch)'
  };
}

module.exports = {
  sendEmail,
  generateUnsubscribeToken
};
