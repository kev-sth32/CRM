/**
 * Granular Field-Level Security (FLS) Service
 * Implements Salesforce & Zoho Field-Level Access Control (Read-Write, Read-Only, Hidden)
 */

// In-memory FLS rules partitioned by tenant: Map<tenantId, Array<{entity, field, role, permission}>>
const tenantFlsRules = new Map();

const DEFAULT_FLS_RULES = [
  // Hide commission and cost fields from regular salespeople
  { entity: 'lead', field: 'annual_revenue', role: 'salesperson', permission: 'read_only' },
  { entity: 'deal', field: 'margin_percentage', role: 'salesperson', permission: 'hidden' },
  { entity: 'deal', field: 'commission_amount', role: 'salesperson', permission: 'hidden' },
  { entity: 'contact', field: 'social_security_num', role: 'salesperson', permission: 'hidden' },
  { entity: 'contact', field: 'social_security_num', role: 'manager', permission: 'read_only' }
];

function getTenantFlsRules(tenantId) {
  if (!tenantFlsRules.has(tenantId)) {
    tenantFlsRules.set(tenantId, JSON.parse(JSON.stringify(DEFAULT_FLS_RULES)));
  }
  return tenantFlsRules.get(tenantId);
}

function setFlsRule(tenantId, rule) {
  const current = getTenantFlsRules(tenantId);
  const idx = current.findIndex(r => 
    r.entity.toLowerCase() === rule.entity.toLowerCase() &&
    r.field.toLowerCase() === rule.field.toLowerCase() &&
    r.role.toLowerCase() === rule.role.toLowerCase()
  );

  const entry = {
    id: rule.id || `fls-${Date.now()}`,
    entity: rule.entity.toLowerCase(),
    field: rule.field.toLowerCase(),
    role: rule.role.toLowerCase(),
    permission: ['read_write', 'read_only', 'hidden'].includes(rule.permission) ? rule.permission : 'read_write',
    updated_at: new Date().toISOString()
  };

  if (idx >= 0) {
    current[idx] = entry;
  } else {
    current.push(entry);
  }
  tenantFlsRules.set(tenantId, current);
  return entry;
}

/**
 * Filters fields on a single record or array of records based on user's role.
 * Strips 'hidden' fields completely.
 */
function filterRecordByFls(tenantId, entityName, record, role) {
  if (!record || typeof record !== 'object') return record;
  if (role === 'owner' || role === 'superadmin' || role === 'admin') {
    // Admins and owners bypass FLS restrictions by default
    return record;
  }

  const rules = getTenantFlsRules(tenantId);
  const hiddenFields = rules
    .filter(r => r.entity === entityName.toLowerCase() && r.role === role.toLowerCase() && r.permission === 'hidden')
    .map(r => r.field);

  if (hiddenFields.length === 0) return record;

  if (Array.isArray(record)) {
    return record.map(item => filterSingleRecord(item, hiddenFields));
  }
  return filterSingleRecord(record, hiddenFields);
}

function filterSingleRecord(item, hiddenFields) {
  if (!item || typeof item !== 'object') return item;
  const clone = { ...item };
  for (const field of hiddenFields) {
    delete clone[field];
  }
  return clone;
}

/**
 * Validates updates against FLS rules.
 * Rejects if user attempts to modify a 'read_only' or 'hidden' field.
 */
function validateFlsUpdate(tenantId, entityName, updates, role) {
  if (role === 'owner' || role === 'superadmin' || role === 'admin') {
    return { valid: true };
  }

  const rules = getTenantFlsRules(tenantId);
  const restrictedFields = rules.filter(r => 
    r.entity === entityName.toLowerCase() && 
    r.role === role.toLowerCase() && 
    (r.permission === 'read_only' || r.permission === 'hidden')
  );

  const errors = [];
  for (const rule of restrictedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, rule.field)) {
      errors.push(`Permission Denied: Field '${rule.field}' is configured as '${rule.permission}' for role '${role}'.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  getTenantFlsRules,
  setFlsRule,
  filterRecordByFls,
  validateFlsUpdate
};
