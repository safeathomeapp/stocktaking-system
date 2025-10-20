const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:tMpkSRqsDdrbECsTJYEAfgDNBchJjCdi@caboose.proxy.rlwy.net:35214/railway',
  ssl: { rejectUnauthorized: false }
});

async function verifyLastImport() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking last imported invoice...\n');

    // Get latest invoice
    const invoiceResult = await client.query(`
      SELECT
        i.*,
        s.sup_name as supplier_name,
        s.sup_account_number
      FROM invoices i
      JOIN suppliers s ON i.supplier_id = s.sup_id
      ORDER BY i.created_at DESC
      LIMIT 1
    `);

    if (invoiceResult.rows.length === 0) {
      console.log('❌ No invoices found');
      return;
    }

    const invoice = invoiceResult.rows[0];
    console.log('📄 Invoice Details:');
    console.log(`  ID: ${invoice.id}`);
    console.log(`  Number: ${invoice.invoice_number}`);
    console.log(`  Supplier: ${invoice.supplier_name}`);
    console.log(`  Date: ${invoice.invoice_date}`);
    console.log(`  Total: £${invoice.total_amount}`);
    if (invoice.customer_ref) {
      console.log(`  Customer Ref: ${invoice.customer_ref}`);
    }
    if (invoice.delivery_number) {
      console.log(`  Delivery Number: ${invoice.delivery_number}`);
    }
    if (invoice.sup_account_number) {
      console.log(`  Supplier Account: ${invoice.sup_account_number}`);
    }
    console.log(`  Created: ${invoice.created_at}\n`);

    // Get line items with matching status
    const lineItemsResult = await client.query(`
      SELECT
        ili.id,
        ili.product_name,
        ili.product_code,
        ili.quantity,
        ili.unit_price,
        ili.supplier_item_list_id,
        ili.master_product_id,
        sil.verified,
        sil.confidence_score,
        mp.product_name as master_product_name
      FROM invoice_line_items ili
      LEFT JOIN supplier_item_list sil ON ili.supplier_item_list_id = sil.id
      LEFT JOIN master_products mp ON ili.master_product_id = mp.id
      WHERE ili.invoice_id = $1
      ORDER BY ili.line_number
    `, [invoice.id]);

    console.log(`📦 Line Items (${lineItemsResult.rows.length}):\n`);

    let matched = 0;
    let unmatched = 0;

    lineItemsResult.rows.forEach((item, index) => {
      const hasSupplierItem = item.supplier_item_list_id ? '✓' : '✗';
      const hasMasterProduct = item.master_product_id ? '✓' : '✗';

      console.log(`  ${index + 1}. ${item.product_name}`);
      console.log(`     SKU: ${item.product_code || 'N/A'}`);
      console.log(`     Supplier Item: ${hasSupplierItem} | Master Product: ${hasMasterProduct}`);

      if (item.master_product_id) {
        console.log(`     → Matched to: ${item.master_product_name}`);
        if (item.confidence_score) {
          console.log(`     → Confidence: ${item.confidence_score}%`);
        }
        matched++;
      } else {
        console.log(`     → ⚠ Not matched to master product`);
        unmatched++;
      }
      console.log('');
    });

    console.log('📊 Summary:');
    console.log(`  Total Items: ${lineItemsResult.rows.length}`);
    console.log(`  Matched: ${matched} (${Math.round((matched / lineItemsResult.rows.length) * 100)}%)`);
    console.log(`  Unmatched: ${unmatched}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyLastImport();
