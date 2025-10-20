const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🔧 Dropping old search trigger and function...\n');

    await client.query('BEGIN');

    // Drop the trigger if it exists
    console.log('Dropping trigger trigger_update_master_product_search...');
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_master_product_search ON master_products;
    `);
    console.log('✓ Trigger dropped\n');

    // Drop the function if it exists (CASCADE to drop dependent triggers)
    console.log('Dropping function update_master_product_search_fields()...');
    await client.query(`
      DROP FUNCTION IF EXISTS update_master_product_search_fields() CASCADE;
    `);
    console.log('✓ Function dropped\n');

    // Drop the normalize_for_search function if it exists
    console.log('Dropping function normalize_for_search()...');
    await client.query(`
      DROP FUNCTION IF EXISTS normalize_for_search(text) CASCADE;
    `);
    console.log('✓ Function dropped\n');

    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!\n');

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
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration error:', error);
      process.exit(1);
    });
}

module.exports = migrate;
