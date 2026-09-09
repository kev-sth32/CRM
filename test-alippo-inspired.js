/**
 * test-alippo-inspired.js
 * Verification suite for Alippo-inspired capabilities:
 * 1. Meta Lead Ads Webhook Ingestion (Handshake, Signature, Auto-Lead Creation)
 * 2. AI Co-Founder Ops Room Overnight Digest & Priorities
 * 3. AI Pitch & Social Ad Creative Studio (WhatsApp Nepglish/Nepali & Ad Copy)
 * 4. 1-Click WhatsApp Product Flyer with Nepal 13% VAT Calculation
 */

const http = require('http');
const crypto = require('crypto');
const assert = require('assert');

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

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
        try {
          json = JSON.parse(body);
        } catch (_) {}
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
  console.log('Starting Alippo-Inspired Verification Test Suite');
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

  // --- Test 1: Meta Lead Ads Webhook Handshake Verification ---
  try {
    const challengeStr = 'alippo_challenge_998811';
    const verifyToken = 'meta_crm_leadgen_secret_token';

    const validRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/webhooks/meta-lead-gen?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=${challengeStr}`,
      method: 'GET'
    });

    record('Meta Webhook GET Handshake with valid token returns 200 and challenge string',
      validRes.statusCode === 200 && validRes.body === challengeStr,
      `Got status ${validRes.statusCode}, body: ${validRes.body}`
    );

    const invalidRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/webhooks/meta-lead-gen?hub.mode=subscribe&hub.verify_token=WRONG_TOKEN&hub.challenge=${challengeStr}`,
      method: 'GET'
    });

    record('Meta Webhook GET Handshake with invalid token returns 403 Forbidden',
      invalidRes.statusCode === 403,
      `Got status ${invalidRes.statusCode}`
    );
  } catch (err) {
    record('Meta Webhook GET Handshake', false, err.message);
  }

  // --- Test 2: Meta Lead Ads Ingestion (POST) ---
  try {
    const testMetaPayload = {
      object: 'page',
      entry: [
        {
          id: 'fb_page_101',
          time: 1725450000,
          changes: [
            {
              field: 'leadgen',
              value: {
                created_time: 1725450000,
                leadgen_id: 'meta_lead_test_' + Date.now(),
                page_id: 'fb_page_101',
                form_id: 'form_kathmandu_sme_01',
                ad_id: 'ad_b2b_growth_camp',
                full_name: 'Anup Pokharel',
                phone_number: '+977-9801234567',
                email: 'anup.pokharel@techhimalaya.np',
                company_name: 'Himalayan Agro Exporters',
                notes: 'Interested in B2B enterprise tier and multi-currency billing'
              }
            }
          ]
        }
      ]
    };

    const payloadJson = JSON.stringify(testMetaPayload);
    // Use matching secret
    const secret = process.env.META_APP_SECRET || 'meta_app_secret_demo_key';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadJson);
    const signatureHeader = 'sha256=' + hmac.digest('hex');

    const postRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/webhooks/meta-lead-gen',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signatureHeader,
        'Content-Length': Buffer.byteLength(payloadJson)
      }
    }, payloadJson);

    record('Meta Webhook POST ingests social lead into CRM leads database',
      postRes.statusCode === 200 && postRes.json && postRes.json.received === true && postRes.json.created_leads >= 1,
      `Status ${postRes.statusCode}, body: ${postRes.body}`
    );

    // Verify lead was stored
    const leadsRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/leads?search=Anup',
      method: 'GET'
    });

    const createdLead = leadsRes.json && Array.isArray(leadsRes.json)
      ? leadsRes.json.find(l => l.email === 'anup.pokharel@techhimalaya.np')
      : null;

    record('Ingested Meta Lead contains source facebook_lead_ads and Nepal phone',
      createdLead && (createdLead.source === 'facebook_lead_ads' || createdLead.source === 'instagram_lead_ads') && createdLead.phone.includes('9801234567'),
      `Created lead: ${JSON.stringify(createdLead)}`
    );
  } catch (err) {
    record('Meta Lead Ads Ingestion', false, err.message);
  }

  // --- Test 3: AI Co-Founder Ops Room Overnight Digest Endpoint ---
  try {
    const digestRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/ai/cofounder/ops-digest',
      method: 'GET'
    });

    const isOk = digestRes.statusCode === 200 && digestRes.json && digestRes.json.ok === true;
    const metrics = digestRes.json && digestRes.json.overnight_metrics;
    const priorities = digestRes.json && digestRes.json.daily_priorities;

    record('AI Co-Founder Ops Room Digest returns 200 with structured metrics and priorities',
      isOk && metrics && typeof metrics.leads_qualified === 'number' && Array.isArray(priorities) && priorities.length > 0,
      `Got status ${digestRes.statusCode}, priorities count: ${priorities ? priorities.length : 0}`
    );

    const firstPriority = priorities && priorities[0];
    record('Ops Room priorities include actionable founder next steps with urgency badges',
      firstPriority && firstPriority.action && firstPriority.urgency,
      `Priority: ${JSON.stringify(firstPriority)}`
    );
  } catch (err) {
    record('AI Co-Founder Ops Room Digest', false, err.message);
  }

  // --- Test 4: AI Pitch Studio Generator (Nepglish & Nepali Pitch) ---
  try {
    const pitchPayload = {
      mode: 'pitch',
      lead_name: 'Bikram Thapa',
      company: 'Pokhara Trekking Hub',
      product_name: 'SalesOS Enterprise CRM',
      language: 'nepglish'
    };

    const pitchRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/ai/pitch-studio/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, pitchPayload);

    const pitchOk = pitchRes.statusCode === 200 && pitchRes.json && pitchRes.json.ok === true;
    const pitchText = pitchRes.json && pitchRes.json.pitch_text;

    record('AI Pitch Studio generates personalized Nepglish WhatsApp pitch with Nepali context',
      pitchOk && typeof pitchText === 'string' && (pitchText.toLowerCase().includes('namaste') || pitchText.toLowerCase().includes('bikram')),
      `Pitch result: ${pitchText ? pitchText.substring(0, 100) : 'null'}`
    );
  } catch (err) {
    record('AI Pitch Studio Nepglish Pitch', false, err.message);
  }

  // --- Test 5: AI Pitch Studio Ad Creative Generator ---
  try {
    const adPayload = {
      mode: 'creative',
      product_name: 'SalesOS ERP & CRM',
      platform: 'facebook',
      objective: 'lead_generation',
      target_audience: 'SME Founders & Sales Directors in Nepal'
    };

    const adRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/ai/pitch-studio/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, adPayload);

    const creativeOk = adRes.statusCode === 200 && adRes.json && adRes.json.ok === true;
    const creative = adRes.json && adRes.json.creative;

    record('AI Ad Creative Studio outputs formatted campaign copy with headline, body, and CTA',
      creativeOk && creative && creative.headline && creative.primary_text && creative.cta,
      `Creative: ${JSON.stringify(creative)}`
    );
  } catch (err) {
    record('AI Ad Creative Studio', false, err.message);
  }

  // --- Test 6: 1-Click WhatsApp Commercial Product Flyer Data ---
  try {
    // 1. Fetch products list to get an ID
    const prodListRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/products',
      method: 'GET'
    });

    let targetProd = prodListRes.json && prodListRes.json[0];
    if (!targetProd) {
      // Create a test product
      const createProdRes = await request({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/products',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, {
        name: 'Enterprise Automation Suite',
        sku: 'SUITE-ENT-01',
        category: 'Software License',
        price: 250000,
        tax_rate: 13,
        stock: 50,
        description: 'Complete ERP & CRM stack with AI Agents'
      });
      targetProd = createProdRes.json;
    }

    assert(targetProd && targetProd.id, 'Target product not found or created');

    const flyerRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/products/${targetProd.id}/flyer-data`,
      method: 'GET'
    });

    const flyerOk = flyerRes.statusCode === 200 && flyerRes.json && flyerRes.json.ok === true;
    const flyer = flyerRes.json && flyerRes.json.flyer;
    const whatsappText = flyerRes.json && flyerRes.json.whatsapp_text;

    // Verify 13% VAT calculation
    const net = flyer.unit_price;
    const expectedVat = Math.round(net * 0.13);
    const expectedGross = net + expectedVat;

    record('Product Flyer calculates exact 13% Nepal VAT and gross proposal price',
      flyerOk && flyer && flyer.vat_amount === expectedVat && flyer.gross_total === expectedGross,
      `Net: ${net}, VAT: ${flyer ? flyer.vat_amount : null} (Expected: ${expectedVat}), Gross: ${flyer ? flyer.gross_total : null}`
    );

    record('Product Flyer outputs digital proposal URL and pre-formatted WhatsApp share link',
      flyerOk && flyer.proposal_url && flyer.qr_code_url && typeof whatsappText === 'string' && whatsappText.includes('13% VAT'),
      `Proposal URL: ${flyer ? flyer.proposal_url : null}, QR: ${flyer ? flyer.qr_code_url : null}`
    );
  } catch (err) {
    record('Product Flyer with 13% Nepal VAT', false, err.message);
  }

  // --- Summary ---
  console.log('\n----------------------------------------------------');
  console.log(`Alippo Verification Summary: Passed: ${passed} | Failed: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
