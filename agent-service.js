const { validateAgentConfig } = require('./agent-config');

async function listAgents(pool, tenantId) {
  return (await pool.query(
    'SELECT id,name,mode,language,tone,allowed_tools,is_active,created_at,updated_at FROM ai_agents WHERE tenant_id=$1 ORDER BY created_at DESC',
    [tenantId]
  )).rows;
}

async function createAgent(pool, tenantId, input) {
  const c = validateAgentConfig(input);
  const r = await pool.query(
    'INSERT INTO ai_agents(tenant_id,name,mode,language,tone,system_policy,allowed_tools,escalation_rules) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [tenantId, c.name, c.mode, c.language, c.tone, c.system_policy, c.allowed_tools, c.escalation_rules]
  );
  return r.rows[0];
}

async function setAgentActive(pool, tenantId, id, active, userId = 'system') {
  // Enforce escalation rules before autonomous activation (AGENTS.md compliance)
  if (active) {
    const existing = (await pool.query(
      'SELECT id, mode, escalation_rules FROM ai_agents WHERE id=$1 AND tenant_id=$2',
      [id, tenantId]
    )).rows[0];
    if (!existing) throw Error('Agent not found');
    if (existing.mode === 'autonomous') {
      const hasEscalation = existing.escalation_rules && 
        typeof existing.escalation_rules === 'object' && 
        Object.keys(existing.escalation_rules).length > 0;
      if (!hasEscalation) {
        throw Error('Autonomous agent activation requires configured escalation rules');
      }
    }
  }

  const r = await pool.query(
    'UPDATE ai_agents SET is_active=$1,updated_at=now() WHERE id=$2 AND tenant_id=$3 RETURNING id,name,mode,is_active',
    [active, id, tenantId]
  );
  if (!r.rows[0]) throw Error('Agent not found');

  // Audit agent activation status changes
  try {
    await pool.query(
      'INSERT INTO audit_logs(tenant_id,user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5,$6)',
      [tenantId, userId, active ? 'agent_activated' : 'agent_deactivated', 'ai_agent', id, { mode: r.rows[0].mode, is_active: active }]
    );
  } catch (e) {
    // Non-fatal if table or audit logging is unavailable in unit mocks
  }

  return r.rows[0];
}

module.exports = { listAgents, createAgent, setAgentActive };
