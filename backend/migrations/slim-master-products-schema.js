const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting master_products schema cleanup migration...');

    await client.query('BEGIN');

    // Step 1: Rename created_by column
    console.log('Step 1: Renaming columns...');

    // Rename created_by to created_by_id (will store supplier_id or venue_id)
    await client.query(`
      ALTER TABLE master_products
      RENAME COLUMN created_by TO created_by_id;
    `);
    console.log('  ✓ Renamed created_by → created_by_id');

    // Step 2: Drop columns that are no longer needed
    console.log('Step 2: Dropping unused columns...');

    const columnsToDrop = [
      'size',
      'unit_size',
      'alcohol_percentage',
      'search_terms',
      'phonetic_key',
      'normalized_name',
      'usage_count',
      'success_rate',
      'last_used',
      'venues_seen',
      'total_venues_count',
      'first_seen_venue',
      'verification_status',
      'confidence_score',
      'description',
      'container_type',
      'container_size',
      'sku',
      'suggested_retail_price',
      'currency'
    ];

    for (const column of columnsToDrop) {
      try {
        await client.query(`
          ALTER TABLE master_products
          DROP COLUMN IF EXISTS ${column};
        `);
        console.log(`  ✓ Dropped column: ${column}`);
      } catch (error) {
        console.log(`  ⚠ Column ${column} may not exist, skipping: ${error.message}`);
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
    console.log('\nFinal master_products schema:');
    console.log('  - id, name, brand, category, subcategory, master_category');
    console.log('  - unit_type, case_size (renamed), barcode, ean_code, upc_code');
    console.log('  - active, created_at, updated_at, created_by_id (renamed)');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration error:', error);
      process.exit(1);
    });
}

module.exports = migrate;
