const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:tMpkSRqsDdrbECsTJYEAfgDNBchJjCdi@caboose.proxy.rlwy.net:35214/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function cleanup() {
  const client = await pool.connect();

  try {
    console.log('Cleaning up supplier_item_list table...\n');

    await client.query('BEGIN');

    // Remove redundant columns that are stored in other tables
    const columnsToRemove = [
      'unit_cost',              // → invoice_line_items.unit_price
      'case_cost',              // → invoice_line_items
      'pack_size',              // → master_products
      'case_size',              // → master_products
      'supplier_brand',         // → master_products.brand
      'supplier_category',      // → master_products.category
      'supplier_size',          // → master_products.unit_size
      'supplier_barcode',       // → master_products.barcode
      'minimum_order',          // → suppliers.sup_minimum_order
      'last_cost_update',       // Can calculate from invoices
      'last_ordered',           // Can calculate from invoices
      'order_frequency_days'    // Can calculate from invoices
    ];

    console.log('Removing redundant columns:');
    for (const column of columnsToRemove) {
      try {
        await client.query(`ALTER TABLE supplier_item_list DROP COLUMN IF EXISTS ${column}`);
        console.log(`  ✓ Dropped ${column}`);
      } catch (error) {
        console.log(`  ⚠ Could not drop ${column}: ${error.message}`);
      }
    }

    console.log('\nKept essential columns:');
    const keptColumns = [
      'id',
      'supplier_id',
      'master_product_id (nullable - links to master product)',
      'supplier_sku (THE key field - supplier\'s product code)',
      'supplier_name (for matching)',
      'supplier_description (helps fuzzy matching)',
      'auto_matched (was this auto-matched?)',
      'verified (has match been verified?)',
      'confidence_score (matching confidence 0-100)',
      'match_notes (notes about match)',
      'active',
      'created_at',
      'updated_at',
      'created_by'
    ];

    keptColumns.forEach(col => console.log(`  ✓ ${col}`));

    await client.query('COMMIT');

    console.log('\n========================================');
    console.log('✓ Cleanup complete!');
    console.log('========================================');
    console.log('supplier_item_list is now a lean mapping table');
    console.log('Pricing → invoice_line_items');
    console.log('Product specs → master_products');
    console.log('========================================\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanup()
  .then(() => {
    console.log('Script completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err.message);
    process.exit(1);
  });
