const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixStockEntriesProductReferences() {
  try {
    console.log('🔧 Fixing stock entries product references after migration...\n');

    // Step 1: Find orphaned stock entries (referencing old product IDs)
    console.log('🔍 Finding orphaned stock entries...');
    const orphanedEntries = await pool.query(`
      SELECT
        se.id as entry_id,
        se.product_id as old_product_id,
        se.session_id,
        se.quantity_units,
        se.venue_area_id,
        ss.venue_id,
        p_old.name as old_product_name,
        p_old.venue_id as old_venue_id
      FROM stock_entries se
      JOIN stock_sessions ss ON se.session_id = ss.id
      LEFT JOIN products p_old ON se.product_id = p_old.id
      LEFT JOIN products_view pv ON se.product_id = pv.id
      WHERE pv.id IS NULL
      ORDER BY se.created_at DESC
    `);

    console.log(`Found ${orphanedEntries.rows.length} orphaned stock entries\n`);

    if (orphanedEntries.rows.length === 0) {
      console.log('✅ No orphaned entries found - all stock entries are properly linked!');
      return;
    }

    // Step 2: For each orphaned entry, find the correct product ID in the new system
    console.log('🔄 Mapping orphaned entries to new product IDs...');
    let mappingResults = [];

    for (const entry of orphanedEntries.rows) {
      // Find the corresponding product in the new system (venue_item_list via products_view)
      const newProduct = await pool.query(`
        SELECT id, name, venue_id
        FROM products_view
        WHERE venue_id = $1
        AND name = $2
        LIMIT 1
      `, [entry.venue_id, entry.old_product_name]);

      if (newProduct.rows.length > 0) {
        mappingResults.push({
          entryId: entry.entry_id,
          oldProductId: entry.old_product_id,
          newProductId: newProduct.rows[0].id,
          productName: entry.old_product_name,
          venue: entry.venue_id
        });
        console.log(`  ✓ Mapped "${entry.old_product_name}" to new ID ${newProduct.rows[0].id.substring(0,8)}`);
      } else {
        console.log(`  ⚠️  No matching product found for "${entry.old_product_name}" in venue ${entry.venue_id}`);
      }
    }

    // Step 3: Update stock entries with correct product IDs
    if (mappingResults.length > 0) {
      console.log(`\n🔄 Updating ${mappingResults.length} stock entries...`);

      for (const mapping of mappingResults) {
        await pool.query(`
          UPDATE stock_entries
          SET product_id = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [mapping.newProductId, mapping.entryId]);

        console.log(`  ✓ Updated entry for "${mapping.productName}"`);
      }

      console.log(`\n✅ Successfully updated ${mappingResults.length} stock entries!`);
    }

    // Step 4: Verification - check all stock entries are now properly linked
    console.log('\n🔍 Verification - checking all stock entries are properly linked...');
    const verificationCheck = await pool.query(`
      SELECT
        COUNT(*) as total_entries,
        COUNT(pv.id) as linked_entries,
        COUNT(*) - COUNT(pv.id) as orphaned_entries
      FROM stock_entries se
      LEFT JOIN products_view pv ON se.product_id = pv.id
    `);

    const result = verificationCheck.rows[0];
    console.log(`📊 Results:`);
    console.log(`  - Total stock entries: ${result.total_entries}`);
    console.log(`  - Properly linked: ${result.linked_entries}`);
    console.log(`  - Still orphaned: ${result.orphaned_entries}`);

    if (result.orphaned_entries === '0') {
      console.log('\n🎉 All stock entries are now properly linked to the new product architecture!');
    } else {
      console.log('\n⚠️  Some entries are still orphaned and may need manual review.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixStockEntriesProductReferences();