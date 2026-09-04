/**
 * crypto-storage.js
 * AES-256-GCM Cryptographic Storage Engine
 * Protects tenant API keys, webhook secrets, and OAuth tokens at rest with Authenticated Encryption.
 */

const crypto = require('crypto');

class CryptoStorage {
  constructor() {
    const rawSecret = process.env.ENCRYPTION_SECRET || 'salesos_master_envelope_key_32_bytes_long!';
    // Ensure 32 bytes key via SHA-256
    this.key = crypto.createHash('sha256').update(rawSecret).digest();
  }

  /**
   * Encrypts plaintext string using AES-256-GCM
   * @param {string} text
   * @returns {string} iv:tag:ciphertext (hex)
   */
  encrypt(text) {
    if (!text || typeof text !== 'string') return text;
    if (text.startsWith('enc::')) return text; // Already encrypted

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return `enc::${iv.toString('hex')}:${tag}:${encrypted}`;
  }

  /**
   * Decrypts an AES-256-GCM string
   * @param {string} encryptedText
   * @returns {string} plaintext
   */
  decrypt(encryptedText) {
    if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
    if (!encryptedText.startsWith('enc::')) return encryptedText; // Not encrypted

    try {
      const parts = encryptedText.slice(5).split(':');
      if (parts.length !== 3) return encryptedText;

      const [ivHex, tagHex, cipherHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (_) {
      // In case of tampering or key mismatch, return placeholder
      return '[ENCRYPTED_SECRET_LOCKED]';
    }
  }
}

module.exports = new CryptoStorage();
