const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function extract() {
  const pdfPath = '../invoices/TSIM2074.pdf';
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  
  console.log('=== FIRST 50 LINES ===\n');
  const lines = result.text.split('\n').slice(0, 50);
  lines.forEach((line, idx) => {
    if (line.trim()) console.log(`${idx+1}: ${line}`);
  });
}

extract().catch(console.error);
