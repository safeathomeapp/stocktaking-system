/**
 * REMOVE REDUNDANT PRODUCT COLUMNS MIGRATION
 *
 * This migration removes columns from the products table that are not used
 * in the current codebase. These columns are redundant because:
 *
 * 1. local_name - Not used anywhere in code
 * 2. supplier - Not used (suppliers are tracked in supplier_item_list)
 * 3. cost_price - Not used (pricing in supplier_item_list)
 * 4. selling_price - Not used (pricing should be in master_products or supplier_item_list)
 * 5. local_notes - Not used anywhere in code
 * 6. auto_matched - Not used in products table (used in supplier_item_list instead)
 *
 * KEPT COLUMNS (still in use):
 * - area_id: Used in queries and product creation (lines 423, 438, 453 in server.js)
 * - expected_count: Used in product creation (line 456 in server.js)
 *
 * Usage: node migrations/remove-redundant-product-columns.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Columns to be removed
const COLUMNS_TO_REMOVE = [
  'local_name',
  'supplier',
  'cost_price',
  'selling_price',
  'local_notes',
  'auto_matched'
];

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting redundant column removal migration...\n');

    // Step 1: Check current schema
    console.log('1️⃣ Checking current products table schema...');
    const currentColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);

    console.log(`   Found ${currentColumns.rows.length} columns:`);
    currentColumns.rows.forEach(col => {
      const toRemove = COLUMNS_TO_REMOVE.includes(col.column_name);
      const marker = toRemove ? '❌' : '✅';
      console.log(`      ${marker} ${col.column_name} (${col.data_type})`);
    });

    // Step 2: Backup data from columns to be removed (for safety)
    console.log('\n2️⃣ Creating backup of data from columns to be removed...');

    const existingColumns = currentColumns.rows.map(r => r.column_name);
    const columnsToBackup = COLUMNS_TO_REMOVE.filter(col => existingColumns.includes(col));

    if (columnsToBackup.length > 0) {
      const selectCols = ['id', 'venue_id', 'name', ...columnsToBackup].join(', ');
      const backupData = await client.query(`
        SELECT ${selectCols}
        FROM products
        WHERE ${columnsToBackup.map(col => `${col} IS NOT NULL`).join(' OR ')}
      `);

      console.log(`   Backed up ${backupData.rows.length} rows with non-null values in removed columns`);

      if (backupData.rows.length > 0) {
        console.log('   Sample of backed up data:');
        backupData.rows.slice(0, 3).forEach(row => {
          console.log(`      Product "${row.name}":`,
            columnsToBackup.map(col => `${col}=${row[col]}`).join(', ')
          );
        });
      }
    } else {
      console.log('   No columns to backup (already removed)');
    }

    // Step 3: Remove columns
    console.log('\n3️⃣ Removing redundant columns...');
    let removedCount = 0;

    for (const columnName of COLUMNS_TO_REMOVE) {
      // Check if column exists
      const columnExists = existingColumns.includes(columnName);

      if (columnExists) {
        console.log(`   Dropping column: ${columnName}...`);
        await client.query(`ALTER TABLE products DROP COLUMN IF EXISTS ${columnName}`);
        removedCount++;
      } else {
        console.log(`   Skipping ${columnName} (already removed)`);
      }
    }

    console.log(`   ✅ Removed ${removedCount} columns`);

    // Step 4: Verify final schema
    console.log('\n4️⃣ Verifying final schema...');
    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);

    console.log(`   ✅ Products table now has ${finalColumns.rows.length} columns:`);
    finalColumns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`      - ${col.column_name}: ${col.data_type} ${nullable}`);
    });

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   Removed ${removedCount} redundant columns from products table`);
    console.log('   Columns removed: ' + COLUMNS_TO_REMOVE.join(', '));
    console.log('\n📝 Kept columns:');
    console.log('   - area_id: Used in product queries and creation');
    console.log('   - expected_count: Used in product creation');
    console.log('   - All core fields: id, venue_id, master_product_id, name, category, brand, size, etc.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('🎉 Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { migrate, COLUMNS_TO_REMOVE };
