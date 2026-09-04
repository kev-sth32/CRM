const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string' || !stored.startsWith('scrypt:')) return false;
  const parts = stored.split(':');
  if (parts.length !== 3) return false;
  const [, salt, expected] = parts;
  if (!salt || !expected) return false;

  try {
    const actual = crypto.scryptSync(password, salt, 64).toString('hex');
    const bufA = Buffer.from(actual, 'hex');
    const bufB = Buffer.from(expected, 'hex');
    // Pre-check buffer lengths to avoid unhandled RangeError in crypto.timingSafeEqual
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (e) {
    return false;
  }
}

function token() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { hashPassword, verifyPassword, token };
