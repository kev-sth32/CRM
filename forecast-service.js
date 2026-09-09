/**
 * Collaborative Revenue Forecasting & Opportunity Splits Engine
 * Implements Salesforce Collaborative Forecasts & Quota Management
 */

// In-memory quotas, forecast adjustments, and opportunity splits partitioned by tenant
const tenantQuotas = new Map();
const tenantSplits = new Map();
const tenantForecastAdjustments = new Map();

/**
 * Opportunity Forecast Categories
 */
const FORECAST_CATEGORIES = {
  'Closed Won': { category: 'Closed', probability: 1.0 },
  'Negotiation': { category: 'Commit', probability: 0.8 },
  'Proposal': { category: 'Best Case', probability: 0.6 },
  'Qualified': { category: 'Pipeline', probability: 0.3 },
  'Lead': { category: 'Omitted', probability: 0.1 },
  'Closed Lost': { category: 'Omitted', probability: 0.0 }
};

function getTenantQuotas(tenantId) {
  if (!tenantQuotas.has(tenantId)) {
    if (tenantId === 'tenant-1') {
      // Seed default annual/quarterly quota for demo tenant
      tenantQuotas.set(tenantId, [
        { id: 'q-1', user_id: 'usr-1', user_name: 'Arjun Sharma', period: '2026-Q3', target_amount: 150000, currency: 'USD' },
        { id: 'q-2', user_id: 'usr-2', user_name: 'Roshan Shrestha', period: '2026-Q3', target_amount: 120000, currency: 'USD' }
      ]);
    } else {
      tenantQuotas.set(tenantId, []);
    }
  }
  return tenantQuotas.get(tenantId);
}

function setQuota(tenantId, quotaData) {
  const current = getTenantQuotas(tenantId);
  const idx = current.findIndex(q => q.user_id === quotaData.user_id && q.period === quotaData.period);
  const entry = {
    id: quotaData.id || `q-${Date.now()}`,
    user_id: quotaData.user_id,
    user_name: quotaData.user_name || 'Team Member',
    period: quotaData.period || '2026-Q3',
    target_amount: Number(quotaData.target_amount) || 100000,
    currency: quotaData.currency || 'USD',
    updated_at: new Date().toISOString()
  };

  if (idx >= 0) {
    current[idx] = entry;
  } else {
    current.push(entry);
  }
  tenantQuotas.set(tenantId, current);
  return entry;
}

/**
 * Opportunity Splits: Assigns credit percentage across multiple team members.
 * Must sum to 100%.
 */
function getOpportunitySplits(tenantId, opportunityId) {
  const splits = tenantSplits.get(`${tenantId}:${opportunityId}`) || [];
  return splits;
}

function saveOpportunitySplits(tenantId, opportunityId, splitsList, totalAmount = 0) {
  if (!Array.isArray(splitsList) || splitsList.length === 0) {
    throw new Error('Splits list must contain at least one contributor');
  }

  // Verify total percentage sums to 100
  const totalPercentage = splitsList.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Total split percentage must equal 100%. Currently sums to ${totalPercentage}%.`);
  }

  const normalized = splitsList.map((s, i) => {
    const pct = Number(s.percentage) || 0;
    return {
      id: s.id || `split-${opportunityId}-${i + 1}`,
      opportunity_id: opportunityId,
      user_id: s.user_id,
      user_name: s.user_name || 'Contributor',
      role: s.role || 'Contributor',
      percentage: pct,
      split_amount: Math.round((pct / 100) * totalAmount * 100) / 100,
      updated_at: new Date().toISOString()
    };
  });

  tenantSplits.set(`${tenantId}:${opportunityId}`, normalized);
  return normalized;
}

/**
 * Record a Manager Forecast Commit Adjustment Override
 */
function recordForecastAdjustment(tenantId, period, adjustmentData, user) {
  const key = `${tenantId}:${period}`;
  const current = tenantForecastAdjustments.get(key) || [];
  const entry = {
    id: `adj-${Date.now()}`,
    period,
    manager_id: user.id,
    manager_name: user.name,
    original_commit: Number(adjustmentData.original_commit) || 0,
    adjusted_commit: Number(adjustmentData.adjusted_commit) || 0,
    reason: adjustmentData.reason || 'Manager pipeline risk override',
    created_at: new Date().toISOString()
  };
  current.push(entry);
  tenantForecastAdjustments.set(key, current);
  return entry;
}

/**
 * Aggregates collaborative forecast summary across all tenant opportunities.
 */
function calculateForecastSummary(tenantId, opportunities = [], period = '2026-Q3') {
  const quotas = getTenantQuotas(tenantId);
  const totalQuota = quotas.reduce((acc, q) => acc + (Number(q.target_amount) || 0), 0) || 200000;

  let closedAmount = 0;
  let commitAmount = 0;
  let bestCaseAmount = 0;
  let pipelineAmount = 0;
  let weightedAmount = 0;

  for (const opp of opportunities) {
    const stage = opp.stage || 'Lead';
    const amount = Number(opp.amount) || 0;
    const catInfo = FORECAST_CATEGORIES[stage] || { category: 'Pipeline', probability: 0.3 };
    const prob = opp.probability !== undefined ? Number(opp.probability) / 100 : catInfo.probability;

    weightedAmount += amount * prob;

    if (catInfo.category === 'Closed') {
      closedAmount += amount;
    } else if (catInfo.category === 'Commit') {
      commitAmount += amount;
    } else if (catInfo.category === 'Best Case') {
      bestCaseAmount += amount;
    } else if (catInfo.category === 'Pipeline') {
      pipelineAmount += amount;
    }
  }

  // Check for manager adjustments
  const adjustments = tenantForecastAdjustments.get(`${tenantId}:${period}`) || [];
  const latestAdjustment = adjustments.length ? adjustments[adjustments.length - 1] : null;
  const effectiveCommit = latestAdjustment ? latestAdjustment.adjusted_commit : (closedAmount + commitAmount);

  const coverageRatio = totalQuota > 0 ? ((closedAmount + commitAmount + bestCaseAmount + pipelineAmount) / totalQuota).toFixed(2) : '1.0';

  return {
    period,
    total_quota: totalQuota,
    closed_won: closedAmount,
    commit: commitAmount,
    best_case: bestCaseAmount,
    pipeline: pipelineAmount,
    weighted_pipeline: Math.round(weightedAmount),
    effective_commit: effectiveCommit,
    manager_override: latestAdjustment,
    coverage_ratio: Number(coverageRatio),
    quotas,
    category_breakdown: {
      closed: closedAmount,
      commit: commitAmount,
      best_case: bestCaseAmount,
      pipeline: pipelineAmount
    }
  };
}

module.exports = {
  getTenantQuotas,
  setQuota,
  getOpportunitySplits,
  saveOpportunitySplits,
  recordForecastAdjustment,
  calculateForecastSummary,
  FORECAST_CATEGORIES
};
