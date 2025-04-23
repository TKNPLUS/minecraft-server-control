// decrypt.js — helper to load decrypted config
const crypto = require('crypto');
const fs = require('fs');
module.exports = function() {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
  const { iv, data } = JSON.parse(fs.readFileSync('config.enc.json', 'utf8'));
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'base64'));
  let dec = decipher.update(data, 'base64', 'utf8');
  dec += decipher.final('utf8');
  return JSON.parse(dec);
};
