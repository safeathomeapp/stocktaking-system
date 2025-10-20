const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🔧 Updating unit_type constraint...\n');

    await client.query('BEGIN');

    // Clear table first to avoid constraint conflicts
    console.log('Clearing master_products table...');
    const deleteResult = await client.query('DELETE FROM master_products');
    console.log(`✓ Deleted ${deleteResult.rowCount} records\n`);

    // Drop the existing constraint
    console.log('Dropping existing unit_type check constraint...');
    await client.query(`
      ALTER TABLE master_products
      DROP CONSTRAINT IF EXISTS master_products_unit_type_check;
    `);
    console.log('✓ Constraint dropped\n');

    // Add new constraint with expanded values
    console.log('Adding updated unit_type check constraint...');
    await client.query(`
      ALTER TABLE master_products
      ADD CONSTRAINT master_products_unit_type_check
      CHECK (unit_type IN ('bottle', 'can', 'keg', 'cask', 'bag-in-box'));
    `);
    console.log('✓ Constraint added with values: bottle, can, keg, cask, bag-in-box\n');

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
