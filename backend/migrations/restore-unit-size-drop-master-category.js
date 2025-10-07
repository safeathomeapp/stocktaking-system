const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting master_products schema adjustment migration...');

    await client.query('BEGIN');

    // Step 1: Drop master_category column
    console.log('Step 1: Dropping master_category column...');
    await client.query(`
      ALTER TABLE master_products
      DROP COLUMN IF EXISTS master_category;
    `);
    console.log('  ✓ Dropped master_category column');

    // Step 2: Add unit_size column back
    console.log('Step 2: Adding unit_size column back...');
    await client.query(`
      ALTER TABLE master_products
      ADD COLUMN IF NOT EXISTS unit_size VARCHAR(100);
    `);
    console.log('  ✓ Added unit_size column');

    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
    console.log('\nFinal master_products schema changes:');
    console.log('  - Removed: master_category');
    console.log('  - Added back: unit_size (VARCHAR(100))');
    console.log('\nCurrent columns:');
    console.log('  - id, name, brand, category, subcategory, unit_type');
    console.log('  - unit_size, case_size, barcode, ean_code, upc_code');
    console.log('  - active, created_at, updated_at, created_by_id');

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
