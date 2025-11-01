const fs = require('fs');
const path = require('path');

const filePath = 'E:\\VaultCode\\client\\src\\pages\\community\\friends.tsx';

console.log('=== Starting Fix Process ===\n');

try {
    // Read file with different encodings
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
        console.log('✓ Read file successfully with UTF-8');
    } catch (e) {
        console.log('✗ UTF-8 failed, trying latin1');
        content = fs.readFileSync(filePath, 'latin1');
    }
    
    console.log(`File size: ${content.length} characters`);
    
    // Split into lines
    const lines = content.split(/\r?\n/);
    console.log(`Total lines: ${lines.length}\n`);
    
    // Show lines around 212
    console.log('=== Content around line 212 ===');
    for (let i = 210; i <= 214 && i < lines.length; i++) {
        const lineContent = lines[i];
        console.log(`Line ${i + 1} (${lineContent.length} chars):`);
        console.log(lineContent.substring(0, 120));
        
        // Check for literal \n
        if (lineContent.includes('\\n')) {
            console.log('  ⚠️  Contains literal \\n');
        }
        console.log('');
    }
    
    // Create backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content, 'utf8');
    console.log(`✓ Backup created: ${backupPath}\n`);
    
    // Fix: Replace literal \n with actual newlines in the problematic section
    // The error shows the onSuccess callback has literal \n characters
    let fixed = content;
    
    // Pattern: Find onSuccess callbacks with literal \n
    const pattern = /onSuccess:\s*\([^)]*\)\s*=>\s*\{\\n/g;
    if (pattern.test(content)) {
        console.log('✓ Found literal \\n in onSuccess callback');
        fixed = content.replace(/\\n/g, '\n');
        console.log('✓ Replaced all literal \\n with actual newlines\n');
    }
    
    // Write fixed content
    if (fixed !== content) {
        fs.writeFileSync(filePath, fixed, 'utf8');
        console.log('✓ File fixed and saved!');
        console.log('\nPlease restart your Vite dev server.');
    } else {
        console.log('ℹ No literal \\n found to fix.');
    }
    
} catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
}
