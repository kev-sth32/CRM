const assert = require('assert');
const { validateAgentConfig } = require('./agent-config');
const { setAgentActive } = require('./agent-service');

// 1. Validate config
const a = validateAgentConfig({ name: 'Nora', mode: 'copilot', allowed_tools: ['search_customer'] });
assert.equal(a.name, 'Nora');
assert.throws(() => validateAgentConfig({ name: 'x', mode: 'invalid' }));

// 2. Default new agents to copilot mode
const defAgent = validateAgentConfig({ name: 'DefaultAgent' });
assert.equal(defAgent.mode, 'copilot', 'New agents must default to copilot mode');

// 3. Autonomous agent activation requires escalation rules
(async () => {
  const mockPoolNoEscalation = {
    query: async (sql, params) => {
      if (sql.includes('SELECT id, mode, escalation_rules')) {
        return { rows: [{ id: 'ag-1', mode: 'autonomous', escalation_rules: {} }] };
      }
      return { rows: [{ id: 'ag-1', mode: 'autonomous', is_active: true }] };
    }
  };
  await assert.rejects(
    async () => setAgentActive(mockPoolNoEscalation, 'tenant-1', 'ag-1', true),
    /Autonomous agent activation requires configured escalation rules/,
    'Autonomous agent without escalation rules must fail activation'
  );

  const mockPoolWithEscalation = {
    query: async (sql, params) => {
      if (sql.includes('SELECT id, mode, escalation_rules')) {
        return { rows: [{ id: 'ag-1', mode: 'autonomous', escalation_rules: { fallback_to_human: true } }] };
      }
      if (sql.includes('UPDATE ai_agents')) {
        return { rows: [{ id: 'ag-1', name: 'AutoAgent', mode: 'autonomous', is_active: true }] };
      }
      return { rows: [] };
    }
  };
  const activated = await setAgentActive(mockPoolWithEscalation, 'tenant-1', 'ag-1', true);
  assert.equal(activated.is_active, true);

  console.log('Agent config test passed');
})().catch(err => {
  console.error('Agent governance test failed:', err);
  process.exit(1);
});
