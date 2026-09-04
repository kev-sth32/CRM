const assert = require('assert');

(async () => {
  const base = 'http://localhost:3000';
  
  // Health
  let r = await fetch(base + '/api/health');
  assert.equal(r.status, 200);
  const health = await r.json();
  assert.equal(health.ok, true);

  // Authenticate
  const rLogin = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@acmecloud.com', password: 'secret' })
  });
  assert.equal(rLogin.status, 200);
  const cookie = rLogin.headers.get('set-cookie');

  // Leads CRUD
  r = await fetch(base + '/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cookie': cookie },
    body: JSON.stringify({ name: 'Automated Test Lead', company: 'Test Tenant' })
  });
  assert.equal(r.status, 201);
  const lead = await r.json();
  assert(lead.id);

  r = await fetch(base + '/api/leads', { headers: { 'cookie': cookie } });
  assert.equal(r.status, 200);
  const leads = await r.json();
  assert(leads.some(x => x.id === lead.id));

  r = await fetch(base + '/api/leads/' + lead.id, {
    method: 'DELETE',
    headers: { 'cookie': cookie }
  });
  assert.equal(r.status, 200);

  console.log('SalesOS API smoke tests passed');
})().catch(e => {
  console.error('Smoke test failed:', e.message);
  process.exit(1);
});
