const { canSendFollowup } = require('./followup-policy');

function prepareFollowup(ctx = {}) {
  const check = canSendFollowup(ctx);
  if (!check.allowed) {
    return { ready: false, reason: check.reason };
  }

  const channel = ctx.channel || 'email';

  if (channel === 'whatsapp') {
    if (!ctx.phone) {
      return { ready: false, reason: 'missing_phone_number' };
    }
    const cleanPhone = String(ctx.phone).replace(/[^0-9+]/g, '');
    return {
      ready: true,
      channel: 'whatsapp',
      recipient: cleanPhone,
      template: ctx.template || 'consultative_followup',
      payload: {
        text: ctx.message || 'Namaste! Just following up regarding your earlier inquiry.',
        phone: cleanPhone
      }
    };
  }

  if (channel === 'sms') {
    if (!ctx.phone) return { ready: false, reason: 'missing_phone_number' };
    return {
      ready: true,
      channel: 'sms',
      recipient: String(ctx.phone).replace(/[^0-9+]/g, ''),
      payload: { body: ctx.message || 'SalesOS follow-up: Reply STOP to opt out.' }
    };
  }

  return {
    ready: true,
    channel: 'email',
    recipient: ctx.email,
    payload: {
      subject: ctx.subject || 'Following up on your sales inquiry',
      body: ctx.message || 'Hello, wanted to check in regarding your project requirements.'
    }
  };
}

module.exports = { prepareFollowup };
