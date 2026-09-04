const assert=require('assert');
if(!process.env.DATABASE_URL){console.log('PostgreSQL integration tests skipped: DATABASE_URL is not configured');process.exit(0)}
const {Pool}=require('pg');const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.PGSSL==='require'?{rejectUnauthorized:false}:undefined});
(async()=>{const r=await pool.query('SELECT 1 AS ok');assert.equal(r.rows[0].ok,1);const tables=await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('tenants','users','leads','audit_logs')");assert.equal(tables.rows.length,4);console.log('PostgreSQL schema connectivity test passed')})().catch(e=>{console.error('PostgreSQL integration test failed:',e.message);process.exitCode=1}).finally(()=>pool.end());
