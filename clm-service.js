/**
 * Contract Lifecycle Management (CLM) & Advanced CPQ Engine
 * Implements Salesforce Revenue Cloud Volume Slabs, Bundling Rules, and Subscription Amendments
 */

// In-memory contracts and bundling rules per tenant
const tenantContracts = new Map();
const tenantBundlingRules = new Map();

/**
 * Standard Volume Pricing Tiers
 */
const DEFAULT_VOLUME_TIERS = [
  { min_qty: 1, max_qty: 10, discount_percent: 0 },
  { min_qty: 11, max_qty: 50, discount_percent: 10 },
  { min_qty: 51, max_qty: 100, discount_percent: 20 },
  { min_qty: 101, max_qty: Infinity, discount_percent: 30 }
];

/**
 * Calculates tiered / slab pricing for line items based on volume brackets.
 */
function applyVolumePricing(unitPrice, quantity, customTiers = null) {
  const tiers = customTiers || DEFAULT_VOLUME_TIERS;
  const qty = Number(quantity) || 1;
  const price = Number(unitPrice) || 0;

  const matchedTier = tiers.find(t => qty >= t.min_qty && qty <= t.max_qty) || { discount_percent: 0 };
  const discountMultiplier = (100 - matchedTier.discount_percent) / 100;
  const effectiveUnitPrice = Math.round(price * discountMultiplier * 100) / 100;
  const total = Math.round(effectiveUnitPrice * qty * 100) / 100;
  const totalSavings = Math.round((price * qty - total) * 100) / 100;

  return {
    quantity: qty,
    base_unit_price: price,
    discount_percent: matchedTier.discount_percent,
    effective_unit_price: effectiveUnitPrice,
    total,
    total_savings: totalSavings
  };
}

/**
 * Product Bundling Rules Validation
 */
const DEFAULT_BUNDLING_RULES = [
  {
    product_sku: 'SALESOS-ENT',
    requires_any: ['SALESOS-ONBOARDING-VIP', 'SALESOS-ONBOARDING-STD'],
    excludes: ['SALESOS-STARTER'],
    message: 'Enterprise Core requires an onboarding package and cannot be combined with Starter.'
  },
  {
    product_sku: 'SALESOS-AI-ADDON',
    requires_any: ['SALESOS-ENT', 'SALESOS-PRO'],
    excludes: [],
    message: 'Autonomous AI Add-on requires a Professional or Enterprise base subscription.'
  }
];

function validateProductBundle(tenantId, selectedSkus = []) {
  const rules = tenantBundlingRules.get(tenantId) || DEFAULT_BUNDLING_RULES;
  const errors = [];
  const selectedSet = new Set(selectedSkus.map(s => String(s).toUpperCase()));

  for (const rule of rules) {
    if (selectedSet.has(rule.product_sku.toUpperCase())) {
      // Check prerequisites (requires at least one)
      if (rule.requires_any && rule.requires_any.length > 0) {
        const hasPrerequisite = rule.requires_any.some(req => selectedSet.has(req.toUpperCase()));
        if (!hasPrerequisite) {
          errors.push(`Bundle Error: '${rule.product_sku}' requires at least one of [${rule.requires_any.join(', ')}].`);
        }
      }
      // Check exclusion conflicts
      if (rule.excludes && rule.excludes.length > 0) {
        for (const excluded of rule.excludes) {
          if (selectedSet.has(excluded.toUpperCase())) {
            errors.push(`Bundle Conflict: '${rule.product_sku}' cannot be bundled with '${excluded}'.`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Subscription Amendment & Co-Terming Proration
 * Calculates prorated cost for adding units mid-contract
 */
function calculateSubscriptionAmendment(contract, additionalItems = []) {
  const startDate = new Date(contract.start_date || Date.now());
  const endDate = new Date(contract.end_date || (Date.now() + 365 * 24 * 60 * 60 * 1000));
  const today = new Date();

  // Calculate total contract days and remaining days
  const totalDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(0, Math.round((endDate - today) / (1000 * 60 * 60 * 24)));
  const prorationFactor = Math.min(1, Math.max(0, remainingDays / totalDays));

  let totalProratedAmount = 0;
  const amendedItems = additionalItems.map(item => {
    const annualAmount = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    const proratedAmount = Math.round(annualAmount * prorationFactor * 100) / 100;
    totalProratedAmount += proratedAmount;
    return {
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      annual_amount: annualAmount,
      prorated_amount: proratedAmount
    };
  });

  return {
    contract_id: contract.id,
    contract_term_days: totalDays,
    remaining_days: remainingDays,
    proration_factor: Math.round(prorationFactor * 1000) / 1000,
    amended_items: amendedItems,
    total_amendment_due: Math.round(totalProratedAmount * 100) / 100,
    co_termed_end_date: endDate.toISOString()
  };
}

module.exports = {
  applyVolumePricing,
  validateProductBundle,
  calculateSubscriptionAmendment,
  DEFAULT_VOLUME_TIERS,
  DEFAULT_BUNDLING_RULES
};
