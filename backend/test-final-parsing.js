// Final comprehensive test of the updated parser
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function testFinalParsing() {
  const pdfPath = path.join('C:', 'Users', 'kevth', 'Downloads', 'Booker-Invoice-3504502 (1).pdf');
  const buffer = fs.readFileSync(pdfPath);

  const parser = new PDFParse({ data: buffer });
  const pdfData = await parser.getText();
  const text = pdfData.text;
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  console.log('🧪 FINAL PARSING TEST - Checking Specific Items\n');
  console.log('Testing the exact logic from server.js parseSupplierInvoicePDF:\n');

  const testItems = [
    { name: 'Lemons', sku: '097149' },
    { name: 'CL 40cm Black Tissue Napkin', sku: '139753' },
    { name: 'Jena White Paper Plates 15cm', sku: '308317' },
    { name: 'CLE 2 Ply Blue Centrefeed', sku: '299225' },
    { name: 'Coke Zero', sku: '063724' }
  ];

  const products = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Only parse lines starting with 6-digit numeric (Booker SKUs)
    const startsWithSixDigits = /^\d{6}/.test(line);
    if (!startsWithSixDigits) continue;

    const sku = line.substring(0, 6);

    // Only process our test items
    if (!testItems.find(item => item.sku === sku)) continue;

    const remainder = line.substring(6).trim();

    // === SMART TAB-BASED PARSING (from server.js) ===
    const tabParts = remainder.split(/\t+/);

    let packSize = '';
    let unitSize = '';
    let packSizeFieldIndex = -1;

    // Find which tab field contains the pack/size pattern "number space unit"
    for (let j = 0; j < tabParts.length; j++) {
      const field = tabParts[j].trim();
      const packAndSizeMatch = field.match(/^(\d+)\s+([\d.]+(?:ml|g|cl|l|kg|s|pk|cm))/i);

      if (packAndSizeMatch) {
        packSize = packAndSizeMatch[1];
        unitSize = packAndSizeMatch[2];
        packSizeFieldIndex = j;
        break;
      }
    }

    // Product name is everything before the pack/size field
    let productName = '';
    if (packSizeFieldIndex > 0) {
      productName = tabParts.slice(0, packSizeFieldIndex).join(' ').trim();
    } else if (tabParts.length > 0) {
      productName = tabParts[0].trim();
    }

    // Quantity is the field after pack/size
    let quantity = 1;
    if (packSizeFieldIndex >= 0 && tabParts.length > packSizeFieldIndex + 1) {
      const qtyField = tabParts[packSizeFieldIndex + 1].trim();
      const qtyNum = parseInt(qtyField);
      if (!isNaN(qtyNum)) {
        quantity = qtyNum;
      }
    }

    products.push({
      sku,
      productName,
      packSize,
      unitSize,
      quantity,
      tabCount: tabParts.length,
      packSizeFieldIndex
    });
  }

  // Display results
  products.forEach((product, index) => {
    console.log(`${index + 1}. ${product.productName}`);
    console.log(`   SKU: ${product.sku}`);
    console.log(`   Pack Size: ${product.packSize || '❌ MISSING'}`);
    console.log(`   Unit Size: ${product.unitSize || '❌ MISSING'}`);
    console.log(`   Quantity: ${product.quantity}`);
    console.log(`   Tab Fields: ${product.tabCount}, Pack/Size at index: ${product.packSizeFieldIndex}`);
    console.log('');
  });

  // Verify all items have pack and size
  const allHavePackSize = products.every(p => p.packSize && p.unitSize);
  if (allHavePackSize) {
    console.log('✅ SUCCESS! All items have pack size and unit size extracted correctly!');
  } else {
    console.log('❌ FAIL! Some items are missing pack size or unit size.');
  }

  await parser.destroy();
}

testFinalParsing().catch(console.error);
