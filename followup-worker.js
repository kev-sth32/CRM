async function claimFollowups(pool){
  await pool.query("UPDATE followup_enrollments SET status='active' WHERE status='processing' AND updated_at < now() - interval '10 minutes'");
  return (await pool.query("UPDATE followup_enrollments SET status='processing',updated_at=now() WHERE id IN (SELECT id FROM followup_enrollments WHERE status='active' AND next_run_at<=now() FOR UPDATE SKIP LOCKED LIMIT 20) RETURNING *")).rows;
}
module.exports={claimFollowups};
