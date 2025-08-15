const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex').slice(0, 32)
  : crypto.randomBytes(32);
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

function encrypt(text = '') {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let enc = cipher.update(text, 'utf8');
  enc = Buffer.concat([enc, cipher.final()]);
  return `${iv.toString('hex')}:${enc.toString('hex')}`;
}

function decrypt(text = '') {
  if (!text) return text;
  const [ivHex, dataHex] = text.split(':');
  if (!ivHex || !dataHex) return text;
  const iv = Buffer.from(ivHex, 'hex');
  const buf = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let dec = decipher.update(buf);
  dec = Buffer.concat([dec, decipher.final()]);
  return dec.toString('utf8');
}

module.exports = { encrypt, decrypt };