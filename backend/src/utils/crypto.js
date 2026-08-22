const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
// Use the hex key directly or convert from string buffer
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); 
const IV_LENGTH = 16; 

exports.encrypt = (text) => {
  if (!text) return text;
  // If it's already encrypted (contains ':'), return it
  if (text.includes(':')) {
    const parts = text.split(':');
    if (parts.length === 2 && parts[0].length === 32) return text;
  }
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

exports.decrypt = (text) => {
  if (!text) return text;
  
  const textParts = text.split(':');
  if (textParts.length !== 2) return text;
  
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};
