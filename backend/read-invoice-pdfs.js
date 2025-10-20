const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { Pool } = require('pg');

// Railway database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:tMpkSRqsDdrbECsTJYEAfgDNBchJjCdi@caboose.proxy.rlwy.net:35214/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

// Directory containing PDF invoices (adjust as needed)
const INVOICES_DIR = path.join(__dirname, '..', 'invoices');

/**
 * Extract supplier and product information from PDF text
 * This is a basic parser - adjust regex patterns based on your actual invoice formats
 */
function parseInvoiceData(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  console.log('\n--- Raw PDF Text Preview ---');
  console.log(lines.slice(0, 30).join('\n'));
  console.log('--- End Preview ---\n');

  // Try to extract supplier name (usually near the top)
  let supplierName = null;
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i];
    // Look for common supplier patterns
    if (line.match(/limited|ltd|plc|uk|suppliers?/i) && line.length > 5 && line.length < 60) {
      supplierName = line;
      break;
    }
  }

  // Extract products - look for patterns like:
  // "Product Name    Quantity    Unit Price    Total"
  const products = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for lines with price patterns (e.g., "£12.50" or "12.50")
    const priceMatch = line.match(/£?(\d+\.\d{2})/g);

    if (priceMatch && line.length > 10) {
      // Try to extract product name, quantity, and price
      // This is a simplified parser - adjust based on your invoice format
      const parts = line.split(/\s{2,}/); // Split by 2+ spaces

      if (parts.length >= 3) {
        const productName = parts[0];
        const lastPrice = priceMatch[priceMatch.length - 1].replace('£', '');

        // Extract quantity if present
        const qtyMatch = line.match(/(\d+)\s*x/i);
        const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

        products.push({
          name: productName,
          unitCost: parseFloat(lastPrice),
          quantity: quantity
        });
      }
    }
  }

  return {
    supplierName: supplierName || 'Unknown Supplier',
    products: products
  };
}

/**
 * Process a single PDF invoice file
 */
async function processPDF(filePath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${path.basename(filePath)}`);
  console.log('='.repeat(60));

  let parser;
  try {
    const dataBuffer = fs.readFileSync(filePath);

    // pdf-parse v2 API
    parser = new PDFParse({ data: dataBuffer });
    const pdfData = await parser.getText();

    const invoiceData = parseInvoiceData(pdfData.text);

    console.log(`\nExtracted Data:`);
    console.log(`  Supplier: ${invoiceData.supplierName}`);
    console.log(`  Products found: ${invoiceData.products.length}`);

    if (invoiceData.products.length > 0) {
      console.log('\nProduct Details:');
      invoiceData.products.forEach((prod, idx) => {
        console.log(`  ${idx + 1}. ${prod.name} - £${prod.unitCost.toFixed(2)} (Qty: ${prod.quantity})`);
      });
    }

    return invoiceData;

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}

/**
 * Find or create supplier in database
 */
async function findOrCreateSupplier(client, supplierName) {
  // Check if supplier exists
  const existing = await client.query(
    'SELECT sup_id FROM suppliers WHERE sup_name ILIKE $1',
    [supplierName]
  );

  if (existing.rows.length > 0) {
    console.log(`  ✓ Found existing supplier: ${supplierName} (ID: ${existing.rows[0].sup_id})`);
    return existing.rows[0].sup_id;
  }

  // Create new supplier
  const result = await client.query(
    `INSERT INTO suppliers (sup_name, sup_active)
     VALUES ($1, true)
     RETURNING sup_id`,
    [supplierName]
  );

  console.log(`  ✓ Created new supplier: ${supplierName} (ID: ${result.rows[0].sup_id})`);
  return result.rows[0].sup_id;
}

/**
 * Add products to supplier_item_list
 */
async function addProducts(client, supplierId, products) {
  let added = 0;
  let skipped = 0;

  for (const product of products) {
    try {
      // Generate a simple SKU based on product name
      const sku = product.name.substring(0, 10).toUpperCase().replace(/\s+/g, '-');

      // Check if product already exists
      const existing = await client.query(
        `SELECT id FROM supplier_item_list
         WHERE supplier_id = $1 AND supplier_name ILIKE $2`,
        [supplierId, product.name]
      );

      if (existing.rows.length > 0) {
        console.log(`    - Skipped (exists): ${product.name}`);
        skipped++;
        continue;
      }

      // Insert new product
      await client.query(
        `INSERT INTO supplier_item_list (
          supplier_id, supplier_sku, supplier_name,
          unit_cost, case_size, active
        ) VALUES ($1, $2, $3, $4, $5, true)`,
        [supplierId, sku, product.name, product.unitCost, product.quantity || 1]
      );

      console.log(`    ✓ Added: ${product.name} (£${product.unitCost.toFixed(2)})`);
      added++;

    } catch (error) {
      console.error(`    ✗ Error adding ${product.name}:`, error.message);
    }
  }

  return { added, skipped };
}

/**
 * Main function
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('PDF Invoice Reader - Local Processing');
  console.log('='.repeat(60));

  // Check if invoices directory exists
  if (!fs.existsSync(INVOICES_DIR)) {
    console.log(`\n⚠️  Invoice directory not found: ${INVOICES_DIR}`);
    console.log('\nPlease create the directory and add PDF invoices:');
    console.log(`   mkdir "${INVOICES_DIR}"`);
    console.log(`   (Then copy your PDF invoices to this directory)`);
    console.log('\nExample structure:');
    console.log('   stocktaking-system/');
    console.log('   ├── backend/');
    console.log('   └── invoices/');
    console.log('       ├── invoice1.pdf');
    console.log('       ├── invoice2.pdf');
    console.log('       └── invoice3.pdf');
    return;
  }

  // Get all PDF files
  const files = fs.readdirSync(INVOICES_DIR)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .map(file => path.join(INVOICES_DIR, file));

  if (files.length === 0) {
    console.log(`\n⚠️  No PDF files found in: ${INVOICES_DIR}`);
    console.log('\nPlease add PDF invoice files to the directory.');
    return;
  }

  console.log(`\nFound ${files.length} PDF file(s) to process`);

  // Process all PDFs
  const results = [];
  for (const file of files) {
    const result = await processPDF(file);
    if (result) {
      results.push(result);
    }
  }

  if (results.length === 0) {
    console.log('\n⚠️  No data extracted from PDFs');
    return;
  }

  // Connect to database and insert data
  const client = await pool.connect();

  try {
    console.log('\n' + '='.repeat(60));
    console.log('Inserting Data into Railway Database');
    console.log('='.repeat(60));

    await client.query('BEGIN');

    let totalAdded = 0;
    let totalSkipped = 0;

    for (const invoice of results) {
      console.log(`\nProcessing supplier: ${invoice.supplierName}`);

      const supplierId = await findOrCreateSupplier(client, invoice.supplierName);

      if (invoice.products.length > 0) {
        console.log(`  Adding ${invoice.products.length} products...`);
        const stats = await addProducts(client, supplierId, invoice.products);
        totalAdded += stats.added;
        totalSkipped += stats.skipped;
      }
    }

    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('✓ Processing Complete!');
    console.log('='.repeat(60));
    console.log(`PDFs processed: ${results.length}`);
    console.log(`Products added: ${totalAdded}`);
    console.log(`Products skipped (already exist): ${totalSkipped}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Database error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
main()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
