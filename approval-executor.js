async function executeApproved(pool, service, approvalId, ctx) {
  // Atomic state transition to prevent TOCTOU race conditions and double-execution
  const r = await pool.query(
    "UPDATE ai_approvals SET status='executing', updated_at=now() WHERE id=$1 AND tenant_id=$2 AND status='approved' AND (expires_at IS NULL OR expires_at > now()) RETURNING id, tenant_id, action, payload, status, expires_at",
    [approvalId, ctx.tenant_id]
  );
  const a = r.rows[0];
  if (!a) {
    const check = (await pool.query(
      "SELECT id, status, expires_at FROM ai_approvals WHERE id=$1 AND tenant_id=$2",
      [approvalId, ctx.tenant_id]
    )).rows[0];
    if (!check) throw Error('Approval not found');
    if (check.status !== 'approved') throw Error('Approval is not executable');
    if (check.expires_at && new Date(check.expires_at) <= new Date()) throw Error('Approval expired');
    throw Error('Approval is already executing or completed');
  }

  try {
    const result = await service.runTool(a.action, a.payload, {
      ...ctx,
      policy: { agent_mode: 'autonomous', approval_required: [] }
    });
    await pool.query(
      "UPDATE ai_approvals SET status='executed', reviewed_at=COALESCE(reviewed_at,now()), reason=COALESCE(reason,'Executed') WHERE id=$1",
      [approvalId]
    );
    return result;
  } catch (err) {
    await pool.query(
      "UPDATE ai_approvals SET status='approved', reason=$2 WHERE id=$1",
      [approvalId, `Execution failed: ${err.message}`]
    );
    throw err;
  }
}

module.exports = { executeApproved };
