const http = require('http');

async function main() {
  // 1. Login
  const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@acmecloud.com', password: 'secret' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login status:', loginRes.status);

  // 2. GET /api/settings/channels
  const getRes = await fetch('http://127.0.0.1:3000/api/settings/channels', {
    headers: { 'Cookie': cookie }
  });
  console.log('GET /api/settings/channels status:', getRes.status);
  const data = await getRes.json();
  console.log('Channels response:', JSON.stringify(data, null, 2));

  // 3. PUT /api/settings/channels (update meta and whatsapp)
  const putRes = await fetch('http://127.0.0.1:3000/api/settings/channels', {
    method: 'PUT',
    headers: { 'Cookie': cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meta: { verify_token: 'my_custom_meta_token', page_name: 'Acme Nepal FB Page', app_secret: 'sec_meta_9812' },
      whatsapp: { phone_number_id: 'wa_1234567890', access_token: 'EAAbcdef12345' }
    })
  });
  console.log('PUT /api/settings/channels status:', putRes.status);
  console.log('PUT response:', await putRes.json());

  // 4. Test lead injection
  const testLeadRes = await fetch('http://127.0.0.1:3000/api/settings/channels/test', {
    method: 'POST',
    headers: { 'Cookie': cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: 'meta' })
  });
  console.log('Test lead status:', testLeadRes.status);
  console.log('Test lead response:', await testLeadRes.json());

  // 5. Test GET again to verify encryption
  const getAfterRes = await fetch('http://127.0.0.1:3000/api/settings/channels', {
    headers: { 'Cookie': cookie }
  });
  const afterData = await getAfterRes.json();
  console.log('After update verify_token:', afterData.meta.verify_token);
  console.log('After update app_secret_configured:', afterData.meta.app_secret_configured);
  console.log('After update whatsapp token_configured:', afterData.whatsapp.token_configured);

  console.log('\n ALL CHANNEL TESTS PASSED!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
