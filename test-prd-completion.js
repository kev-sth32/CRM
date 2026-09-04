/**
 * Automated Test Suite: PRD Fulfillment & Advanced Capability Verification
 * Validates PRD Sections 3, 4, 19, 24, 38, 41, 46, 47, 55, 58
 */

const assert = require('assert');

(async () => {
  console.log('Running SalesOS PRD Completion & Advanced Capability Verification...');
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

  // Check 1: 12-Step Business Configuration Wizard Status & Complete (PRD §46)
  const rOnboardStatus = await fetch(`${base}/api/onboarding/status`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert.equal(rOnboardStatus.status, 200);
  const statusData = await rOnboardStatus.json();
  assert(statusData.step !== undefined, 'Onboarding step must be reported');

  const rOnboardComplete = await fetch(`${base}/api/onboarding/complete`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_name: 'Acme AI Global Solutions',
      industry: 'saas',
      currency: 'USD',
      timezone: 'America/New_York',
      working_hours: '08:00 - 18:00 (EST)',
      ai_persona: {
        name: 'Aria Tech Advisor',
        tone: 'consultative',
        language: 'English, Nepali, Hindi',
        mode: 'copilot'
      }
    })
  });
  assert.equal(rOnboardComplete.status, 200, 'Onboarding complete must succeed');
  const onboardRes = await rOnboardComplete.json();
  assert(onboardRes.success, 'Onboarding success flag must be true');
  console.log('✓ 1. 12-Step Business Configuration Wizard status & completion verified (PRD §46)');

  // Check 2: Industry Templates Listing (PRD §3, §47)
  const rTemplates = await fetch(`${base}/api/templates`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert.equal(rTemplates.status, 200);
  const templates = await rTemplates.json();
  assert(Array.isArray(templates));
  const expectedTemplates = ['saas', 'real_estate', 'education', 'hospitality', 'automobile', 'agency'];
  expectedTemplates.forEach(tid => {
    assert(templates.some(t => t.id === tid), `Industry template ${tid} must exist in registry`);
  });
  console.log(`✓ 2. Industry vertical templates registry (${templates.length} templates) verified (PRD §47)`);

  // Check 3: One-Click Industry Template Application (PRD §47, §58)
  const rApplyTemplate = await fetch(`${base}/api/templates/apply`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template_id: 'real_estate',
      seed_products: true
    })
  });
  assert.equal(rApplyTemplate.status, 200);
  const appliedData = await rApplyTemplate.json();
  assert(appliedData.success, 'Template application must succeed');
  assert.equal(appliedData.applied_template.id, 'real_estate');
  assert(appliedData.applied_template.pipeline_stages.includes('Site Visit Scheduled'));

  // Verify settings were updated to Real Estate
  const rSettings = await fetch(`${base}/api/settings`, { headers: { 'Cookie': sessionCookie } });
  const updatedSettings = await rSettings.json();
  assert.equal(updatedSettings.industry, 'real_estate');
  assert(updatedSettings.sales_stages.includes('Site Visit Scheduled'));
  console.log('✓ 3. One-click vertical template application & pipeline reconfiguration verified (PRD §47, §58)');

  // Check 4: Meta WhatsApp Cloud API Webhook Handshake & Inbound Message (PRD §4, §38)
  const rWaHandshake = await fetch(`${base}/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=salesos-whatsapp-verify&hub.challenge=test_challenge_12345`);
  assert.equal(rWaHandshake.status, 200);
  const challengeBody = await rWaHandshake.text();
  assert.equal(challengeBody, 'test_challenge_12345', 'WhatsApp webhook challenge must be echoed back');

  const waMessageId = `wamid-${Date.now()}`;
  const rWaInbound = await fetch(`${base}/api/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'tenant-1' },
    body: JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { phone_number_id: '10987654321' },
            contacts: [{ profile: { name: 'Kiran Gurung' } }],
            messages: [{
              id: waMessageId,
              from: '+9779801234567',
              timestamp: String(Math.floor(Date.now() / 1000)),
              type: 'text',
              text: { body: 'Inquiring about 3BHK penthouse unit availability' }
            }]
          }
        }]
      }]
    })
  });
  assert.equal(rWaInbound.status, 202, 'WhatsApp inbound message must be accepted');
  console.log('✓ 4. Meta WhatsApp Cloud API handshake & message ingestion verified (PRD §4, §38)');

  // Check 5: SMS Omnichannel & Opt-Out Keyword Enforcement (PRD §4, §16, §38)
  const rSmsInbound = await fetch(`${base}/api/webhooks/sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'tenant-1' },
    body: JSON.stringify({
      From: '+9779841122334',
      Body: 'STOP',
      MessageSid: `SM-${Date.now()}`
    })
  });
  assert.equal(rSmsInbound.status, 202);
  const smsRes = await rSmsInbound.json();
  assert.equal(smsRes.is_opt_out, true, 'STOP keyword must trigger opt-out flag');
  console.log('✓ 5. SMS Omnichannel connector & opt-out keyword enforcement verified (PRD §4, §16)');

  // Check 6: Telephony & AI Call Intelligence (PRD §19)
  const rCallWebhook = await fetch(`${base}/api/webhooks/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'tenant-1' },
    body: JSON.stringify({
      call_id: `CA-${Date.now()}`,
      from: '+9779851098765',
      to: '+97714234567',
      duration_seconds: 245,
      recording_url: 'https://cdn.salesos.io/recordings/call-998.mp3',
      transcript: 'Customer expressed high interest in 50 licenses. The price seems a little expensive for their Q3 budget, but they love the feature set. They requested a formal quotation and requested a follow up call next Tuesday.'
    })
  });
  assert.equal(rCallWebhook.status, 201, 'Call webhook must be processed');
  const callRes = await rCallWebhook.json();
  assert(callRes.activity, 'Call activity must be created');
  assert(callRes.intelligence.objections.includes('Budget / Price Sensitivity'), 'Objection must be extracted');
  assert(callRes.intelligence.buyingSignals.includes('Requested formal pricing proposal'), 'Buying signal must be captured');
  console.log('✓ 6. Telephony connector & AI Call Intelligence transcript analysis verified (PRD §19)');

  // Check 7: AI Daily Sales Manager & Morning Briefing (PRD §24, §41)
  const rDailyBrief = await fetch(`${base}/api/ai/daily-brief`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert.equal(rDailyBrief.status, 200);
  const brief = await rDailyBrief.json();
  assert(brief.narrative, 'Executive narrative must be generated');
  assert(brief.metrics, 'Pipeline metrics must be present');
  assert(Array.isArray(brief.recommendations), 'Recommendations array must be present');
  console.log('✓ 7. AI Daily Sales Manager & Morning Briefing Engine verified (PRD §24, §41)');

  // Check 8: AI Conversation Evaluation & Quality Feedback (PRD §55)
  const rPostEval = await fetch(`${base}/api/ai/evaluations`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating: 'good',
      category: 'qualification',
      feedback: 'Accurately captured BANT qualification parameters.'
    })
  });
  assert.equal(rPostEval.status, 201);

  const rGetEvals = await fetch(`${base}/api/ai/evaluations`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert.equal(rGetEvals.status, 200);
  const evalData = await rGetEvals.json();
  assert(evalData.summary.total >= 1, 'Evaluation summary must record evaluation');
  assert(evalData.summary.good >= 1, 'Good rating count must increment');
  assert(evalData.trends.length >= 1, 'Evaluation trends must be computed');
  console.log('✓ 8. AI Conversation Quality Review & Evaluation System verified (PRD §55)');

  // Check 9: UI Route Accessibility (All 20 UI Views)
  const uiRoutes = [
    '/index.html', '/inbox.html', '/leads.html', '/contacts.html', '/companies.html',
    '/deals.html', '/products.html', '/tasks.html', '/campaigns.html',
    '/automations.html', '/reports.html', '/quotes.html', '/quote-view.html',
    '/approvals.html', '/settings.html', '/superadmin.html', '/login.html',
    '/reset-password.html', '/workspace.html', '/onboarding.html'
  ];
  for (const route of uiRoutes) {
    const res = await fetch(`${base}${route}`);
    assert.equal(res.status, 200, `UI route ${route} must return HTTP 200 OK`);
  }
  console.log(`✓ 9. All ${uiRoutes.length} UI routes and views verified returning 200 OK`);

  console.log('\n======================================================');
  console.log('🎉 ALL PRD ADVANCED CAPABILITIES VERIFIED SUCCESSFULLY!');
  console.log('======================================================');
})().catch(err => {
  console.error('\n❌ PRD Completion Verification Failed:', err);
  process.exit(1);
});
