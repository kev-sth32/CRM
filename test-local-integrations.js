/**
 * test-local-integrations.js
 * Verification suite for:
 * 1. Bikram Sambat (BS) / Gregorian (AD) Dual Calendar Engine
 * 2. Fonepay & eSewa Instant QR Payment Webhooks & Deal Progression
 * 3. Prometheus /metrics Scrape Endpoint
 * 4. AES-256-GCM Cryptographic Secret Storage
 * 5. Static Delivery of bs-calendar.js
 */

const http = require('http');
const assert = require('assert');
const bsCalendar = require('./bs-calendar');
const cryptoStorage = require('./crypto-storage');

const PORT = 3000;

function request(options, data = null) {
  options.headers = Object.assign({
    'x-test-bypass': (process.env.TEST_BYPASS_SECRET || 'salesos-internal-test'),
    'x-tenant-id': 'tenant-1'
  }, options.headers || {});

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });
    req.on('error', reject);
    if (data) {
      if (typeof data === 'object' && !Buffer.isBuffer(data)) {
        req.write(JSON.stringify(data));
      } else {
        req.write(data);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('Starting Local Integrations & Observability Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function record(name, ok, details = '') {
    if (ok) {
      console.log(`  âœ“ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  âœ— FAIL: ${name} - ${details}`);
      failed++;
    }
  }

  // --- Test 1: Bikram Sambat (BS) Calendar Calculations ---
  try {
    const testDate = '2026-09-05';
    const bs = bsCalendar.toBS(testDate);
    const dual = bsCalendar.formatDualDate(testDate);
    const fiscal = bsCalendar.getNepaliFiscalYear(testDate);

    record('BS Calendar accurately converts 2026-09-05 AD to Bhadra 19, 2083 BS',
      bs.year === 2083 && bs.monthName === 'Bhadra' && bs.day === 19,
      `Calculated: Year ${bs.year}, Month ${bs.monthName}, Day ${bs.day}`
    );

    record('BS Calendar formats rich dual date badge string',
      typeof dual === 'string' && dual.includes('2083') && dual.includes('Bhadra') && dual.includes('2026-09-05'),
      `Formatted dual: ${dual}`
    );

    record('BS Calendar computes Nepal Fiscal Year (Shrawan 1 to Ashadh)',
      fiscal === 'FY 2083/84',
      `Calculated: ${fiscal}`
    );
  } catch (err) {
    record('BS Calendar Calculations', false, err.message);
  }

  // --- Test 2: Dual Calendar API Endpoint ---
  try {
    const res = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/calendar/dual-date?date=2026-09-05',
      method: 'GET'
    });

    record('GET /api/calendar/dual-date returns 200 with structured BS/AD payload',
      res.statusCode === 200 && res.json && res.json.ok === true && res.json.formatted_dual.includes('2083'),
      `Status ${res.statusCode}, Body: ${res.body}`
    );
  } catch (err) {
    record('Dual Calendar API Endpoint', false, err.message);
  }

  // --- Test 3: Static Asset Delivery of bs-calendar.js ---
  try {
    const res = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/bs-calendar.js',
      method: 'GET'
    });

    record('GET /bs-calendar.js serves client-side calendar script with JavaScript MIME type',
      res.statusCode === 200 && res.headers['content-type'].includes('application/javascript') && res.body.includes('BS_MONTH_DAYS'),
      `Status ${res.statusCode}, Content-Type: ${res.headers['content-type']}`
    );
  } catch (err) {
    record('Static Delivery of bs-calendar.js', false, err.message);
  }

  // --- Test 4: Fonepay Instant Payment Callback & Automated Deal Advancement ---
  try {
    // 1. Create a deal
    const dealRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/opportunities',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Kathmandu Retail POS Migration',
      amount: 120000,
      stage: 'Negotiation',
      probability: 70
    });

    const deal = dealRes.json;
    assert(deal && deal.id, 'Deal creation failed');

    // 2. Create a quote linked to the deal
    const quoteRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/quotes',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      title: 'Commercial Quote for Retail POS',
      deal_id: deal.id,
      deal_title: deal.name,
      customer_name: 'Bhatbhateni Agro Supply',
      customer_email: 'finance@bhatbhateni.np',
      total: 135600,
      currency: 'NPR',
      status: 'Sent'
    });

    const quote = quoteRes.json;
    assert(quote && quote.id, 'Quote creation failed');

    // 3. Send Fonepay payment webhook callback
    const fonepayRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/webhooks/fonepay',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      quote_id: quote.id,
      PRN: quote.id,
      amount: 135600,
      status: 'SUCCESS',
      UID: 'FP-TEST-TXN-8811',
      BID: 'NABIL_BANK_NP'
    });

    record('POST /api/webhooks/fonepay reconciles payment and returns 200 OK',
      fonepayRes.statusCode === 200 && fonepayRes.json && fonepayRes.json.status === 'Paid' && fonepayRes.json.deal_advanced === true,
      `Status ${fonepayRes.statusCode}, Body: ${fonepayRes.body}`
    );

    // 4. Verify deal was advanced to Closed Won
    const updatedDealRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/opportunities/${deal.id}`,
      method: 'GET'
    });

    record('Fonepay payment reconciliation automatically advances linked deal to Closed Won',
      updatedDealRes.json && updatedDealRes.json.stage === 'Closed Won' && updatedDealRes.json.probability === 100,
      `Deal Stage: ${updatedDealRes.json ? updatedDealRes.json.stage : 'null'}, Prob: ${updatedDealRes.json ? updatedDealRes.json.probability : 'null'}`
    );
  } catch (err) {
    record('Fonepay Payment Ingestion', false, err.message);
  }

  // --- Test 5: eSewa Instant Payment Callback & Automated Deal Advancement ---
  try {
    // 1. Create another deal and quote
    const dealRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/opportunities',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Pokhara Resort AI Automation',
      amount: 95000,
      stage: 'Proposal Sent',
      probability: 50
    });

    const deal = dealRes.json;

    const quoteRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/quotes',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      title: 'Resort Guest Engine Quote',
      deal_id: deal.id,
      deal_title: deal.name,
      customer_name: 'Lakeside Grand Resort',
      customer_email: 'gm@lakesideresort.np',
      total: 107350,
      currency: 'NPR',
      status: 'Sent'
    });

    const quote = quoteRes.json;

    // 2. Send eSewa payment webhook callback
    const esewaRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/webhooks/esewa',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      quote_id: quote.id,
      pid: quote.id,
      amt: 107350,
      status: 'COMPLETE',
      refId: 'ESEWA-TXN-774411'
    });

    record('POST /api/webhooks/esewa reconciles mobile wallet payment and marks Quote as Paid',
      esewaRes.statusCode === 200 && esewaRes.json && esewaRes.json.status === 'Paid' && esewaRes.json.deal_advanced === true,
      `Status ${esewaRes.statusCode}, Body: ${esewaRes.body}`
    );

    // 3. Verify deal was advanced to Closed Won
    const updatedDealRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/opportunities/${deal.id}`,
      method: 'GET'
    });

    record('eSewa payment reconciliation automatically advances linked deal to Closed Won',
      updatedDealRes.json && updatedDealRes.json.stage === 'Closed Won' && updatedDealRes.json.probability === 100,
      `Deal Stage: ${updatedDealRes.json ? updatedDealRes.json.stage : 'null'}, Prob: ${updatedDealRes.json ? updatedDealRes.json.probability : 'null'}`
    );
  } catch (err) {
    record('eSewa Payment Ingestion', false, err.message);
  }

  // --- Test 6: Prometheus /metrics Scrape Endpoint ---
  try {
    const res = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/metrics',
      method: 'GET'
    });

    const body = res.body;
    record('GET /metrics returns 200 OK with Prometheus exposition format',
      res.statusCode === 200 && body.includes('salesos_http_requests_total') && body.includes('salesos_http_request_duration_ms_bucket'),
      `Status ${res.statusCode}, Snippet: ${body.substring(0, 120)}`
    );

    record('Prometheus metrics include memory gauges and active SSE client counters',
      body.includes('process_resident_memory_bytes') && body.includes('salesos_active_sse_clients'),
      `Body contains expected memory & SSE metrics`
    );
  } catch (err) {
    record('Prometheus Metrics Scrape Endpoint', false, err.message);
  }

  // --- Test 7: AES-256-GCM Cryptographic Storage ---
  try {
    const rawSecret = 'whsec_secret_production_webhook_key_super_secure';
    const encrypted = cryptoStorage.encrypt(rawSecret);
    const decrypted = cryptoStorage.decrypt(encrypted);

    record('CryptoStorage encrypts secret with AES-256-GCM envelope and decrypts reliably',
      encrypted.startsWith('enc::') && encrypted !== rawSecret && decrypted === rawSecret,
      `Encrypted: ${encrypted.substring(0, 30)}..., Decrypted: ${decrypted}`
    );

    const tampered = encrypted.slice(0, -4) + 'ffff';
    const tamperedResult = cryptoStorage.decrypt(tampered);

    record('CryptoStorage fails safely with locked placeholder on tampered ciphertext',
      tamperedResult === '[ENCRYPTED_SECRET_LOCKED]',
      `Tampered result: ${tamperedResult}`
    );
  } catch (err) {
    record('AES-256-GCM Cryptographic Storage', false, err.message);
  }

  // --- Summary ---
  console.log('\n----------------------------------------------------');
  console.log(`Local Integrations Summary: Passed: ${passed} | Failed: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
