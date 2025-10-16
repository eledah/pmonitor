const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting debug scraper run...');

// Run the scraper and capture output
const scraper = spawn('node', ['webScraping.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let lineCount = 0;
const maxLines = 100; // Show first 100 lines

scraper.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach(line => {
    if (lineCount < maxLines) {
      console.log(line);
      lineCount++;
      output += line + '\n';
    }
  });

  if (lineCount >= maxLines) {
    console.log(`\n📋 ... (showing first ${maxLines} lines, full output captured)`);
    scraper.kill();
  }
});

scraper.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

scraper.on('close', (code) => {
  console.log(`\n🏁 Scraper exited with code ${code}`);

  // Save full output to file for analysis
  fs.writeFileSync('debug-output.log', output);
  console.log('💾 Full output saved to debug-output.log');
});
