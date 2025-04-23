// encrypt.js — AES-256-CBC encryption of JSON credentials
const crypto = require('crypto');
const fs = require('fs');
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
const iv = crypto.randomBytes(16);
const data = {
  ssh: {
    host: '59.106.208.116',
    port: 22,
    username: 'ubuntu',
    passphrase: 'Tkn.2021'
  },
  users: [
    { username: 'guest', password: 'guestpassword', role: 'guest' },
    { username: 'TKNSIGMA', password: 'Tkn.202142265954', role: 'admin' }
  ]
};
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
let enc = cipher.update(JSON.stringify(data), 'utf8', 'base64');
enc += cipher.final('base64');
fs.writeFileSync('config.enc.json', JSON.stringify({ iv: iv.toString('base64'), data: enc }));
console.log('Encrypted config written to config.enc.json');
