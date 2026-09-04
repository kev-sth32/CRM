async function createHandoff(pool, tenantId, input) {
  if (!input.reason) throw Error('reason is required');
  if (pool && typeof pool.query === 'function' && input.conversation_id) {
    const conv = await pool.query('SELECT id, tenant_id FROM conversations WHERE id=$1', [input.conversation_id]);
    if (conv && conv.rows && conv.rows.length > 0 && conv.rows[0].tenant_id !== tenantId) {
      throw Error('Cannot create handoff: conversation belongs to another tenant');
    }
  }
  const r = await pool.query(
    'INSERT INTO handoffs(tenant_id,conversation_id,lead_id,requested_by,assigned_user_id,reason,summary,priority) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [tenantId, input.conversation_id || null, input.lead_id || null, input.requested_by || 'ai_agent', input.assigned_user_id || null, input.reason, input.summary || null, input.priority || 'normal']
  );
  return r.rows[0];
}

async function listHandoffs(pool, tenantId) {
  return (await pool.query("SELECT * FROM handoffs WHERE tenant_id=$1 AND status='open' ORDER BY created_at DESC", [tenantId])).rows;
}

async function resolveHandoff(pool, tenantId, id, userId) {
  const r = await pool.query(
    "UPDATE handoffs SET status='resolved',assigned_user_id=COALESCE(assigned_user_id,$1),resolved_at=now() WHERE id=$2 AND tenant_id=$3 AND status='open' RETURNING id,status,resolved_at",
    [userId, id, tenantId]
  );
  if (!r.rows[0]) throw Error('Handoff not found or already resolved');
  return r.rows[0];
}

module.exports = { createHandoff, listHandoffs, resolveHandoff };
