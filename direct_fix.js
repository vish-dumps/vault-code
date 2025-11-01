const fs = require('fs');

const file = 'E:\\VaultCode\\client\\src\\pages\\community\\friends.tsx';

// Read
let data = fs.readFileSync(file, {encoding: 'utf8', flag: 'r'});

// Backup
fs.writeFileSync(file + '.bak', data);

// Show what we're fixing
const hasLiteralNewline = data.includes('\\n');
console.log('Has literal \\n:', hasLiteralNewline);

if (hasLiteralNewline) {
    // Count them
    const count = (data.match(/\\n/g) || []).length;
    console.log('Count of literal \\n:', count);
    
    // Replace literal \n with actual newline
    data = data.replace(/\\n/g, '\n');
    
    // Write back
    fs.writeFileSync(file, data);
    console.log('FIXED! Replaced', count, 'literal \\n sequences');
} else {
    console.log('No literal \\n found');
}
