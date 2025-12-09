import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

// Adjusted path since we moved the file
const pemPath = path.resolve('extension/CodeVaultSmartSaver.pem');

if (!fs.existsSync(pemPath)) {
    console.error(`PEM file not found at ${pemPath}`);
    process.exit(1);
}

const pem = fs.readFileSync(pemPath, 'utf8');
// DER extraction from PEM
const pemHeader = "-----BEGIN PUBLIC KEY-----";
const pemFooter = "-----END PUBLIC KEY-----";
const pemContents = pem.substring(pem.indexOf(pemHeader) + pemHeader.length, pem.indexOf(pemFooter));
const buffer = Buffer.from(pemContents.replace(/\n/g, ''), 'base64');

const hash = crypto.createHash('sha256').update(buffer).digest('hex');
const id = hash.slice(0, 32).split('').map(c => {
    const val = parseInt(c, 16);
    return String.fromCharCode(97 + val);
}).join('');

console.log('EXTENSION_ID_RESULT:' + id);
