const pool = require('../src/database');

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting migration: Add area_id to venue_products...');

    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'venue_products'
      AND column_name = 'area_id'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✓ Column area_id already exists in venue_products table');
      return;
    }

    // Add area_id column
    await client.query(`
      ALTER TABLE venue_products
      ADD COLUMN area_id INTEGER REFERENCES venue_areas(id)
    `);

    console.log('✓ Successfully added area_id column to venue_products table');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });
