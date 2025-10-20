const fs = require('fs');
const path = require('path');
const { extractTextFromScannedPDF, parseOCRInvoiceText } = require('./utils/ocrParser');

async function testOCR(pdfPath) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing OCR on: ${path.basename(pdfPath)}`);
  console.log('='.repeat(80));

  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const extracted = await extractTextFromScannedPDF(pdfBuffer);

    console.log(`\nPages: ${extracted.pageCount}`);
    console.log(`\nExtracted Text (first 2000 chars):\n${'-'.repeat(80)}`);
    console.log(extracted.text.substring(0, 2000));

    const parsed = parseOCRInvoiceText(extracted.text);
    console.log(`\n\nParsed Header:\n${'-'.repeat(80)}`);
    console.log(JSON.stringify(parsed.header, null, 2));

    console.log(`\n\nDetected Items (first 10):\n${'-'.repeat(80)}`);
    parsed.items.slice(0, 10).forEach((item, i) => {
      console.log(`${i + 1}. ${item.description} | Qty: ${item.quantity} | Unit: ${item.unitPrice} | Total: ${item.totalPrice}`);
    });

    console.log(`\n\nTotal lines extracted: ${parsed.lines.length}`);
    console.log(`Total items detected: ${parsed.items.length}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Test with first invoice
async function main() {
  const invoicePath = 'C:\\Users\\kevth\\Downloads\\Invoices\\0337_001.pdf';
  await testOCR(invoicePath);
}

main();
