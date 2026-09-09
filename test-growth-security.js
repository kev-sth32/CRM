/**
 * test-growth-security.js
 * Verification suite for Phase 3:
 * 1. Multi-Channel WhatsApp Follow-up Execution
 * 2. Viral Referral Growth Links on Public Quotes
 * 3. Secret Encryption at Rest
 * 4. Content Security Policy Headers
 * 5. Dark Mode CSS Token Definitions
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { prepareFollowup } = require('./followup-execution');
const cryptoStorage = require('./crypto-storage');

const PORT = 3000;

function request(pathStr) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: '127.0.0.1',
      port: PORT,
      path: pathStr,
      headers: {
        'x-test-bypass': (process.env.TEST_BYPASS_SECRET || 'salesos-internal-test'),
        'x-tenant-id': 'tenant-1'
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('Starting Growth & Security Verification Suite');
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

  // --- Test 1: Automated WhatsApp Follow-up Execution ---
  try {
    const waContext = {
      channel: 'whatsapp',
      phone: '+977-9801234567',
      message: 'Namaste! Are you ready to review the SalesOS proposal?',
      withinWorkingHours: true,
      optedOut: false,
      status: 'active'
    };
    const waResult = prepareFollowup(waContext);

    record('Automated WhatsApp follow-up prepares sanitized phone and template payload',
      waResult.ready === true && waResult.channel === 'whatsapp' && waResult.recipient === '+9779801234567' && waResult.payload.text.includes('Namaste'),
      `Result: ${JSON.stringify(waResult)}`
    );

    const waBlocked = prepareFollowup({ ...waContext, optedOut: true });
    record('WhatsApp follow-up strictly honors customer opt-outs',
      waBlocked.ready === false && waBlocked.reason === 'opted_out',
      `Reason: ${waBlocked.reason}`
    );

    const waOutsideHours = prepareFollowup({ ...waContext, withinWorkingHours: false });
    record('WhatsApp follow-up blocks messages outside working hours',
      waOutsideHours.ready === false && waOutsideHours.reason === 'outside_working_hours',
      `Reason: ${waOutsideHours.reason}`
    );
  } catch (err) {
    record('WhatsApp Follow-up Execution', false, err.message);
  }

  // --- Test 2: Viral Referral Banner in Public Proposal Page ---
  try {
    const res = await request('/quote-view.html');
    const hasViralBanner = res.body.includes('Powered by SalesOS') && res.body.includes('onboarding.html?ref=quote_viral');
    const hasDualCalendarScript = res.body.includes('bs-calendar.js');
    const hasPaymentQR = res.body.includes('Instant QR Payment') && res.body.includes('nepalQrImage');

    record('Public Quote View embeds viral referral banner driving product-led growth',
      res.statusCode === 200 && hasViralBanner,
      `Status ${res.statusCode}, Contains viral banner: ${hasViralBanner}`
    );

    record('Public Quote View integrates Bikram Sambat calendar and Nepal QR payments',
      hasDualCalendarScript && hasPaymentQR,
      `BS Calendar: ${hasDualCalendarScript}, QR Payments: ${hasPaymentQR}`
    );
  } catch (err) {
    record('Viral Referral Banner', false, err.message);
  }

  // --- Test 3: Secret Encryption at Rest ---
  try {
    const sensitiveSecrets = [
      'whsec_live_55a29819bf',
      'eaab_meta_graph_token_live_123',
      'fonepay_merchant_pass_live_887'
    ];

    let allPassed = true;
    for (const sec of sensitiveSecrets) {
      const encrypted = cryptoStorage.encrypt(sec);
      const decrypted = cryptoStorage.decrypt(encrypted);
      if (decrypted !== sec || !encrypted.startsWith('enc::')) {
        allPassed = false;
      }
    }

    record('AES-256-GCM successfully wraps and unwraps sensitive tenant keys and webhook secrets',
      allPassed,
      `Verified across ${sensitiveSecrets.length} secret keys`
    );
  } catch (err) {
    record('Secret Encryption at Rest', false, err.message);
  }

  // --- Test 4: Content Security Policy & Security Headers ---
  try {
    const res = await request('/api/health');
    const csp = res.headers['content-security-policy'];
    const xcto = res.headers['x-content-type-options'];
    const xfo = res.headers['x-frame-options'];

    record('Security headers enforced with strict nosniff, SAMEORIGIN, and CSP',
      xcto === 'nosniff' && xfo === 'SAMEORIGIN' && typeof csp === 'string' && csp.includes("default-src 'self'"),
      `CSP: ${csp ? csp.substring(0, 50) : 'none'}...`
    );
  } catch (err) {
    record('Security Headers', false, err.message);
  }

  // --- Test 5: Dark Mode CSS Tokens ---
  try {
    const cssPath = path.join(__dirname, 'app.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    const hasDarkTheme = css.includes('[data-theme="dark"]') &&
      css.includes('--bg: #090d16') &&
      css.includes('--panel: #111827') &&
      css.includes('--ink: #f8fafc');

    const hasMobileTableCards = css.includes('.table-card-mobile') &&
      css.includes('@media (max-width: 640px)');

    record('app.css declares comprehensive [data-theme="dark"] tokens and mobile card layout',
      hasDarkTheme && hasMobileTableCards,
      `Dark Theme: ${hasDarkTheme}, Mobile Cards: ${hasMobileTableCards}`
    );
  } catch (err) {
    record('Dark Mode CSS Tokens', false, err.message);
  }

  // --- Summary ---
  console.log('\n----------------------------------------------------');
  console.log(`Growth & Security Summary: Passed: ${passed} | Failed: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
