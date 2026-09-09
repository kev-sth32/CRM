const fs = require('fs');
const crypto = require('crypto');
const d = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Verify scrypt hash for password 'secret'
function verifyPassword(password, hash) {
  if (!hash || typeof hash !== 'string') return false;
  if (hash.startsWith('scrypt:')) {
    const parts = hash.split(':');
    if (parts.length !== 3) return false;
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const derived = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(expected, derived);
  }
  return false;
}

console.log('Testing users against password "secret":');
d.users.forEach(u => {
  const ok = verifyPassword('secret', u.password_hash);
  console.log(`- ${u.email.padEnd(35)} | Tenant: ${u.tenant_id.padEnd(12)} | Role: ${u.role.padEnd(12)} | Password 'secret' valid: ${ok}`);
});
