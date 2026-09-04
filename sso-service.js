/**
 * Enterprise SSO & SCIM 2.0 Provisioning Service
 * Implements SAML 2.0 / OIDC Authentication and SCIM Protocol for Okta/Azure AD
 */

const crypto = require('crypto');

// Tenant SSO configs: Map<tenantId, { enabled, idp_entry_point, idp_entity_id, idp_cert, scim_token }>
const tenantSsoConfigs = new Map();

function getTenantSsoConfig(tenantId) {
  if (!tenantSsoConfigs.has(tenantId)) {
    tenantSsoConfigs.set(tenantId, {
      enabled: false,
      provider: 'saml_generic', // okta, azure_ad, google
      idp_entry_point: 'https://login.okta.com/app/salesos/sso/saml',
      idp_entity_id: 'http://www.okta.com/exk1234567890',
      idp_cert: '-----BEGIN CERTIFICATE-----\nMIIDpDCCAoygAwIBAgIGAX...\n-----END CERTIFICATE-----',
      scim_token: crypto.randomBytes(32).toString('hex'),
      sp_entity_id: `https://app.salesos.io/saml/metadata/${tenantId}`,
      sp_acs_url: `https://app.salesos.io/api/auth/saml/callback/${tenantId}`,
      updated_at: new Date().toISOString()
    });
  }
  return tenantSsoConfigs.get(tenantId);
}

function updateTenantSsoConfig(tenantId, config) {
  const current = getTenantSsoConfig(tenantId);
  const updated = {
    ...current,
    ...config,
    updated_at: new Date().toISOString()
  };
  tenantSsoConfigs.set(tenantId, updated);
  return updated;
}

/**
 * Validates a SCIM Bearer Token against tenant configuration
 */
function verifyScrimToken(tenantId, authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.replace('Bearer ', '').trim();
  const config = getTenantSsoConfig(tenantId);
  return config.enabled && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(config.scim_token));
}

/**
 * Formats an internal user object into SCIM 2.0 User Resource format
 */
function toScimUser(user) {
  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    id: user.id,
    userName: user.email,
    name: {
      formatted: user.name,
      familyName: user.name.split(' ').slice(1).join(' ') || '',
      givenName: user.name.split(' ')[0] || user.name
    },
    displayName: user.name,
    emails: [
      {
        value: user.email,
        primary: true,
        type: 'work'
      }
    ],
    active: user.is_active !== false,
    roles: [{ value: user.role || 'salesperson' }],
    meta: {
      resourceType: 'User',
      created: user.created_at || new Date().toISOString(),
      location: `/scim/v2/Users/${user.id}`
    }
  };
}

module.exports = {
  getTenantSsoConfig,
  updateTenantSsoConfig,
  verifyScrimToken,
  toScimUser
};
