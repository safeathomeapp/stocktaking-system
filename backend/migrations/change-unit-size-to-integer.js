const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting unit_size datatype migration...');

    await client.query('BEGIN');

    // Change unit_size from VARCHAR(100) to INTEGER
    console.log('Converting unit_size column to INTEGER...');

    // First, try to convert existing values to integers (where possible)
    // Set NULL for any non-numeric values
    await client.query(`
      UPDATE master_products
      SET unit_size = NULL
      WHERE unit_size IS NOT NULL
      AND unit_size !~ '^[0-9]+$';
    `);
    console.log('  ✓ Cleared non-numeric unit_size values');

    // Now alter the column type
    await client.query(`
      ALTER TABLE master_products
      ALTER COLUMN unit_size TYPE INTEGER
      USING unit_size::INTEGER;
    `);
    console.log('  ✓ Changed unit_size to INTEGER');

    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
    console.log('\nFinal schema:');
    console.log('  - unit_size: INTEGER (stores ml value, e.g., 330, 750, 50000)');
    console.log('  - case_size: INTEGER (stores units per case, e.g., 6, 12, 24)');

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
