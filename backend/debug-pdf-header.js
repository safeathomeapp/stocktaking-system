const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function debugPDF() {
  const pdfPath = path.join('C:', 'Users', 'kevth', 'Downloads', 'Booker-Invoice-3504502 (1).pdf');
  const buffer = fs.readFileSync(pdfPath);

  const parser = new PDFParse({ data: buffer });
  const pdfData = await parser.getText();
  const text = pdfData.text;
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  console.log('🔍 First 40 lines of PDF (looking for date):\n');

  for (let i = 0; i < Math.min(40, lines.length); i++) {
    const line = lines[i];

    // Highlight lines that might contain dates
    const hasDate = line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/) ||
                    line.match(/\d{1,2}\s+\w+\s+\d{4}/) ||
                    line.match(/DATE/i);

    if (hasDate) {
      console.log(`${i}: ⭐ ${line}`);
    } else {
      console.log(`${i}: ${line}`);
    }
  }

  await parser.destroy();
}

debugPDF();
