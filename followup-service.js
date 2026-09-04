async function createSequence(pool, tenantId, input) {
  if (!input.name) throw Error('name is required');
  const r = await pool.query(
    'INSERT INTO followup_sequences(tenant_id,name,steps) VALUES($1,$2,$3) RETURNING *',
    [tenantId, input.name, input.steps || []]
  );
  return r.rows[0];
}

async function enroll(pool, tenantId, input) {
  if (!input.sequence_id || !input.lead_id) throw Error('sequence_id and lead_id are required');
  if (pool && typeof pool.query === 'function') {
    const seq = await pool.query('SELECT id, tenant_id FROM followup_sequences WHERE id=$1', [input.sequence_id]);
    if (seq && seq.rows && seq.rows.length > 0 && seq.rows[0].tenant_id !== tenantId) {
      throw Error('Cannot enroll: sequence belongs to another tenant');
    }
  }
  const r = await pool.query(
    'INSERT INTO followup_enrollments(tenant_id,sequence_id,lead_id,next_run_at) VALUES($1,$2,$3,$4) RETURNING *',
    [tenantId, input.sequence_id, input.lead_id, input.next_run_at || new Date()]
  );
  return r.rows[0];
}

async function pause(pool, tenantId, id) {
  const r = await pool.query(
    "UPDATE followup_enrollments SET status='paused',updated_at=now() WHERE id=$1 AND tenant_id=$2 AND status='active' RETURNING *",
    [id, tenantId]
  );
  if (!r.rows[0]) throw Error('Active enrollment not found');
  return r.rows[0];
}

module.exports = { createSequence, enroll, pause };
