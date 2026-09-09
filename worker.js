const { Pool } = require('pg');
const { processConnectorEvent } = require('./processor');
const logger = require('./logger');

if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL is required for worker');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : undefined
});

let running = true;
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down connector worker...');
  running = false;
});

async function tick() {
  const wid = process.pid.toString();
  
  // Reclaim stale processing leases older than 10 minutes
  await pool.query("UPDATE connector_events SET status='received' WHERE status='processing' AND processing_started_at<now()-interval '10 minutes'");

  // Lease available events with concurrency protection (FOR UPDATE SKIP LOCKED)
  const r = await pool.query(
    "UPDATE connector_events SET status='processing', processing_started_at=now(), worker_id=$1, attempt_count=attempt_count+1 WHERE id IN (SELECT id FROM connector_events WHERE status='received' AND available_at<=now() AND attempt_count<5 ORDER BY received_at FOR UPDATE SKIP LOCKED LIMIT 10) RETURNING id",
    [wid]
  );

  for (const row of r.rows) {
    try {
      await processConnectorEvent(pool, row.id);
      logger.info('Connector event processed successfully', { event_id: row.id, worker_id: wid });
    } catch (e) {
      const n = (await pool.query('SELECT attempt_count FROM connector_events WHERE id=$1', [row.id])).rows[0]?.attempt_count || 5;
      if (n >= 5) {
        await pool.query("UPDATE connector_events SET status='dead_letter', error=$2 WHERE id=$1", [row.id, e.message]);
        logger.error('Event dead-lettered after max attempts', { event_id: row.id, error: e.message, attempts: n });
      } else {
        await pool.query("UPDATE connector_events SET status='received', available_at=now()+(power(2,$2)||' seconds')::interval, error=$3 WHERE id=$1", [row.id, n, e.message]);
        logger.warn('Event failed, scheduled retry with exponential backoff', { event_id: row.id, error: e.message, attempt: n });
      }
    }
  }
}

async function main() {
  logger.info('SalesOS connector worker started', { pid: process.pid });
  while (running) {
    try {
      await tick();
    } catch (e) {
      logger.error('Worker tick loop error:', { error: e.message });
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  await pool.end();
  logger.info('Connector worker terminated cleanly');
}

main();
