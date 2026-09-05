async function run() {
  console.log('Testing Knowledge Base RAG API Endpoints...');

  // 1. Authenticate
  const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@acmecloud.com', password: 'secret' })
  });

  if (!loginRes.ok) throw new Error('Login failed: ' + loginRes.status);
  const cookie = loginRes.headers.get('set-cookie');
  console.log('✅ Authenticated successfully');

  // 2. GET /api/knowledge
  const listRes = await fetch('http://127.0.0.1:3000/api/knowledge', {
    headers: { 'Cookie': cookie }
  });

  if (!listRes.ok) throw new Error('GET /api/knowledge failed: ' + listRes.status);
  const docs = await listRes.json();
  if (!Array.isArray(docs)) throw new Error('Expected array of documents');
  console.log(`✅ GET /api/knowledge returned ${docs.length} document(s)`);

  // 3. POST /api/knowledge with long text to verify chunking
  const longPolicy = 'This is an enterprise policy document for testing SalesOS RAG memory chunking. '.repeat(15);
  const createRes = await fetch('http://127.0.0.1:3000/api/knowledge', {
    method: 'POST',
    headers: { 'Cookie': cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Automated Test Policy ' + Date.now(),
      category: 'Compliance',
      content: longPolicy
    })
  });

  if (createRes.status !== 201) throw new Error('POST /api/knowledge failed: ' + createRes.status);
  const newDoc = await createRes.json();
  console.log(`✅ POST /api/knowledge created document "${newDoc.title}" with ${newDoc.chunks_count} chunk(s)`);
  if (!newDoc.chunks_count || newDoc.chunks_count < 2) {
    throw new Error(`Expected >= 2 chunks for long text, got ${newDoc.chunks_count}`);
  }

  // 4. DELETE /api/knowledge/:id
  const delRes = await fetch(`http://127.0.0.1:3000/api/knowledge/${newDoc.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookie }
  });

  if (!delRes.ok) throw new Error('DELETE /api/knowledge/:id failed: ' + delRes.status);
  const delBody = await delRes.json();
  if (!delBody.ok) throw new Error('Delete response not ok');
  console.log(`✅ DELETE /api/knowledge/${newDoc.id} succeeded`);

  console.log('\n🎉 ALL KNOWLEDGE BASE API TESTS PASSED!');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
