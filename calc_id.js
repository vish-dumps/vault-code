import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const pemPath = path.resolve('client/public/extension/CodeVaultSmartSaver.pem');
const outPath = path.resolve('id_out.txt');

try {
    if (!fs.existsSync(pemPath)) {
        fs.writeFileSync(outPath, `PEM file not found at ${pemPath}`);
        process.exit(1);
    }
    const pem = fs.readFileSync(pemPath, 'utf8');
    const publicKey = crypto.createPublicKey(pem);
    const der = publicKey.export({ format: 'der', type: 'spki' });
    const hash = crypto.createHash('sha256').update(der).digest('hex');
    const id = hash.slice(0, 32).split('').map(c => {
        const val = parseInt(c, 16);
        return String.fromCharCode(97 + val);
    }).join('');

    fs.writeFileSync(outPath, id);
    console.log('Written ID to ' + outPath);
} catch (e) {
    fs.writeFileSync(outPath, 'Error: ' + e.message);
}
