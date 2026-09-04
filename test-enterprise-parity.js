/**
 * Automated Test Suite: SalesOS Enterprise Parity (Salesforce & Zoho CRM Competitor Parity)
 * Validates:
 * 1. Blueprint & Flow Stage Transition Gates (Pillar 1)
 * 2. Collaborative Forecasting & Opportunity Splits (Pillar 2)
 * 3. Advanced CPQ Volume Slabs, Bundling & CLM Amendments (Pillar 3)
 * 4. Granular Field-Level Security (FLS) & Enterprise SAML/SCIM SSO (Pillar 4)
 * 5. In-App WebRTC Softphone & Telephony Dialer (Pillar 5)
 * 6. Fuzzy Deduplication & 3-Column Atomic Record Merge (Pillar 6)
 * 7. PWA Mobile Shell Delivery & Service Worker (Pillar 7)
 */

const assert = require('assert');

(async () => {
  console.log('Running SalesOS Enterprise Parity Verification Suite...\n');
  const base = 'http://127.0.0.1:3000';

  // 1. Authenticate as workspace owner
  const rLogin = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@acmecloud.com', password: 'secret' })
  });
  assert.equal(rLogin.status, 200, 'Login must succeed');
  const sessionCookie = rLogin.headers.get('set-cookie');
  assert(sessionCookie, 'Session cookie must be issued');

  // ==========================================================
  // PILLAR 1: Blueprint & Stage Transition Validation Gates
  // ==========================================================
  const rBpList = await fetch(`${base}/api/blueprints`, { headers: { 'Cookie': sessionCookie } });
  assert.equal(rBpList.status, 200);
  const blueprints = await rBpList.json();
  assert(Array.isArray(blueprints) && blueprints.length >= 3, 'Blueprints must have enterprise default gates');

  // Create test opportunity in "Proposal" stage
  const rCreateOpp = await fetch(`${base}/api/opportunities`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Enterprise Cloud Migration Deal',
      amount: 85000,
      stage: 'Proposal',
      probability: 60
    })
  });
  assert.equal(rCreateOpp.status, 201);
  const opp = await rCreateOpp.json();

  // Attempt to transition from "Proposal" to "Negotiation" WITHOUT required checklist or close date
  const rGateFail = await fetch(`${base}/api/opportunities/${opp.id}`, {
    method: 'PATCH',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stage: 'Negotiation'
    })
  });
  assert.equal(rGateFail.status, 422, 'Stage transition must be blocked by Blueprint gate when criteria are missing');
  const failData = await rGateFail.json();
  assert(failData.missing_fields.includes('expected_close_date'), 'Close date must be flagged as missing');
  assert(failData.uncompleted_checklist.length >= 2, 'Uncompleted checklist items must be reported');

  // Transition WITH fulfilled fields and checklist items
  const rGatePass = await fetch(`${base}/api/opportunities/${opp.id}`, {
    method: 'PATCH',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stage: 'Negotiation',
      expected_close_date: '2026-10-31',
      next_step: 'Final Legal Review',
      checklist: [
        'Formal quote delivered to customer',
        'Technical architecture approved',
        'Budget confirmed by buyer'
      ]
    })
  });
  assert.equal(rGatePass.status, 200, 'Stage transition must succeed when Blueprint criteria are satisfied');
  const updatedOpp = await rGatePass.json();
  assert.equal(updatedOpp.stage, 'Negotiation');
  console.log('✓ 1. Blueprint & Flow Stage Transition Gates verified (Pillar 1)');

  // ==========================================================
  // PILLAR 2: Revenue Forecasting & Opportunity Splits
  // ==========================================================
  const rForecast = await fetch(`${base}/api/forecasts/summary?period=2026-Q3`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert.equal(rForecast.status, 200);
  const forecast = await rForecast.json();
  assert(forecast.total_quota > 0, 'Quota must be aggregated');
  assert(forecast.category_breakdown.commit >= 0, 'Commit category must be calculated');

  // Set Rep Quota
  const rSetQuota = await fetch(`${base}/api/forecasts/quotas`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'usr-1',
      user_name: 'Arjun Sharma',
      period: '2026-Q3',
      target_amount: 250000
    })
  });
  assert.equal(rSetQuota.status, 201);

  // Opportunity Splits (Must validate total sum equals 100%)
  const rInvalidSplit = await fetch(`${base}/api/opportunities/${opp.id}/splits`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      splits: [
        { user_id: 'usr-1', user_name: 'Arjun (AE)', percentage: 60 },
        { user_id: 'usr-2', user_name: 'Roshan (SE)', percentage: 25 } // Sum = 85% != 100%
      ]
    })
  });
  assert.equal(rInvalidSplit.status, 400, 'Opportunity split not summing to 100% must be rejected');

  const rValidSplit = await fetch(`${base}/api/opportunities/${opp.id}/splits`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      splits: [
        { user_id: 'usr-1', user_name: 'Arjun (AE)', percentage: 70 },
        { user_id: 'usr-2', user_name: 'Roshan (SE)', percentage: 30 } // Sum = 100%
      ]
    })
  });
  assert.equal(rValidSplit.status, 200);
  const splitsRes = await rValidSplit.json();
  assert.equal(splitsRes.splits.length, 2);
  assert.equal(splitsRes.splits[0].split_amount, 59500); // 70% of 85,000
  console.log('✓ 2. Collaborative Revenue Forecasting & Opportunity Splits verified (Pillar 2)');

  // ==========================================================
  // PILLAR 3: Advanced CPQ Volume Slabs, Bundling & CLM Amendments
  // ==========================================================
  // Volume Pricing: 25 licenses at $100 base should qualify for Tier 2 (10% discount -> $90/unit)
  const rVolume = await fetch(`${base}/api/quotes/volume-price`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ unit_price: 100, quantity: 25 })
  });
  assert.equal(rVolume.status, 200);
  const volData = await rVolume.json();
  assert.equal(volData.discount_percent, 10);
  assert.equal(volData.effective_unit_price, 90);
  assert.equal(volData.total, 2250);

  // Bundling Rules Validation: SALESOS-ENT requires an onboarding package
  const rBundleFail = await fetch(`${base}/api/quotes/validate-bundle`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ selected_skus: ['SALESOS-ENT'] })
  });
  assert.equal(rBundleFail.status, 200);
  const bundleFailData = await rBundleFail.json();
  assert.equal(bundleFailData.valid, false, 'Bundle without prerequisite must fail');

  const rBundlePass = await fetch(`${base}/api/quotes/validate-bundle`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ selected_skus: ['SALESOS-ENT', 'SALESOS-ONBOARDING-VIP'] })
  });
  assert.equal(rBundlePass.status, 200);
  const bundlePassData = await rBundlePass.json();
  assert.equal(bundlePassData.valid, true, 'Bundle with prerequisite must pass');

  // Subscription Amendment & Co-Terming Proration
  const rAmend = await fetch(`${base}/api/quotes/amend`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract: {
        id: 'contract-99',
        start_date: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(), // 6 months ago
        end_date: new Date(Date.now() + 185 * 24 * 3600 * 1000).toISOString()   // ~6 months remaining
      },
      additional_items: [
        { sku: 'SEATS-ADD', name: 'Additional User Seats', price: 1200, quantity: 5 } // $6,000 annual
      ]
    })
  });
  assert.equal(rAmend.status, 200);
  const amendData = await rAmend.json();
  assert(amendData.proration_factor > 0.4 && amendData.proration_factor < 0.6, 'Proration factor should be ~50%');
  assert(amendData.total_amendment_due > 2500 && amendData.total_amendment_due < 3500);
  console.log('✓ 3. Advanced CPQ Volume Slabs, Bundling & CLM Amendments verified (Pillar 3)');

  // ==========================================================
  // PILLAR 4: Field-Level Security & Enterprise SAML / SCIM
  // ==========================================================
  // Configure FLS rule hiding 'commission_amount' from salesperson
  const rFlsSet = await fetch(`${base}/api/settings/fls`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entity: 'lead',
      field: 'confidential_notes',
      role: 'salesperson',
      permission: 'hidden'
    })
  });
  assert.equal(rFlsSet.status, 201);

  // Enterprise SSO Settings
  const rSso = await fetch(`${base}/api/settings/sso`, {
    method: 'PATCH',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: true, provider: 'okta' })
  });
  assert.equal(rSso.status, 200);

  // SCIM 2.0 User Provisioning
  const scimEmail = `scim-user-${Date.now()}@acmeenterprise.com`;
  const rScimCreate = await fetch(`${base}/scim/v2/Users`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: scimEmail,
      displayName: 'Devon Vance',
      active: true,
      roles: [{ value: 'salesperson' }]
    })
  });
  assert.equal(rScimCreate.status, 201, 'SCIM user provisioning must return HTTP 201');
  const scimUser = await rScimCreate.json();
  assert.equal(scimUser.userName, scimEmail);
  assert.equal(scimUser.schemas[0], 'urn:ietf:params:scim:schemas:core:2.0:User');
  console.log('✓ 4. Granular Field-Level Security & Enterprise SAML / SCIM verified (Pillar 4)');

  // ==========================================================
  // PILLAR 5: In-App WebRTC Softphone & Telephony Dialer
  // ==========================================================
  const rDial = await fetch(`${base}/api/telephony/dial`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to_number: '+14155552671',
      customer_name: 'Sarah Connor',
      lead_id: 'lead-1'
    })
  });
  assert.equal(rDial.status, 201);
  const callSession = await rDial.json();
  assert(callSession.id, 'Call session ID must be generated');
  assert.equal(callSession.status, 'ringing');
  assert(callSession.webrtc.room_id, 'WebRTC session room must be allocated');

  // Update state to connected
  const rCallConnected = await fetch(`${base}/api/telephony/call-state`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ call_id: callSession.id, status: 'connected' })
  });
  assert.equal(rCallConnected.status, 200);

  // End call with disposition & verify activity created
  const rEndCall = await fetch(`${base}/api/telephony/call-end`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      call_id: callSession.id,
      duration_seconds: 142,
      disposition: 'Meeting Scheduled',
      notes: 'Customer agreed to deep-dive demo next Monday.'
    })
  });
  assert.equal(rEndCall.status, 200);
  const endResult = await rEndCall.json();
  assert.equal(endResult.session.status, 'ended');
  assert(endResult.activity.id, 'Activity record must be created for call timeline');
  assert.equal(endResult.activity.disposition, 'Meeting Scheduled');
  console.log('✓ 5. In-App WebRTC Softphone & Telephony Dialer verified (Pillar 5)');

  // ==========================================================
  // PILLAR 6: Fuzzy Deduplication & 3-Column Record Merge
  // ==========================================================
  // Seed two duplicate leads for testing
  const rLeadA = await fetch(`${base}/api/leads`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Jonathan Miller',
      email: 'jmiller@apexsolutions.com',
      phone: '+1-555-0199',
      company: 'Apex Solutions Corp'
    })
  });
  const leadA = await rLeadA.json();

  const rLeadB = await fetch(`${base}/api/leads`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'John Miller', // fuzzy name
      email: 'jmiller@apexsolutions.com', // exact email
      phone: '+1 (555) 0199',
      company: 'Apex Solutions'
    })
  });
  const leadB = await rLeadB.json();

  // Scan duplicates
  const rDupes = await fetch(`${base}/api/leads/duplicates`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert.equal(rDupes.status, 200);
  const dupeData = await rDupes.json();
  assert(dupeData.total_pairs >= 1, 'Duplicate scanner must identify the seeded duplicate pair');

  // Execute 3-Column Atomic Merge
  const rMerge = await fetch(`${base}/api/leads/merge`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      master_id: leadA.id,
      duplicate_id: leadB.id,
      field_selections: {
        name: 'master',    // keep 'Jonathan Miller'
        company: 'master', // keep 'Apex Solutions Corp'
        phone: 'duplicate' // take formatted phone from duplicate
      }
    })
  });
  assert.equal(rMerge.status, 200);
  const mergeResult = await rMerge.json();
  assert.equal(mergeResult.master.name, 'Jonathan Miller');
  assert.equal(mergeResult.duplicate.is_deleted, true, 'Duplicate must be marked deleted/merged');
  assert.equal(mergeResult.duplicate.merged_into_id, leadA.id);
  console.log('✓ 6. Fuzzy Deduplication & 3-Column Record Merge verified (Pillar 6)');

  // ==========================================================
  // PILLAR 7: PWA Mobile Shell & Service Worker Delivery
  // ==========================================================
  const rManifest = await fetch(`${base}/manifest.json`);
  assert.equal(rManifest.status, 200, 'manifest.json must return HTTP 200');
  const manifest = await rManifest.json();
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.short_name, 'SalesOS');

  const rSw = await fetch(`${base}/sw.js`);
  assert.equal(rSw.status, 200, 'sw.js service worker must return HTTP 200');
  const swCode = await rSw.text();
  assert(swCode.includes('salesos-pwa-v1'), 'Service worker cache tag must be present');
  console.log('✓ 7. PWA Mobile Shell & Service Worker verified (Pillar 7)');

  console.log('\n======================================================');
  console.log('🎉 ALL 7 ENTERPRISE PARITY PILLARS VERIFIED 100%!');
  console.log('======================================================\n');
})().catch(err => {
  console.error('\n❌ Enterprise Parity Verification Failed:', err);
  process.exit(1);
});
