const fs = require('fs');
const path = require('path');

const filePath = 'E:\\VaultCode\\client\\src\\pages\\community\\friends.tsx';

try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`Total lines: ${lines.length}`);
    console.log('\n=== Lines 209-216 ===');
    for (let i = 209; i < Math.min(216, lines.length); i++) {
        const preview = lines[i].substring(0, 150);
        console.log(`${i + 1}: ${JSON.stringify(preview)}`);
    }
    
    // Look for literal \n sequences
    console.log('\n=== Searching for literal \\n sequences ===');
    lines.forEach((line, index) => {
        if (line.includes('\\n')) {
            console.log(`Line ${index + 1}: ${JSON.stringify(line.substring(0, 200))}`);
        }
    });
    
    // Fix the file by replacing literal \n with actual newlines
    const fixed = content.replace(/\\n/g, '\n');
    
    if (fixed !== content) {
        console.log('\n=== Found and fixing literal \\n sequences ===');
        fs.writeFileSync(filePath, fixed, 'utf8');
        console.log('File fixed successfully!');
    } else {
        console.log('\n=== No literal \\n sequences found ===');
    }
    
} catch (error) {
    console.error('Error:', error.message);
}
