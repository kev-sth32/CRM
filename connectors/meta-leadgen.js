// Meta (Facebook & Instagram) Lead Ads Webhook Connector
// Normalizes inbound ad leads into standard SalesOS CRM Lead objects

const crypto = require('crypto');

class MetaLeadGenConnector {
  constructor(appSecret = process.env.META_APP_SECRET || 'meta_app_secret_demo_key') {
    this.appSecret = appSecret;
  }

  verifySignature(payloadBuffer, signatureHeader) {
    if (!signatureHeader) return false;
    const parts = signatureHeader.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') return false;
    
    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(payloadBuffer)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(parts[1], 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (_) {
      return false;
    }
  }

  normalizeLeadPayload(rawPayload, tenantId = 'tenant-1') {
    // Meta webhook schema delivers entry[].changes[].value
    const entry = (rawPayload.entry && rawPayload.entry[0]) || {};
    const change = (entry.changes && entry.changes[0]) || {};
    const value = change.value || rawPayload;

    const formFields = value.field_data || [];
    const fieldMap = {};

    formFields.forEach(f => {
      const key = (f.name || '').toLowerCase();
      const val = (f.values && f.values[0]) || '';
      fieldMap[key] = val;
    });

    const fullName = fieldMap['full_name'] || fieldMap['name'] || value.full_name || value.lead_name || 'Facebook/Instagram Inbound Lead';
    const email = fieldMap['email'] || value.email || '';
    const phone = fieldMap['phone_number'] || fieldMap['phone'] || value.phone_number || value.phone || '';
    const company = fieldMap['company_name'] || fieldMap['company'] || value.company_name || 'Meta Ad Inquiry';
    const city = fieldMap['city'] || fieldMap['location'] || 'Nepal';
    const adId = value.ad_id || entry.id || 'ad_meta_campaign';
    const formId = value.form_id || 'form_lead_gen';

    let leadSource = 'facebook_lead_ads';
    if (value.platform === 'instagram') {
      leadSource = 'instagram_lead_ads';
    } else if (value.source) {
      leadSource = value.source;
    }

    return {
      id: `lead-meta-${Date.now()}`,
      tenant_id: tenantId,
      name: fullName,
      email: email,
      phone: phone,
      company: company,
      city: city,
      source: leadSource,
      source_meta: {
        ad_id: adId,
        form_id: formId,
        platform: value.platform || 'instagram',
        created_time: value.created_time || new Date().toISOString()
      },
      stage: 'New lead',
      score: 82, // Qualified inbound intent
      owner_name: rawPayload.owner_name || 'Unassigned',
      notes: `Automated inbound lead via Meta Lead Ads form (${formId}). Ad ID: ${adId}.`,
      created_at: new Date().toISOString()
    };
  }
}

module.exports = new MetaLeadGenConnector();
