import crypto from 'crypto';
import fs from 'fs';

// Create sample license
const licenseData = {
  client: "Monza TECH Owner",
  email: "samer@monzasal.com",
  issued: new Date().toISOString(),
  expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
  version: "1.0",
  features: ["full_access", "offline_mode"]
};

const encryptedData = Buffer.from(JSON.stringify(licenseData)).toString('base64');
const signature = crypto.createHash('sha256').update(encryptedData + 'MONZA_SECRET_KEY').digest('hex');
const licenseKey = `${encryptedData}.${signature}`;

fs.writeFileSync('dist-electron/win-unpacked/license.key', licenseKey);
console.log('License created successfully in dist-electron/win-unpacked/license.key');
console.log('License details:');
console.log(licenseData);
