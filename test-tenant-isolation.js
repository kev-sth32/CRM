const assert = require('assert');

(async () => {
  const base = 'http://localhost:3000';
  console.log('Running SalesOS Tenant-Isolation & Multi-Tenancy Test Suite...');

  // Authenticate Tenant 1
  const rLoginT1 = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@acmecloud.com', password: 'secret' })
  });
  assert.equal(rLoginT1.status, 200);
  const cookieT1 = rLoginT1.headers.get('set-cookie');

  // Authenticate Tenant 2
  const rLoginT2 = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'roshan@apextech.com', password: 'secret' })
  });
  assert.equal(rLoginT2.status, 200);
  const cookieT2 = rLoginT2.headers.get('set-cookie');

  // 1. Create Lead under Tenant 1 Session
  const rLeadTenant1 = await fetch(`${base}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieT1 },
    body: JSON.stringify({
      name: 'Tenant 1 Lead',
      company: 'Tenant 1 Corp',
      email: 't1@corp.com'
    })
  });
  assert.equal(rLeadTenant1.status, 201);
  const t1Lead = await rLeadTenant1.json();
  assert(t1Lead.id);
  assert.equal(t1Lead.tenant_id, 'tenant-1');

  // 2. Create Lead under Tenant 2 Session
  const rLeadTenant2 = await fetch(`${base}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieT2 },
    body: JSON.stringify({
      name: 'Tenant 2 Lead',
      company: 'Tenant 2 Corp',
      email: 't2@corp.com'
    })
  });
  assert.equal(rLeadTenant2.status, 201);
  const t2Lead = await rLeadTenant2.json();
  assert(t2Lead.id);
  assert.equal(t2Lead.tenant_id, 'tenant-2');

  // 3. Verify Tenant 1 query isolates records (Cannot see Tenant 2 leads)
  const rListT1 = await fetch(`${base}/api/leads`, { headers: { 'Cookie': cookieT1 } });
  assert.equal(rListT1.status, 200);
  const t1List = await rListT1.json();
  assert(t1List.every(l => !l.tenant_id || l.tenant_id === 'tenant-1'), 'Tenant 1 query must only return tenant 1 records');
  assert(!t1List.some(l => l.id === t2Lead.id), 'Tenant 1 must not see Tenant 2 lead');

  // 4. Verify Tenant 2 query isolates records (Cannot see Tenant 1 leads)
  const rListT2 = await fetch(`${base}/api/leads`, { headers: { 'Cookie': cookieT2 } });
  assert.equal(rListT2.status, 200);
  const t2List = await rListT2.json();
  assert(t2List.every(l => !l.tenant_id || l.tenant_id === 'tenant-2'), 'Tenant 2 query must only return tenant 2 records');
  assert(!t2List.some(l => l.id === t1Lead.id), 'Tenant 2 must not see Tenant 1 lead');

  // 5. Verify Cross-Tenant Tampering Prevention (Tenant 1 cannot modify Tenant 2 lead)
  const rCrossPatch = await fetch(`${base}/api/leads/${t2Lead.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieT1 },
    body: JSON.stringify({ name: 'Tampered Name' })
  });
  // Must return 404 or 403 because lead does not belong to Tenant 1
  assert([404, 403].includes(rCrossPatch.status), 'Cross-tenant mutation must be rejected');

  // 6. Verify Cross-Tenant SSE Event Stream Isolation
  const t2Token = cookieT2.match(/salesos_session=([^;]+)/)[1];
  let t2ReceivedEvents = [];
  const sseAbort = new AbortController();

  const ssePromise = (async () => {
    try {
      const res = await fetch(`${base}/api/events/stream?token=${t2Token}`, { signal: sseAbort.signal });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        t2ReceivedEvents.push(decoder.decode(value));
      }
    } catch (e) {
      // AbortError expected when test finishes
    }
  })();

  // Wait 200ms for SSE stream to establish
  await new Promise(r => setTimeout(r, 200));

  // Tenant 1 creates a private lead
  const rT1PrivateLead = await fetch(`${base}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieT1 },
    body: JSON.stringify({
      name: 'Ultra Secret Tenant 1 Enterprise Deal',
      company: 'T1 Only Corp',
      email: 'secret@t1.com'
    })
  });
  assert.equal(rT1PrivateLead.status, 201);
  const t1PrivateLead = await rT1PrivateLead.json();

  // Wait 300ms for potential event broadcast
  await new Promise(r => setTimeout(r, 300));
  sseAbort.abort();
  await ssePromise;

  // Verify Tenant 2 stream NEVER received Tenant 1 lead
  const allT2Data = t2ReceivedEvents.join('');
  assert(!allT2Data.includes('Ultra Secret Tenant 1 Enterprise Deal'), 'Tenant 2 SSE stream must NEVER receive events from Tenant 1');
  console.log('✓ 6. Cross-tenant EventStream (SSE) real-time event isolation verified');

  // Clean up all test leads
  await fetch(`${base}/api/leads/${t1PrivateLead.id}`, { method: 'DELETE', headers: { 'Cookie': cookieT1 } });
  await fetch(`${base}/api/leads/${t1Lead.id}`, { method: 'DELETE', headers: { 'Cookie': cookieT1 } });
  await fetch(`${base}/api/leads/${t2Lead.id}`, { method: 'DELETE', headers: { 'Cookie': cookieT2 } });

  console.log('✓ All Tenant-isolation verification checks passed successfully!');
})().catch(err => {
  console.error('Tenant Isolation Test Failed:', err);
  process.exit(1);
});
