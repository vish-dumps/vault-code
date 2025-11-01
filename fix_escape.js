const fs = require('fs');

const filePath = process.argv[2];
console.log('Reading:', filePath);

const content = fs.readFileSync(filePath, 'utf8');
console.log('File size:', content.length, 'bytes');

// Count literal \n
const matches = content.match(/\\n/g);
console.log('Found literal \\n count:', matches ? matches.length : 0);

if (matches && matches.length > 0) {
    // Show first few occurrences
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
        if (line.includes('\\n')) {
            console.log(`Line ${idx + 1} has literal \\n`);
            console.log('Preview:', line.substring(0, 100));
        }
    });
    
    // Fix by replacing literal \n with actual newlines
    const fixed = content.replace(/\\n/g, '\n');
    fs.writeFileSync(filePath + '.fixed', fixed, 'utf8');
    console.log('Fixed file saved to:', filePath + '.fixed');
}
