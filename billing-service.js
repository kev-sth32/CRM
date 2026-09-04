const crypto = require('crypto');

const PLANS = {
  starter: {
    key: 'starter',
    name: 'Starter SaaS',
    price_usd: 29,
    interval: 'month',
    seats: 2,
    ai_ops: 500,
    features: ['Up to 2 seats', '1,000 leads', '500 AI actions/mo', 'Basic Reporting']
  },
  growth: {
    key: 'growth',
    name: 'Growth SaaS',
    price_usd: 79,
    interval: 'month',
    seats: 5,
    ai_ops: 2000,
    features: ['Up to 5 seats', '10,000 leads', '2,000 AI actions/mo', 'Kanban Deals & CPQ Quotes', 'Zapier Webhooks']
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise SaaS',
    price_usd: 199,
    interval: 'month',
    seats: 50,
    ai_ops: 10000,
    features: ['Unlimited seats', 'Unlimited leads', '10,000 AI actions/mo', 'Autonomous AI Orchestration', 'Dedicated SLA & E-Sign']
  }
};

/**
 * Creates a Stripe Checkout session (Live or Test Sandbox)
 */
async function createCheckoutSession({ tenantId, planKey, successUrl, cancelUrl, customerEmail }) {
  const plan = PLANS[planKey] || PLANS.growth;

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const params = new URLSearchParams();
      params.append('payment_method_types[0]', 'card');
      params.append('mode', 'subscription');
      params.append('line_items[0][price_data][currency]', 'usd');
      params.append('line_items[0][price_data][product_data][name]', `SalesOS - ${plan.name}`);
      params.append('line_items[0][price_data][unit_amount]', (plan.price_usd * 100).toString());
      params.append('line_items[0][price_data][recurring][interval]', plan.interval);
      params.append('line_items[0][quantity]', '1');
      params.append('success_url', successUrl || 'https://salesos.io/settings.html?billing=success');
      params.append('cancel_url', cancelUrl || 'https://salesos.io/settings.html?billing=cancel');
      params.append('client_reference_id', tenantId);
      if (customerEmail) params.append('customer_email', customerEmail);
      params.append('metadata[tenant_id]', tenantId);
      params.append('metadata[plan_key]', plan.key);

      const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      const data = await resp.json();
      if (resp.ok) {
        return { success: true, url: data.url, sessionId: data.id };
      }
      return { success: false, error: data.error?.message || 'Failed to create Stripe session' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Sandbox Mode (When STRIPE_SECRET_KEY is not set)
  const mockSessionId = `cs_test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  return {
    success: true,
    mode: 'sandbox',
    sessionId: mockSessionId,
    url: `/settings.html?billing_simulated=true&plan=${plan.key}&session_id=${mockSessionId}`,
    plan
  };
}

/**
 * Creates a Stripe Customer Portal link
 */
async function createPortalSession({ tenantId, customerId, returnUrl }) {
  if (process.env.STRIPE_SECRET_KEY && customerId) {
    try {
      const params = new URLSearchParams();
      params.append('customer', customerId);
      params.append('return_url', returnUrl || 'https://salesos.io/settings.html');

      const resp = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      const data = await resp.json();
      if (resp.ok) return { success: true, url: data.url };
      return { success: false, error: data.error?.message };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  return {
    success: true,
    mode: 'sandbox',
    url: `/settings.html?portal_simulated=true&tenant_id=${tenantId}`
  };
}

/**
 * Verifies Stripe Webhook Signature with Replay Defense (300s Tolerance)
 */
function verifyStripeSignature(rawPayload, signatureHeader, secret, toleranceSec = 300) {
  if (!secret || !signatureHeader) return false;
  try {
    const parts = signatureHeader.split(',').reduce((acc, item) => {
      const [k, v] = item.split('=');
      acc[k.trim()] = v ? v.trim() : '';
      return acc;
    }, {});

    const t = parts['t'];
    const v1 = parts['v1'];
    if (!t || !v1) return false;

    // Enforce timestamp freshness to prevent replay attacks (RFC 8032 / Stripe spec)
    if (toleranceSec > 0) {
      const timestampSec = parseInt(t, 10);
      const nowSec = Math.floor(Date.now() / 1000);
      if (isNaN(timestampSec) || Math.abs(nowSec - timestampSec) > toleranceSec) {
        return false;
      }
    }

    const signedPayload = `${t}.${rawPayload}`;
    const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'));
  } catch (e) {
    return false;
  }
}

module.exports = {
  PLANS,
  createCheckoutSession,
  createPortalSession,
  verifyStripeSignature
};
