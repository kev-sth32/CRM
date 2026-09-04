const {Pool}=require('pg');
if(!process.env.DATABASE_URL){console.error('DATABASE_URL is required');process.exit(1)}
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.PGSSL==='require'?{rejectUnauthorized:false}:undefined});
let active=true;
process.on('SIGTERM',()=>active=false);
(async()=>{
  console.log('SalesOS approval expiry worker started');
  while(active){
    try {
      await pool.query("UPDATE ai_approvals SET status='expired' WHERE status='pending' AND expires_at<now()");
    } catch(err) {
      console.error('Approval worker query error (retrying):', err.message);
    }
    await new Promise(r=>setTimeout(r,30000));
  }
  await pool.end();
})().catch(e=>{console.error('Fatal approval worker error:', e);process.exit(1)});
