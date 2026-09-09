const { Pool } = require('pg');
const logger = require('./logger');

if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL environment variable is required for approval worker');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : undefined
});

let active = true;
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down approval worker gracefully...');
  active = false;
});

(async () => {
  logger.info('SalesOS approval expiry worker started');
  while (active) {
    try {
      const res = await pool.query("UPDATE ai_approvals SET status='expired' WHERE status='pending' AND expires_at<now()");
      if (res.rowCount > 0) {
        logger.info(`Expired ${res.rowCount} pending approval(s) past expiration window`);
      }
    } catch (err) {
      logger.error('Approval worker query error (retrying):', { error: err.message });
    }
    await new Promise(r => setTimeout(r, 30000));
  }
  await pool.end();
  logger.info('Approval worker terminated cleanly');
})().catch(e => {
  logger.error('Fatal approval worker error:', { error: e.message });
  process.exit(1);
});
