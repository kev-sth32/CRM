/**
 * Autonomous Lead SLA Tracking & Escalation Engine (PRD §21, §22, §24)
 * Evaluates inbound lead response times against SLA policies, detects breaches,
 * and enables automated escalation tasks.
 */

const DEFAULT_SLA_POLICIES = {
  hot: { minScore: 75, maxMinutes: 15, label: 'High Intent (<15m SLA)' },
  warm: { minScore: 50, maxMinutes: 60, label: 'Medium Intent (<60m SLA)' },
  cold: { minScore: 0, maxMinutes: 240, label: 'Standard (<4h SLA)' }
};

function getLeadSlaTier(lead) {
  const score = Number(lead.score) || 0;
  if (score >= DEFAULT_SLA_POLICIES.hot.minScore) return { tier: 'hot', ...DEFAULT_SLA_POLICIES.hot };
  if (score >= DEFAULT_SLA_POLICIES.warm.minScore) return { tier: 'warm', ...DEFAULT_SLA_POLICIES.warm };
  return { tier: 'cold', ...DEFAULT_SLA_POLICIES.cold };
}

function evaluateLeadSla(lead, activities = []) {
  const tier = getLeadSlaTier(lead);
  const createdAt = new Date(lead.created_at || Date.now()).getTime();
  const now = Date.now();
  const elapsedMinutes = Math.max(0, Math.round((now - createdAt) / (60 * 1000)));

  // Check if contact has been made
  const hasContact = lead.status !== 'New' && lead.status !== 'Lead In' && lead.status !== 'Uncontacted';
  const hasContactActivity = activities.some(a => 
    (a.lead_id === lead.id || a.entity_id === lead.id) &&
    ['call', 'email', 'meeting', 'message', 'outreach'].includes((a.type || a.action || '').toLowerCase())
  );

  const isContacted = Boolean(hasContact || hasContactActivity);
  const isBreached = !isContacted && elapsedMinutes > tier.maxMinutes;
  const remainingMinutes = Math.max(0, tier.maxMinutes - elapsedMinutes);

  return {
    lead_id: lead.id,
    lead_name: lead.name || lead.title || 'Untitled Lead',
    company: lead.company || '',
    score: Number(lead.score) || 0,
    tier: tier.tier,
    tier_label: tier.label,
    sla_minutes: tier.maxMinutes,
    elapsed_minutes: elapsedMinutes,
    remaining_minutes: remainingMinutes,
    is_contacted: isContacted,
    is_breached: isBreached,
    deadline_at: new Date(createdAt + tier.maxMinutes * 60 * 1000).toISOString()
  };
}

function checkAllLeadSlas(leads = [], activities = []) {
  const evaluations = leads.map(l => evaluateLeadSla(l, activities));
  const breached = evaluations.filter(e => e.is_breached);
  const pending = evaluations.filter(e => !e.is_contacted && !e.is_breached);
  const contacted = evaluations.filter(e => e.is_contacted);

  return {
    total: leads.length,
    breached_count: breached.length,
    pending_count: pending.length,
    contacted_count: contacted.length,
    compliance_rate: leads.length ? Math.round((contacted.length / (contacted.length + breached.length || 1)) * 100) : 100,
    breached,
    pending,
    contacted
  };
}

/**
 * Auto-escalates breached leads by generating high-priority tasks and timeline alerts
 */
function autoEscalateBreaches(breachedLeads, tasks = [], activities = [], tenantId = 'tenant-1') {
  const createdTasks = [];
  const createdActivities = [];

  for (const b of breachedLeads) {
    const existingTask = tasks.find(t => t.tenant_id === tenantId && t.title && t.title.includes(`SLA BREACH: ${b.lead_name}`));
    if (!existingTask) {
      const task = {
        id: `task-sla-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenant_id: tenantId,
        title: `⚠️ SLA BREACH: Contact ${b.lead_name} immediately (${b.elapsed_minutes}m uncontacted)`,
        lead_id: b.lead_id,
        priority: 'urgent',
        status: 'pending',
        due_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      createdTasks.push(task);

      const activity = {
        id: `act-sla-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenant_id: tenantId,
        lead_id: b.lead_id,
        entity_type: 'lead',
        entity_id: b.lead_id,
        type: 'sla_breach',
        action: 'sla_breached',
        description: `⚠️ SLA Breach Alert: Lead uncontacted for ${b.elapsed_minutes} minutes (SLA: ${b.sla_minutes}m). Auto-escalated to Sales Manager.`,
        created_at: new Date().toISOString()
      };
      createdActivities.push(activity);
    }
  }

  return { createdTasks, createdActivities };
}

module.exports = {
  DEFAULT_SLA_POLICIES,
  getLeadSlaTier,
  evaluateLeadSla,
  checkAllLeadSlas,
  autoEscalateBreaches
};
