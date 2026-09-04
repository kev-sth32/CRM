const assert = require('assert');

(async () => {
  const base = 'http://localhost:3000';
  console.log('Running SalesOS End-to-End Test Suite...');

  // 1. Health
  const rHealth = await fetch(`${base}/api/health`);
  assert.equal(rHealth.status, 200);
  const health = await rHealth.json();
  assert.equal(health.ok, true);
  console.log('✓ Health check passed');

  // Authenticate as Tenant Owner
  const rOwnerLogin = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@acmecloud.com', password: 'secret' })
  });
  assert.equal(rOwnerLogin.status, 200);
  const ownerCookie = rOwnerLogin.headers.get('set-cookie');
  const authHeaders = { 'Cookie': ownerCookie, 'Content-Type': 'application/json' };

  // 2. Dashboard Stats
  const rStats = await fetch(`${base}/api/dashboard/stats`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rStats.status, 200);
  const stats = await rStats.json();
  assert(stats.revenue_this_month);
  assert(Array.isArray(stats.priority_leads));
  assert(Array.isArray(stats.ai_brief));
  console.log('✓ Dashboard stats API passed');

  // 3. Leads CRUD & Qualification
  const rLeadCreate = await fetch(`${base}/api/leads`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'E2E Test Prospect', company: 'E2E Corp', email: 'e2e@test.com' })
  });
  assert.equal(rLeadCreate.status, 201);
  const createdLead = await rLeadCreate.json();
  assert(createdLead.id);

  const rLeadQual = await fetch(`${base}/api/leads/${createdLead.id}/qualify`, {
    method: 'POST',
    headers: { 'Cookie': ownerCookie }
  });
  assert.equal(rLeadQual.status, 200);
  const qualResult = await rLeadQual.json();
  assert(qualResult.score !== undefined);

  const rLeadPatch = await fetch(`${base}/api/leads/${createdLead.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ stage: 'Qualified' })
  });
  assert.equal(rLeadPatch.status, 200);

  const rLeadDelete = await fetch(`${base}/api/leads/${createdLead.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': ownerCookie }
  });
  assert.equal(rLeadDelete.status, 200);
  console.log('✓ Leads CRUD & AI Qualification passed');

  // 4. Contacts
  const rContact = await fetch(`${base}/api/contacts`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rContact.status, 200);
  const contacts = await rContact.json();
  assert(Array.isArray(contacts));
  console.log('✓ Contacts API passed');

  // 5. Companies
  const rCompany = await fetch(`${base}/api/companies`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rCompany.status, 200);
  const companies = await rCompany.json();
  assert(Array.isArray(companies));
  console.log('✓ Companies API passed');

  // 6. Opportunities
  const rOpp = await fetch(`${base}/api/opportunities`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rOpp.status, 200);
  const opps = await rOpp.json();
  assert(Array.isArray(opps));
  console.log('✓ Opportunities API passed');

  // 7. Products
  const rProd = await fetch(`${base}/api/products`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rProd.status, 200);
  const products = await rProd.json();
  assert(Array.isArray(products));
  console.log('✓ Products API passed');

  // 8. Tasks
  const rTask = await fetch(`${base}/api/tasks`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rTask.status, 200);
  const tasks = await rTask.json();
  assert(Array.isArray(tasks));
  console.log('✓ Tasks API passed');

  // 9. Campaigns
  const rCamp = await fetch(`${base}/api/campaigns`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rCamp.status, 200);
  const campaigns = await rCamp.json();
  assert(Array.isArray(campaigns));
  console.log('✓ Campaigns API passed');

  // 10. Automations
  const rAuto = await fetch(`${base}/api/automations`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rAuto.status, 200);
  const automations = await rAuto.json();
  assert(Array.isArray(automations));
  console.log('✓ Automations API passed');

  // 11. Reports
  const rRep = await fetch(`${base}/api/reports`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rRep.status, 200);
  const reports = await rRep.json();
  assert(reports.summary && reports.pipeline_funnel);
  console.log('✓ Reports API passed');

  // 12. Settings
  const rSet = await fetch(`${base}/api/settings`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rSet.status, 200);
  const settings = await rSet.json();
  assert(settings.company_name);
  console.log('✓ Settings API passed');

  // 13. Omnichannel: Conversations & Messages
  const rConv = await fetch(`${base}/api/conversations`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rConv.status, 200);
  const convs = await rConv.json();
  assert(Array.isArray(convs));

  if (convs.length > 0) {
    const rMsg = await fetch(`${base}/api/messages?conversation_id=${convs[0].id}`, { headers: { 'Cookie': ownerCookie } });
    assert.equal(rMsg.status, 200);
    const msgs = await rMsg.json();
    assert(Array.isArray(msgs));
  }
  console.log('✓ Omnichannel Conversations & Messages passed');

  // 14. AI Copilot & Approvals
  const rCopilot = await fetch(`${base}/api/ai/copilot/suggest`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ query: 'Client asking about discount on 50 seats' })
  });
  assert.equal(rCopilot.status, 200);
  const copilotData = await rCopilot.json();
  assert(copilotData.next_best_action);

  const rAppr = await fetch(`${base}/api/ai-approvals`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rAppr.status, 200);
  console.log('✓ AI Copilot suggestions & approvals passed');

  // 15. Authentication Flow
  const rLogin = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@acmecloud.com', password: 'secret' })
  });
  assert.equal(rLogin.status, 200);
  const loginData = await rLogin.json();
  assert(loginData.user && loginData.user.email);

  const rMe = await fetch(`${base}/api/auth/me`, { headers: { 'Cookie': rLogin.headers.get('set-cookie') } });
  assert.equal(rMe.status, 200);

  const rLogout = await fetch(`${base}/api/auth/logout`, { method: 'POST', headers: { 'Cookie': rLogin.headers.get('set-cookie') } });
  assert.equal(rLogout.status, 200);
  console.log('✓ Authentication, session inspection & logout passed');

  // 16. Superadmin Platform APIs (with authenticated superadmin credentials)
  const rSuperLogin = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@salesos.io', password: 'secret' })
  });
  assert.equal(rSuperLogin.status, 200);
  const superCookie = rSuperLogin.headers.get('set-cookie');

  const rSuperStats = await fetch(`${base}/api/superadmin/stats`, { headers: { 'Cookie': superCookie } });
  assert.equal(rSuperStats.status, 200);
  const superStats = await rSuperStats.json();
  assert(superStats.total_tenants !== undefined);

  const rSuperTenants = await fetch(`${base}/api/superadmin/tenants`, { headers: { 'Cookie': superCookie } });
  assert.equal(rSuperTenants.status, 200);
  const superTenants = await rSuperTenants.json();
  assert(Array.isArray(superTenants));
  console.log('✓ Superadmin platform telemetry & tenant directory APIs passed');

  // 17. HTML Pages Availability
  const pages = [
    '/index.html',
    '/leads.html',
    '/contacts.html',
    '/companies.html',
    '/deals.html',
    '/products.html',
    '/tasks.html',
    '/campaigns.html',
    '/automations.html',
    '/reports.html',
    '/settings.html',
    '/inbox.html',
    '/approvals.html',
    '/superadmin.html',
    '/login.html',
    '/quotes.html',
    '/quote-view.html',
    '/404.html',
    '/workspace.html'
  ];

  for (const page of pages) {
    const rPage = await fetch(`${base}${page}`);
    assert.equal(rPage.status, 200, `Page ${page} should return 200 OK`);
  }
  console.log(`✓ All ${pages.length} UI routes and views verified returning 200 OK`);

  console.log('\n======================================================');
  console.log('🎉 ALL END-TO-END VERIFICATION CHECKS PASSED!');
  console.log('======================================================');
})().catch(err => {
  console.error('\n❌ E2E Test Suite Failed:', err);
  process.exit(1);
});
