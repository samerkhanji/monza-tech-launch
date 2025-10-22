#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Configuration
const SECRET_KEY = 'MONZA_SECRET_KEY'; // In production, use a more secure key
const LICENSE_DIR = './licenses';

// Ensure licenses directory exists
if (!fs.existsSync(LICENSE_DIR)) {
  fs.mkdirSync(LICENSE_DIR);
}

function generateLicense(clientName, email, expiryMonths = 12) {
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
  
  const licenseData = {
    client: clientName,
    email: email,
    issued: new Date().toISOString(),
    expiry: expiryDate.toISOString(),
    version: '1.0',
    features: ['full_access', 'offline_mode']
  };
  
  const encryptedData = Buffer.from(JSON.stringify(licenseData)).toString('base64');
  const signature = crypto.createHash('sha256').update(encryptedData + SECRET_KEY).digest('hex');
  
  const licenseKey = `${encryptedData}.${signature}`;
  
  // Save license file
  const filename = `${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_license.key`;
  const filepath = path.join(LICENSE_DIR, filename);
  
  fs.writeFileSync(filepath, licenseKey);
  
  console.log('✅ License generated successfully!');
  console.log('📄 License Details:');
  console.log(`   Client: ${clientName}`);
  console.log(`   Email: ${email}`);
  console.log(`   Issued: ${licenseData.issued}`);
  console.log(`   Expires: ${licenseData.expiry}`);
  console.log(`   File: ${filepath}`);
  console.log('\n📋 Instructions:');
  console.log('1. Send the license file to the client');
  console.log('2. Client should place it as "license.key" in the app directory');
  console.log('3. The app will verify the license on startup');
  
  return { licenseKey, filepath, licenseData };
}

// CLI usage
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node generate-license.js <client-name> <email> [expiry-months]');
  console.log('Example: node generate-license.js "AutoShop ABC" "owner@autoshop.com" 12');
  process.exit(1);
}

const [clientName, email, expiryMonths] = args;
generateLicense(clientName, email, parseInt(expiryMonths) || 12);
