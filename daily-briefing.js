/**
 * AI Daily Sales Manager & Morning Briefing Engine
 * Implements PRD Section 24 & Section 41
 * Computes executive sales briefs, at-risk deals, high-intent leads, and prioritized actions.
 */

function generateDailyBriefing({ tenant, deals = [], leads = [], tasks = [], activities = [] }) {
  const currency = tenant?.currency || 'NPR';
  const now = new Date();

  // 1. Pipeline & Forecast Metrics
  const activeDeals = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage));
  const wonDeals = deals.filter(d => d.stage === 'Closed Won');
  const pipelineValue = activeDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const weightedPipeline = activeDeals.reduce((sum, d) => sum + (Number(d.amount || 0) * (Number(d.probability || 50) / 100)), 0);
  const wonValue = wonDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  // 2. Deals at Risk
  const atRiskDeals = activeDeals.filter(d => {
    if (d.risk === 'At Risk') return true;
    if (d.updated_at) {
      const daysSinceUpdate = (now - new Date(d.updated_at)) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 5) return true;
    }
    return false;
  }).map(d => ({
    id: d.id,
    name: d.name || d.title || 'Untitled Deal',
    company: d.company_name || d.company || 'Account',
    amount: d.amount,
    stage: d.stage,
    reason: d.risk_reason || 'No activity detected over 5 days'
  }));

  // 3. High-Intent Priority Leads
  const highIntentLeads = leads.filter(l => {
    const score = Number(l.score || l.qualification_score || 0);
    return score >= 75 || l.status === 'qualified' || l.intent === 'high';
  }).slice(0, 5).map(l => ({
    id: l.id,
    name: l.name,
    company: l.company || 'Independent',
    score: l.score || 80,
    email: l.email,
    phone: l.phone,
    intent: l.intent || 'high'
  }));

  // 4. Overdue Tasks
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed' || t.completed) return false;
    if (t.due_date) {
      return new Date(t.due_date) < now;
    }
    return false;
  }).map(t => ({
    id: t.id,
    title: t.title || t.name,
    due_date: t.due_date,
    priority: t.priority || 'high'
  }));

  // 5. Daily Manager Executive Recommendations
  const recommendations = [];

  if (atRiskDeals.length > 0) {
    recommendations.push({
      priority: 'high',
      action: `Rescue ${atRiskDeals.length} At-Risk Deals`,
      target_name: atRiskDeals[0].name,
      reason: `Stalled in ${atRiskDeals[0].stage} with ${currency} ${Number(atRiskDeals[0].amount).toLocaleString()} at stake`,
      suggested_message: `Follow up with ${atRiskDeals[0].company} to address pricing or contract questions.`
    });
  }

  if (highIntentLeads.length > 0) {
    recommendations.push({
      priority: 'urgent',
      action: `Contact High-Intent Lead: ${highIntentLeads[0].name}`,
      target_name: highIntentLeads[0].name,
      reason: `Lead score ${highIntentLeads[0].score}/100 with immediate buying signals`,
      suggested_message: `Send meeting invite or call ${highIntentLeads[0].phone || highIntentLeads[0].email} to review requirements.`
    });
  }

  if (overdueTasks.length > 0) {
    recommendations.push({
      priority: 'medium',
      action: `Clear Overdue Follow-up Tasks (${overdueTasks.length})`,
      target_name: overdueTasks[0].title,
      reason: `Task overdue since ${overdueTasks[0].due_date}`,
      suggested_message: `Complete or reschedule outstanding commitments to maintain SLA compliance.`
    });
  }

  // 6. Natural Language Morning Briefing Narrative (PRD Section 59)
  const greeting = now.getHours() < 12 ? 'Good morning' : (now.getHours() < 17 ? 'Good afternoon' : 'Good evening');
  const narrative = `${greeting}, ${tenant?.name || 'Team'}. You have ${highIntentLeads.length} high-intent leads ready for outreach, and ${currency} ${Math.round(pipelineValue).toLocaleString()} in active sales pipeline. ${atRiskDeals.length > 0 ? `Attention required: ${atRiskDeals.length} deals have stalled and need executive follow-up.` : 'Pipeline health is strong with consistent engagement.'}`;

  return {
    generated_at: now.toISOString(),
    narrative,
    metrics: {
      active_deals_count: activeDeals.length,
      pipeline_value: pipelineValue,
      weighted_pipeline: Math.round(weightedPipeline),
      won_value: wonValue,
      won_deals_count: wonDeals.length,
      currency
    },
    at_risk_deals: atRiskDeals,
    high_intent_leads: highIntentLeads,
    overdue_tasks: overdueTasks,
    recommendations
  };
}

module.exports = { generateDailyBriefing };
