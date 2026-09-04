const assert = require('assert');

(async () => {
  const base = 'http://localhost:3000';
  console.log('Running SalesOS Enterprise Parity Test Suite (Quotes, E-Sign, Custom Fields, Webhooks)...');

  // Authenticate
  const rLogin = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@acmecloud.com', password: 'secret' })
  });
  assert.equal(rLogin.status, 200);
  const cookie = rLogin.headers.get('set-cookie');
  const authHeaders = { 'Cookie': cookie, 'Content-Type': 'application/json' };

  // 1. Create a Test Deal to link to Quote
  const rDeal = await fetch(`${base}/api/opportunities`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'CPQ Enterprise Deal',
      name: 'CPQ Enterprise Deal',
      company: 'Everest FinTech Labs',
      stage: 'Proposal',
      amount: 450000
    })
  });
  assert.equal(rDeal.status, 201);
  const deal = await rDeal.json();
  assert(deal.id);

  // 2. Create Quote with Line Items
  const rQuoteCreate = await fetch(`${base}/api/quotes`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Commercial Proposal for Everest FinTech',
      deal_id: deal.id,
      deal_title: deal.title || deal.name,
      customer_name: 'Everest FinTech Labs',
      customer_email: 'procurement@everestfintech.np',
      discount_pct: 10,
      tax_rate: 13,
      terms: 'Net 30 days. Full cloud deployment included.',
      line_items: [
        { name: 'SalesOS Growth Plan (Annual)', sku: 'SOS-GROWTH', qty: 5, price: 36000 },
        { name: 'Custom API Webhook Connector Setup', sku: 'SOS-SETUP', qty: 1, price: 50000 }
      ]
    })
  });
  assert.equal(rQuoteCreate.status, 201);
  const quote = await rQuoteCreate.json();
  assert.equal(quote.status, 'Draft');
  assert(quote.quote_number.startsWith('QT-'));
  // Subtotal = (5*36000) + 50000 = 180000 + 50000 = 230000
  assert.equal(quote.subtotal, 230000);
  // Discount 10% = 23000, Taxable = 207000, Tax 13% = 26910, Total = 233910
  assert.equal(quote.discount_amount, 23000);
  assert.equal(quote.total, 233910);
  console.log('✓ CPQ Quote creation, calculations & line item aggregation passed');

  // 3. Digital E-Signature & Automatic Deal Advancement (Public customer acceptance)
  const rSign = await fetch(`${base}/api/quotes/${quote.id}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signer_name: 'Sanjeev Shrestha (CTO)',
      signature_data: 'data:image/png;base64,sample_signature_digital_stream'
    })
  });
  assert.equal(rSign.status, 200);
  const signResult = await rSign.json();
  assert.equal(signResult.quote.status, 'Signed');
  assert(signResult.quote.signed_at);

  // Check that linked Deal was automatically advanced to 'Closed Won'
  const rDealCheck = await fetch(`${base}/api/opportunities/${deal.id}`, { headers: { 'Cookie': cookie } });
  assert.equal(rDealCheck.status, 200);
  const updatedDeal = await rDealCheck.json();
  assert.equal(updatedDeal.stage, 'Closed Won');
  console.log('✓ Public E-Signature acceptance & automated deal advancement to "Closed Won" passed');

  // 4. Custom Fields Engine
  const rAddCf = await fetch(`${base}/api/settings/custom-fields`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      entity: 'deals',
      label: 'Security Clearance Level',
      field_name: 'sec_clearance',
      type: 'select',
      options: ['Level 1', 'Level 2', 'Level 3'],
      required: true
    })
  });
  assert.equal(rAddCf.status, 201);
  const cf = await rAddCf.json();
  assert.equal(cf.field_name, 'sec_clearance');

  const rListCf = await fetch(`${base}/api/settings/custom-fields`, { headers: { 'Cookie': cookie } });
  assert.equal(rListCf.status, 200);
  const allCf = await rListCf.json();
  assert(allCf.some(f => f.id === cf.id));

  const rDelCf = await fetch(`${base}/api/settings/custom-fields/${cf.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookie }
  });
  assert.equal(rDelCf.status, 200);
  console.log('✓ No-Code Custom Fields definition, listing, and deletion passed');

  // 5. Webhooks & Zapier Integration Engine
  const rAddWh = await fetch(`${base}/api/settings/webhooks`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Automated Test Webhook',
      url: 'https://httpbin.org/post',
      events: ['deal_won', 'quote_signed']
    })
  });
  assert.equal(rAddWh.status, 201);
  const wh = await rAddWh.json();
  assert(wh.secret.startsWith('whsec_'));

  const rListWh = await fetch(`${base}/api/settings/webhooks`, { headers: { 'Cookie': cookie } });
  assert.equal(rListWh.status, 200);
  const allWh = await rListWh.json();
  assert(allWh.some(w => w.id === wh.id));

  const rDelWh = await fetch(`${base}/api/settings/webhooks/${wh.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookie }
  });
  assert.equal(rDelWh.status, 200);
  console.log('✓ Outbound Webhook registration, HMAC key generation, and management passed');

  // 6. Verify HTML pages
  const rQuotesPage = await fetch(`${base}/quotes.html`);
  assert.equal(rQuotesPage.status, 200);
  const rQuoteViewPage = await fetch(`${base}/quote-view.html`);
  assert.equal(rQuoteViewPage.status, 200);
  console.log('✓ Quotes directory and public customer sign-off pages delivered successfully');

  // Clean up
  await fetch(`${base}/api/opportunities/${deal.id}`, { method: 'DELETE', headers: { 'Cookie': cookie } });

  console.log('\n🎉 ALL ENTERPRISE PARITY VERIFICATIONS PASSED!\n');
})().catch(err => {
  console.error('Enterprise Test Failed:', err);
  process.exit(1);
});
