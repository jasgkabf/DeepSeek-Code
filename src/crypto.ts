import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_PREFIX = 'enc:';

function deriveKey(): Buffer {
  const os = require('os');
  const machineId = os.hostname() + os.userInfo().username + process.platform;
  return crypto.createHash('sha256').update(machineId).digest();
}

function deriveIv(): Buffer {
  const os = require('os');
  const ivSeed = os.hostname() + 'deepseek-code-iv-salt';
  return crypto.createHash('md5').update(ivSeed).digest();
}

export function encrypt(text: string): string {
  if (!text) return text;
  const key = deriveKey();
  const iv = deriveIv();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return ENCRYPTION_PREFIX + encrypted;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedText;
  }
  try {
    const key = deriveKey();
    const iv = deriveIv();
    const encrypted = encryptedText.slice(ENCRYPTION_PREFIX.length);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedText;
  }
}

export function isEncrypted(value: string): boolean {
  return !!value && value.startsWith(ENCRYPTION_PREFIX);
}
