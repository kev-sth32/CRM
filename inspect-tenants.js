const fs = require('fs');
const d = JSON.parse(fs.readFileSync('data.json', 'utf8'));
console.log('=== ALL TENANTS & THEIR USERS ===');
(d.tenants || []).forEach(t => {
  const users = (d.users || []).filter(u => u.tenant_id === t.id);
  console.log('Tenant:', t.name, '| ID:', t.id, '| Slug:', t.slug);
  if (users.length === 0) {
    console.log('  ⚠️ NO USERS EXIST FOR THIS TENANT IN data.json!');
  } else {
    users.forEach(u => console.log('  -', u.name, `(${u.email})`, 'Role:', u.role, 'HasPasswordHash:', Boolean(u.password_hash)));
  }
});
