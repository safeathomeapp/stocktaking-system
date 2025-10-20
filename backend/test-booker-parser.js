const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function parseSupplierInvoicePDF(buffer) {
  let parser;
  try {
    parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText();
    const text = pdfData.text;

    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    // === HEADER EXTRACTION ===

    // Extract supplier name (usually near the top)
    let supplierName = null;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i];
      if (line.match(/limited|ltd|plc|uk|suppliers?|booker/i) && line.length > 5 && line.length < 80) {
        supplierName = line;
        break;
      }
    }

    // Extract invoice number (INVOICE NUMBER followed by 7 digits)
    let invoiceNumber = null;
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];
      const invoiceMatch = line.match(/INVOICE\s+(?:NUMBER|NO)[:\s]*(\d{7})/i);
      if (invoiceMatch) {
        invoiceNumber = invoiceMatch[1];
        console.log('Found invoice number:', invoiceNumber);
        break;
      }
    }

    // Extract invoice date
    let invoiceDate = null;
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];
      const dateMatch = line.match(/(?:DATE|DATED?)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i) ||
                       line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);

      if (dateMatch) {
        const dateParts = dateMatch[1].split(/[\/\-]/);
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, '0');
          const month = dateParts[1].padStart(2, '0');
          let year = dateParts[2];

          // Handle 2-digit years (YY)
          if (year.length === 2) {
            const currentYear = new Date().getFullYear();
            const currentCentury = Math.floor(currentYear / 100) * 100;
            const twoDigitYear = parseInt(year);

            // Assume 20xx for years 00-30, 19xx for years 31-99
            if (twoDigitYear <= 30) {
              year = (currentCentury + twoDigitYear).toString();
            } else {
              year = (currentCentury - 100 + twoDigitYear).toString();
            }
          }

          invoiceDate = `${year}-${month}-${day}`;
          console.log('Found invoice date:', invoiceDate);
          break;
        }
      }
    }

    // Extract customer account number
    let customerNumber = null;
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];
      const accountMatch = line.match(/(?:ACCOUNT|CUSTOMER|A\/C)(?:\s+(?:NUMBER|NO|NUM|#))?[:\s]*(\d{5,10})/i);
      if (accountMatch) {
        customerNumber = accountMatch[1];
        console.log('Found customer number:', customerNumber);
        break;
      }
    }

    // Extract delivery number if present
    let deliveryNumber = null;
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];
      const deliveryMatch = line.match(/DELIVERY\s+(?:NUMBER|NO|NOTE)[:\s]*(\d+)/i);
      if (deliveryMatch) {
        deliveryNumber = deliveryMatch[1];
        console.log('Found delivery number:', deliveryNumber);
        break;
      }
    }

    // === PRODUCT EXTRACTION (BOOKER-SPECIFIC) ===
    const products = [];
    let lineCount = 0;
    let skippedLines = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // BOOKER SPECIFIC: Only parse lines starting with 6-digit numeric
      const startsWithSixDigits = /^\d{6}/.test(line);

      if (!startsWithSixDigits) {
        if (line.match(/£?(\d+\.\d{2})/)) {
          skippedLines++;
        }
        continue;
      }

      lineCount++;

      // Look for lines with price patterns
      const priceMatch = line.match(/£?(\d+\.\d{2})/g);

      if (priceMatch && line.length > 10) {
        const sku = line.substring(0, 6);
        const remainder = line.substring(6).trim();
        const parts = remainder.split(/\s{2,}/);

        let productName = parts[0] || remainder.split(/\s+/).slice(0, 3).join(' ');

        const packSizeMatch = remainder.match(/(\d+)\s*x\s*(\d+(?:ml|g|cl|l|kg))/i);

        let packSize = '';
        let unitSize = '';

        if (packSizeMatch) {
          packSize = packSizeMatch[1];
          unitSize = packSizeMatch[2];
          productName = productName.replace(/\d+\s*x\s*\d+(?:ml|g|cl|l|kg)/i, '').trim();
        } else {
          const sizeMatch = remainder.match(/([\d.]+(?:ml|g|cl|l|kg))/i);
          if (sizeMatch) {
            unitSize = sizeMatch[1];
            packSize = '1';
          }
        }

        const prices = priceMatch.map(p => parseFloat(p.replace('£', '')));
        const unitPrice = prices[0] || 0;

        const qtyMatch = remainder.match(/\s+(\d+)\s+£?[\d.]+/);
        const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

        if (productName.length > 2) {
          products.push({
            sku: sku,
            name: productName,
            packSize: packSize,
            unitSize: unitSize,
            unitCost: unitPrice,
            quantity: quantity
          });
        }
      }
    }

    console.log(`\n📊 Parsing Statistics:`);
    console.log(`  Lines starting with 6 digits: ${lineCount}`);
    console.log(`  Lines with prices but no 6-digit SKU: ${skippedLines} (skipped)`);
    console.log(`  Products extracted: ${products.length}\n`);

    return {
      supplierName: supplierName || 'Unknown Supplier',
      invoiceNumber: invoiceNumber,
      invoiceDate: invoiceDate,
      customerNumber: customerNumber,
      deliveryNumber: deliveryNumber,
      products: products,
      totalPages: pdfData.total || 1
    };

  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}

async function test() {
  const pdfPath = path.join('C:', 'Users', 'kevth', 'Downloads', 'Booker-Invoice-3504502 (1).pdf');

  if (!fs.existsSync(pdfPath)) {
    console.error('❌ PDF file not found:', pdfPath);
    return;
  }

  console.log('🔍 Testing Booker Invoice Parser\n');
  console.log('📄 File:', pdfPath, '\n');

  const buffer = fs.readFileSync(pdfPath);
  const result = await parseSupplierInvoicePDF(buffer);

  console.log('✅ HEADER INFORMATION:');
  console.log(`  Supplier: ${result.supplierName}`);
  console.log(`  Invoice Number: ${result.invoiceNumber || 'NOT FOUND'}`);
  console.log(`  Invoice Date: ${result.invoiceDate || 'NOT FOUND'}`);
  console.log(`  Customer Number: ${result.customerNumber || 'NOT FOUND'}`);
  console.log(`  Delivery Number: ${result.deliveryNumber || 'NOT FOUND'}`);
  console.log(`  Total Products: ${result.products.length}\n`);

  if (result.products.length > 0) {
    console.log('📦 FIRST 5 PRODUCTS:');
    result.products.slice(0, 5).forEach((product, index) => {
      console.log(`\n  ${index + 1}. ${product.name}`);
      console.log(`     SKU: ${product.sku}`);
      console.log(`     Pack: ${product.packSize || '?'} x ${product.unitSize || '?'}`);
      console.log(`     Price: £${product.unitCost.toFixed(2)} x ${product.quantity}`);
    });
  }
}

test();
