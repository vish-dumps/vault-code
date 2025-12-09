import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

// Path pointing to where we verified the file IS:
const pemPath = path.resolve('client/public/extension/CodeVaultSmartSaver.pem');

console.log('Reading from:', pemPath);

try {
    const pem = fs.readFileSync(pemPath, 'utf8');
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const body = pem.substring(pem.indexOf(pemHeader) + pemHeader.length, pem.indexOf(pemFooter));
    const cleanBody = body.replace(/\n/g, '').replace(/\r/g, ''); // Ensure newlines are gone
    const buffer = Buffer.from(cleanBody, 'base64');

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const id = hash.slice(0, 32).split('').map(c => {
        const val = parseInt(c, 16);
        return String.fromCharCode(97 + val);
    }).join('');

    console.log('EXTENSION_ID_FINAL:' + id);
} catch (e) {
    console.error('Error:', e);
}
