const { Pool } = require('pg');

// Explicit Railway database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:tMpkSRqsDdrbECsTJYEAfgDNBchJjCdi@caboose.proxy.rlwy.net:35214/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixSchema() {
  const client = await pool.connect();

  try {
    console.log('Connected to Railway PostgreSQL database');
    console.log('Checking venue_products table schema...');

    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'venue_products'
      AND column_name = 'area_id'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✓ Column area_id already exists in venue_products table');
      console.log('Schema is up to date!');
      return;
    }

    console.log('⚠ Column area_id NOT found. Adding it now...');

    // Add area_id column
    await client.query(`
      ALTER TABLE venue_products
      ADD COLUMN area_id INTEGER REFERENCES venue_areas(id)
    `);

    console.log('✓ Successfully added area_id column to venue_products table');
    console.log('✓ Schema migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixSchema()
  .then(() => {
    console.log('\n✓ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  });
