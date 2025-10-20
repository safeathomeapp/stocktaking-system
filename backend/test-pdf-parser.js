const fs = require('fs');
const path = require('path');
const { extractTextFromPDF, parseInvoiceText, convertToTableFormat } = require('./utils/pdfParser');

async function testPDF(pdfPath) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${path.basename(pdfPath)}`);
  console.log('='.repeat(80));

  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const extracted = await extractTextFromPDF(pdfBuffer);

    console.log(`\nPages: ${extracted.pages}`);
    console.log(`\nRaw Text (first 1000 chars):\n${'-'.repeat(80)}`);
    console.log(extracted.text.substring(0, 1000));

    const parsed = parseInvoiceText(extracted.text);
    console.log(`\n\nParsed Header:\n${'-'.repeat(80)}`);
    console.log(JSON.stringify(parsed.header, null, 2));

    console.log(`\n\nDetected Items (first 10):\n${'-'.repeat(80)}`);
    parsed.items.slice(0, 10).forEach((item, i) => {
      console.log(`${i + 1}. ${item.description} | Qty: ${item.quantity} | Price: ${item.price}`);
    });

    const table = convertToTableFormat(parsed);
    console.log(`\n\nTable Format (first 5 rows):\n${'-'.repeat(80)}`);
    table.slice(0, 6).forEach(row => {
      console.log(row.join(' | '));
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test with all invoice PDFs
async function main() {
  const invoicesDir = 'C:\\Users\\kevth\\Downloads\\Invoices';
  const files = fs.readdirSync(invoicesDir).filter(f => f.endsWith('.pdf'));

  for (const file of files) {
    await testPDF(path.join(invoicesDir, file));
  }
}

main();
