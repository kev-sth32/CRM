/**
 * Blueprint & State Machine Service
 * Implements Zoho Blueprint & Salesforce Flow Transition Validation Gates
 * Ensures deals cannot advance through pipeline stages unless mandatory fields,
 * checklists, and role approvals are satisfied.
 */

// In-memory blueprint transition store per tenant with enterprise defaults
const tenantBlueprints = new Map();

const DEFAULT_BLUEPRINTS = [
  {
    id: 'bp-qualified-proposal',
    from_stage: 'Qualified',
    to_stage: 'Proposal',
    required_fields: ['amount', 'contact_id'],
    checklist: [
      'BANT qualification verified',
      'Decision maker identified'
    ],
    min_role: 'salesperson'
  },
  {
    id: 'bp-proposal-negotiation',
    from_stage: 'Proposal',
    to_stage: 'Negotiation',
    required_fields: ['amount', 'expected_close_date', 'next_step'],
    checklist: [
      'Formal quote delivered to customer',
      'Technical architecture approved',
      'Budget confirmed by buyer'
    ],
    min_role: 'salesperson'
  },
  {
    id: 'bp-negotiation-won',
    from_stage: 'Negotiation',
    to_stage: 'Closed Won',
    required_fields: ['amount'],
    checklist: [
      'Customer signed proposal or contract',
      'Billing terms & tax mode finalized',
      'Finance approval logged'
    ],
    min_role: 'manager'
  }
];

function getTenantBlueprints(tenantId) {
  if (!tenantBlueprints.has(tenantId)) {
    tenantBlueprints.set(tenantId, JSON.parse(JSON.stringify(DEFAULT_BLUEPRINTS)));
  }
  return tenantBlueprints.get(tenantId);
}

function saveBlueprint(tenantId, blueprint) {
  const current = getTenantBlueprints(tenantId);
  const idx = current.findIndex(b => b.from_stage.toLowerCase() === blueprint.from_stage.toLowerCase() &&
                                     b.to_stage.toLowerCase() === blueprint.to_stage.toLowerCase());
  const entry = {
    id: blueprint.id || `bp-${Date.now()}`,
    from_stage: blueprint.from_stage,
    to_stage: blueprint.to_stage,
    required_fields: Array.isArray(blueprint.required_fields) ? blueprint.required_fields : [],
    checklist: Array.isArray(blueprint.checklist) ? blueprint.checklist : [],
    min_role: blueprint.min_role || 'salesperson',
    updated_at: new Date().toISOString()
  };

  if (idx >= 0) {
    current[idx] = entry;
  } else {
    current.push(entry);
  }
  tenantBlueprints.set(tenantId, current);
  return entry;
}

function deleteBlueprint(tenantId, blueprintId) {
  const current = getTenantBlueprints(tenantId);
  const filtered = current.filter(b => b.id !== blueprintId);
  tenantBlueprints.set(tenantId, filtered);
  return true;
}

const ROLE_HIERARCHY = {
  salesperson: 1,
  manager: 2,
  admin: 3,
  owner: 4,
  superadmin: 5
};

/**
 * Validates whether an opportunity is permitted to transition to a new stage.
 */
function validateStageTransition(tenantId, currentOpp, toStage, user, completedChecklist = [], updatedFields = {}) {
  if (!currentOpp || !toStage) {
    return { allowed: true };
  }

  const fromStage = currentOpp.stage || '';
  if (fromStage.toLowerCase() === toStage.toLowerCase()) {
    return { allowed: true };
  }

  const blueprints = getTenantBlueprints(tenantId);
  const rule = blueprints.find(b => 
    b.from_stage.toLowerCase() === fromStage.toLowerCase() &&
    b.to_stage.toLowerCase() === toStage.toLowerCase()
  );

  if (!rule) {
    // No explicit restriction configured for this transition
    return { allowed: true, rule: null };
  }

  const errors = [];
  const missingFields = [];
  const uncompletedChecklist = [];

  // 1. Role hierarchy gate
  const userRoleLevel = ROLE_HIERARCHY[user.role] || 1;
  const requiredRoleLevel = ROLE_HIERARCHY[rule.min_role] || 1;
  if (userRoleLevel < requiredRoleLevel) {
    errors.push(`Role '${user.role}' is not authorized to transition deal to '${toStage}'. Minimum required role: '${rule.min_role}'.`);
  }

  // 2. Mandatory fields gate (checked against currentOpp merged with updatedFields)
  const candidate = { ...currentOpp, ...updatedFields };
  for (const field of rule.required_fields) {
    const val = candidate[field];
    if (val === undefined || val === null || val === '' || (typeof val === 'number' && val <= 0)) {
      missingFields.push(field);
      errors.push(`Mandatory field '${field}' must be provided before entering '${toStage}'.`);
    }
  }

  // 3. Checklist gate
  const completedSet = new Set((completedChecklist || []).map(c => String(c).trim().toLowerCase()));
  for (const item of rule.checklist) {
    if (!completedSet.has(String(item).trim().toLowerCase())) {
      uncompletedChecklist.push(item);
      errors.push(`Checklist gate '${item}' must be marked complete before entering '${toStage}'.`);
    }
  }

  return {
    allowed: errors.length === 0,
    rule,
    errors,
    missing_fields: missingFields,
    uncompleted_checklist: uncompletedChecklist
  };
}

module.exports = {
  getTenantBlueprints,
  saveBlueprint,
  deleteBlueprint,
  validateStageTransition
};
