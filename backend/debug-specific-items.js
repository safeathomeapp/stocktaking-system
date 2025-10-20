const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function debugItems() {
  const pdfPath = path.join('C:', 'Users', 'kevth', 'Downloads', 'Booker-Invoice-3504502 (1).pdf');
  const buffer = fs.readFileSync(pdfPath);

  const parser = new PDFParse({ data: buffer });
  const pdfData = await parser.getText();
  const text = pdfData.text;
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  console.log('🔍 Looking for specific items:\n');

  const searchTerms = ['Lemons', 'napkin', 'Paper Plates', 'Centrefeed'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line starts with 6 digits
    if (/^\d{6}/.test(line)) {
      // Check if it contains any of our search terms
      for (const term of searchTerms) {
        if (line.toLowerCase().includes(term.toLowerCase())) {
          console.log(`\n${i}: ${line}`);
          console.log(`   Starts with: ${line.substring(0, 6)} (SKU)`);
          console.log(`   Rest: "${line.substring(6).trim()}"`);
        }
      }
    }
  }

  await parser.destroy();
}

debugItems();
