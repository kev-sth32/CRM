// test-superadmin-suite.js - Comprehensive Superadmin Verification Suite
const assert = require('assert');

const base = 'http://127.0.0.1:3000';

async function run() {
  console.log('=== Starting SalesOS Superadmin Control Plane Verification Suite ===\n');

  // 1. Verify Non-Superadmin Rejection (403 Forbidden)
  const rLoginOwner = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@acmecloud.com', password: 'secret' })
  });
  assert.equal(rLoginOwner.status, 200);
  const ownerCookie = rLoginOwner.headers.get('set-cookie');

  const rStatsOwner = await fetch(`${base}/api/superadmin/stats`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rStatsOwner.status, 403, 'Regular owner must be blocked from /api/superadmin/stats');

  const rTelemOwner = await fetch(`${base}/api/superadmin/telemetry`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rTelemOwner.status, 403, 'Regular owner must be blocked from /api/superadmin/telemetry');

  const rTenantsOwner = await fetch(`${base}/api/superadmin/tenants`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rTenantsOwner.status, 403, 'Regular owner must be blocked from /api/superadmin/tenants');

  const rDlqOwner = await fetch(`${base}/api/superadmin/dlq`, { headers: { 'Cookie': ownerCookie } });
  assert.equal(rDlqOwner.status, 403, 'Regular owner must be blocked from /api/superadmin/dlq');
  console.log('✓ 1. Strict RBAC 403 Forbidden enforcement on all superadmin endpoints verified');

  // 2. Superadmin Login & Telemetry
  const rLoginSuper = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@salesos.io', password: 'secret' })
  });
  assert.equal(rLoginSuper.status, 200);
  const superCookie = rLoginSuper.headers.get('set-cookie');

  const rTelem = await fetch(`${base}/api/superadmin/telemetry`, { headers: { 'Cookie': superCookie } });
  assert.equal(rTelem.status, 200);
  const telem = await rTelem.json();
  assert(telem.total_tenants >= 3, 'Must report active tenants count');
  assert(telem.system_status, 'Must include system_status');
  assert(telem.system_status.ai_models, 'Must include configured AI models');
  assert.equal(telem.system_status.ai_models.primary, 'meta/llama-3.2-11b-vision-instruct');
  assert(telem.system_status.memory, 'Must include process memory telemetry');
  assert(telem.system_status.uptime_seconds >= 0, 'Must include uptime');
  console.log('✓ 2. Superadmin telemetry & multi-model runtime telemetry verified');

  // 3. Superadmin Tenant Provisioning with Initial User & Policies
  const testSlug = `test-org-${Date.now()}`;
  const testAdminEmail = `admin-${Date.now()}@testorg.com`;

  const rProvision = await fetch(`${base}/api/superadmin/tenants`, {
    method: 'POST',
    headers: { 'Cookie': superCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Automated Test Organization',
      slug: testSlug,
      plan: 'Enterprise SaaS',
      admin_name: 'Prakash Sharma',
      admin_email: testAdminEmail
    })
  });
  assert.equal(rProvision.status, 201, 'Provisioning must return 201 Created');
  const provisioned = await rProvision.json();
  assert.equal(provisioned.name, 'Automated Test Organization');
  assert.equal(provisioned.slug, testSlug);
  assert.equal(provisioned.initial_admin.email, testAdminEmail);

  // Verify newly created admin user can log in immediately with initial credentials
  const initialPassword = (provisioned.initial_admin && provisioned.initial_admin.temporary_password) || 'secret';
  const rLoginNewAdmin = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testAdminEmail, password: initialPassword })
  });
  assert.equal(rLoginNewAdmin.status, 200, 'Newly provisioned tenant admin must be able to log in immediately');
  const newAdminData = await rLoginNewAdmin.json();
  assert.equal(newAdminData.user.tenant_id, provisioned.id);
  assert.equal(newAdminData.user.role, 'owner');
  console.log('✓ 3. Complete tenant provisioning with auto-created admin user verified');

  // 4. Slug & Email Duplicate Validation
  const rDupSlug = await fetch(`${base}/api/superadmin/tenants`, {
    method: 'POST',
    headers: { 'Cookie': superCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Org',
      slug: testSlug,
      admin_email: 'unique@org.com'
    })
  });
  assert.equal(rDupSlug.status, 409, 'Duplicate slug must be rejected with 409 Conflict');

  const rDupEmail = await fetch(`${base}/api/superadmin/tenants`, {
    method: 'POST',
    headers: { 'Cookie': superCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Unique Org Name',
      slug: `unique-slug-${Date.now()}`,
      admin_email: testAdminEmail
    })
  });
  assert.equal(rDupEmail.status, 409, 'Duplicate admin email must be rejected with 409 Conflict');
  console.log('✓ 4. Provisioning slug & admin email uniqueness collision defense verified');

  // 5. Tenant Update (PATCH)
  const rPatch = await fetch(`${base}/api/superadmin/tenants/${provisioned.id}`, {
    method: 'PATCH',
    headers: { 'Cookie': superCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'Suspended',
      plan: 'Growth SaaS',
      mrr: 1250000
    })
  });
  assert.equal(rPatch.status, 200);
  const patched = await rPatch.json();
  assert.equal(patched.status, 'Suspended');
  assert.equal(patched.plan, 'Growth SaaS');
  assert.equal(patched.mrr, 1250000);
  console.log('✓ 5. Tenant subscription tier, status (Suspended), and MRR updates verified');

  // 6. Tenant Context Switching and Impersonation Reversion (Two-Way Context Switching)
  const rSwitch = await fetch(`${base}/api/superadmin/switch-tenant`, {
    method: 'POST',
    headers: { 'Cookie': superCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_id: provisioned.id })
  });
  assert.equal(rSwitch.status, 200);
  const switchData = await rSwitch.json();
  assert.equal(switchData.user.tenant_id, provisioned.id);
  assert.equal(switchData.user.is_impersonating, true);
  const switchedCookie = rSwitch.headers.get('set-cookie');

  // Verify /api/auth/me reports impersonation mode
  const rMeSwitched = await fetch(`${base}/api/auth/me`, { headers: { 'Cookie': switchedCookie } });
  assert.equal(rMeSwitched.status, 200);
  const meSwitchedData = await rMeSwitched.json();
  assert.equal(meSwitchedData.user.is_impersonating, true);
  assert.equal(meSwitchedData.user.original_user.role, 'superadmin');

  // Verify Superadmin can still access /api/superadmin/* while impersonating
  const rSuperAccessWhileImpersonating = await fetch(`${base}/api/superadmin/telemetry`, {
    headers: { 'Cookie': switchedCookie }
  });
  assert.equal(rSuperAccessWhileImpersonating.status, 200, 'Superadmin in impersonation mode must retain superadmin access');

  // Switch back to root Superadmin
  const rSwitchBack = await fetch(`${base}/api/superadmin/switch-back`, {
    method: 'POST',
    headers: { 'Cookie': switchedCookie }
  });
  assert.equal(rSwitchBack.status, 200);
  const switchBackData = await rSwitchBack.json();
  assert.equal(switchBackData.user.role, 'superadmin');
  const restoredCookie = rSwitchBack.headers.get('set-cookie');

  const rMeRestored = await fetch(`${base}/api/auth/me`, { headers: { 'Cookie': restoredCookie } });
  const meRestoredData = await rMeRestored.json();
  assert.equal(meRestoredData.user.role, 'superadmin');
  assert.equal(meRestoredData.user.is_impersonating, false);
  console.log('✓ 6. Two-way tenant switching & switch-back with session preservation verified');

  // 7. Tenant Deletion Safeguards & Execution
  // Safeguard: tenant-1 cannot be deleted
  const rDelProtected = await fetch(`${base}/api/superadmin/tenants/tenant-1`, {
    method: 'DELETE',
    headers: { 'Cookie': restoredCookie }
  });
  assert.equal(rDelProtected.status, 400, 'Root workspace tenant-1 must be protected against deletion');

  // Delete test tenant
  const rDel = await fetch(`${base}/api/superadmin/tenants/${provisioned.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': restoredCookie }
  });
  assert.equal(rDel.status, 200);
  const delData = await rDel.json();
  assert.equal(delData.deleted_id, provisioned.id);

  // Confirm deleted tenant no longer exists
  const rListTenants = await fetch(`${base}/api/superadmin/tenants`, { headers: { 'Cookie': restoredCookie } });
  const listTenants = await rListTenants.json();
  assert(!listTenants.some(t => t.id === provisioned.id), 'Deleted tenant must not appear in tenants list');
  console.log('✓ 7. Tenant deletion safeguards (tenant-1 protected) & workspace purge verified');

  // 8. Dead-Letter Queue (DLQ) Management APIs
  const rDlq = await fetch(`${base}/api/superadmin/dlq`, { headers: { 'Cookie': restoredCookie } });
  assert.equal(rDlq.status, 200);
  const dlqItems = await rDlq.json();
  assert(Array.isArray(dlqItems));

  const rDlqReplay = await fetch(`${base}/api/superadmin/dlq/non-existent-event/replay`, {
    method: 'POST',
    headers: { 'Cookie': restoredCookie }
  });
  assert.equal(rDlqReplay.status, 404, 'Non-existent DLQ item replay should return 404');
  console.log('✓ 8. Dead-Letter Queue (DLQ) inspection and replay APIs verified');

  // 9. Suspended Tenant Access Lockout (Login & Live Session Rejection)
  const suspendSlug = `suspend-test-${Date.now()}`;
  const suspendEmail = `suspend-admin-${Date.now()}@test.com`;
  const rProvSuspend = await fetch(`${base}/api/superadmin/tenants`, {
    method: 'POST',
    headers: { 'Cookie': restoredCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Suspension Test Org',
      slug: suspendSlug,
      plan: 'Starter SaaS',
      admin_name: 'Suspended Admin',
      admin_email: suspendEmail
    })
  });
  assert.equal(rProvSuspend.status, 201);
  const suspendOrg = await rProvSuspend.json();
  const tempPw = suspendOrg.initial_admin.temporary_password || 'secret';

  // Login while Active -> must succeed
  const rLoginActive = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: suspendEmail, password: tempPw })
  });
  assert.equal(rLoginActive.status, 200, 'Login must succeed when tenant is Active');
  const activeUserCookie = rLoginActive.headers.get('set-cookie');

  // Verify active session can read API
  const rMeBeforeSuspend = await fetch(`${base}/api/auth/me`, { headers: { 'Cookie': activeUserCookie } });
  assert.equal(rMeBeforeSuspend.status, 200);

  // Now suspend the tenant via Superadmin PATCH
  const rSetSuspended = await fetch(`${base}/api/superadmin/tenants/${suspendOrg.id}`, {
    method: 'PATCH',
    headers: { 'Cookie': restoredCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Suspended' })
  });
  assert.equal(rSetSuspended.status, 200);

  // Attempt login for suspended tenant user -> must be rejected with 403
  const rLoginSuspended = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: suspendEmail, password: tempPw })
  });
  assert.equal(rLoginSuspended.status, 403, 'Suspended tenant login must be rejected with 403 Forbidden');
  const loginSuspendedBody = await rLoginSuspended.json();
  assert(loginSuspendedBody.error.includes('suspended'), 'Error message must mention tenant suspension');

  // Existing session making API call -> must be locked out with 403
  const rApiCallSuspended = await fetch(`${base}/api/leads`, { headers: { 'Cookie': activeUserCookie } });
  assert.equal(rApiCallSuspended.status, 403, 'API calls with existing session of suspended tenant must return 403');

  // Reactivate tenant -> verify access restored
  await fetch(`${base}/api/superadmin/tenants/${suspendOrg.id}`, {
    method: 'PATCH',
    headers: { 'Cookie': restoredCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Active' })
  });
  const rLoginReactivated = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: suspendEmail, password: tempPw })
  });
  assert.equal(rLoginReactivated.status, 200, 'Login must succeed after tenant reactivated');
  console.log('✓ 9. Strict suspended tenant enforcement on login and live API sessions verified');

  // 10. Comprehensive Cascading Deletion Verification
  // Create test lead under suspendOrg
  const reactivatedCookie = rLoginReactivated.headers.get('set-cookie');
  const rCreateLead = await fetch(`${base}/api/leads`, {
    method: 'POST',
    headers: { 'Cookie': reactivatedCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Cascading Test Lead', company: 'Test Corp' })
  });
  assert.equal(rCreateLead.status, 201);
  const createdLead = await rCreateLead.json();

  // Delete suspendOrg via Superadmin
  const rPurgeTenant = await fetch(`${base}/api/superadmin/tenants/${suspendOrg.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': restoredCookie }
  });
  assert.equal(rPurgeTenant.status, 200);

  // Verify that active session was purged immediately
  const rPurgedSession = await fetch(`${base}/api/leads`, { headers: { 'Cookie': reactivatedCookie } });
  assert.equal(rPurgedSession.status, 401, 'Active session belonging to purged tenant must be immediately invalidated');

  // Verify in JSON engine that all tenant-associated entities are purged
  const fs = require('fs');
  const dbData = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  assert(!dbData.tenants.some(t => t.id === suspendOrg.id), 'Tenant must be deleted');
  assert(!dbData.users.some(u => u.tenant_id === suspendOrg.id), 'Users must be cascade-deleted');
  assert(!dbData.leads.some(l => l.tenant_id === suspendOrg.id), 'Leads must be cascade-deleted');
  assert(!dbData.ai_policies.some(p => p.tenant_id === suspendOrg.id), 'AI policies must be cascade-deleted');
  assert(!dbData.scoring_rules.some(s => s.tenant_id === suspendOrg.id), 'Scoring rules must be cascade-deleted');
  console.log('✓ 10. Complete multi-entity cascading purge and active session revocation verified');

  // 11. Mutating Superadmin Endpoints RBAC Rejection
  const mutatingEndpoints = [
    { method: 'POST', url: `${base}/api/superadmin/tenants`, body: { name: 'X', slug: 'x', admin_email: 'x@x.com' } },
    { method: 'PATCH', url: `${base}/api/superadmin/tenants/tenant-1`, body: { status: 'Suspended' } },
    { method: 'DELETE', url: `${base}/api/superadmin/tenants/tenant-1` },
    { method: 'POST', url: `${base}/api/superadmin/switch-tenant`, body: { tenant_id: 'tenant-1' } },
    { method: 'POST', url: `${base}/api/superadmin/switch-back` },
    { method: 'POST', url: `${base}/api/superadmin/dlq/some-id/replay` }
  ];

  for (const ep of mutatingEndpoints) {
    const res = await fetch(ep.url, {
      method: ep.method,
      headers: { 'Cookie': ownerCookie, 'Content-Type': 'application/json' },
      body: ep.body ? JSON.stringify(ep.body) : undefined
    });
    assert.equal(res.status, 403, `Non-superadmin must be rejected with 403 on ${ep.method} ${ep.url}`);
  }
  console.log('✓ 11. Non-superadmin RBAC 403 rejection on all mutating superadmin endpoints verified');

  // 12. Unauthenticated Request Rejection (401/403)
  const rUnauth = await fetch(`${base}/api/superadmin/tenants`);
  assert(rUnauth.status === 401 || rUnauth.status === 403, 'Unauthenticated request to superadmin must be rejected');
  console.log('✓ 12. Unauthenticated request rejection verified');

  // 13. DLQ Replay Status Validation Guard
  // Inject a mock completed event into data.json
  const rawDb = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  rawDb.connector_events = rawDb.connector_events || [];
  const testCompletedEventId = `ev-completed-${Date.now()}`;
  rawDb.connector_events.push({
    id: testCompletedEventId,
    tenant_id: 'tenant-1',
    type: 'test.webhook',
    status: 'completed',
    attempt_count: 1,
    received_at: new Date().toISOString()
  });
  const testFailedEventId = `ev-failed-${Date.now()}`;
  rawDb.connector_events.push({
    id: testFailedEventId,
    tenant_id: 'tenant-1',
    type: 'test.webhook',
    status: 'dead_letter',
    attempt_count: 5,
    error: 'Connection timed out',
    received_at: new Date().toISOString()
  });
  fs.writeFileSync('data.json', JSON.stringify(rawDb, null, 2));

  // Attempt to replay a 'completed' job -> must be rejected with 400
  const rReplayCompleted = await fetch(`${base}/api/superadmin/dlq/${testCompletedEventId}/replay`, {
    method: 'POST',
    headers: { 'Cookie': restoredCookie }
  });
  assert.equal(rReplayCompleted.status, 400, 'Replaying completed event must be rejected with 400');

  // Replay a 'dead_letter' job -> must succeed with 200
  const rReplayFailed = await fetch(`${base}/api/superadmin/dlq/${testFailedEventId}/replay`, {
    method: 'POST',
    headers: { 'Cookie': restoredCookie }
  });
  assert.equal(rReplayFailed.status, 200, 'Replaying dead_letter job must succeed');
  const replayResult = await rReplayFailed.json();
  assert.equal(replayResult.replayed, true);

  // Clean up mock events
  const dbAfterDlq = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  dbAfterDlq.connector_events = dbAfterDlq.connector_events.filter(e => e.id !== testCompletedEventId && e.id !== testFailedEventId);
  fs.writeFileSync('data.json', JSON.stringify(dbAfterDlq, null, 2));
  console.log('✓ 13. DLQ replay status validation guard (rejecting completed jobs) verified');

  // 14. Global Platform Audit Logs API
  const rAuditLogs = await fetch(`${base}/api/superadmin/audit-logs`, {
    headers: { 'Cookie': restoredCookie }
  });
  assert.equal(rAuditLogs.status, 200);
  const auditLogs = await rAuditLogs.json();
  assert(Array.isArray(auditLogs), 'Audit logs must return an array');
  assert(auditLogs.length > 0, 'Audit logs must contain recorded superadmin events');
  console.log('✓ 14. Global Platform Audit Logs API endpoint verified');

  // 15. Negative / Invalid MRR Validation
  const rInvalidMrr = await fetch(`${base}/api/superadmin/tenants/tenant-1`, {
    method: 'PATCH',
    headers: { 'Cookie': restoredCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mrr: -5000 })
  });
  assert.equal(rInvalidMrr.status, 400, 'Negative MRR must be rejected with 400');

  const rNanMrr = await fetch(`${base}/api/superadmin/tenants/tenant-1`, {
    method: 'PATCH',
    headers: { 'Cookie': restoredCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mrr: 'not-a-number' })
  });
  assert.equal(rNanMrr.status, 400, 'Non-numeric MRR must be rejected with 400');
  console.log('✓ 15. Negative and NaN MRR validation guards verified');

  // 16. Tenant-2 Deletion Safeguard
  const rDelTenant2 = await fetch(`${base}/api/superadmin/tenants/tenant-2`, {
    method: 'DELETE',
    headers: { 'Cookie': restoredCookie }
  });
  assert.equal(rDelTenant2.status, 400, 'tenant-2 root workspace must be protected against deletion');
  console.log('✓ 16. Protected root tenant safeguard (tenant-2 protection) verified');

  // 17. Enterprise Parity Routes Superadmin Access
  const rSuperBlueprints = await fetch(`${base}/api/blueprints`, {
    method: 'POST',
    headers: { 'Cookie': restoredCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from_stage: 'Discovery', to_stage: 'Proposal' })
  });
  assert.notEqual(rSuperBlueprints.status, 403, 'Platform superadmin must not be denied access (403) to blueprints');

  const rSuperFls = await fetch(`${base}/api/settings/fls`, {
    method: 'POST',
    headers: { 'Cookie': restoredCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity: 'lead', field: 'revenue', role: 'salesperson', permission: 'read' })
  });
  assert.notEqual(rSuperFls.status, 403, 'Platform superadmin must not be denied access (403) to FLS configuration');
  console.log('✓ 17. Superadmin access to enterprise blueprints & FLS configuration verified');

  console.log('\n=============================================================');
  console.log('🎉 ALL 17 SUPERADMIN CONTROL PLANE TESTS PASSED SUCCESSFULLY!');
  console.log('=============================================================');
}

run().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
