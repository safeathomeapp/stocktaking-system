const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🔧 Creating session_excluded_products table...\n');

    await client.query('BEGIN');

    // Create table to track products excluded from specific sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_excluded_products (
        id SERIAL PRIMARY KEY,
        session_id UUID NOT NULL REFERENCES stock_sessions(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES venue_products(id) ON DELETE CASCADE,
        excluded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, product_id)
      );
    `);
    console.log('✓ Created session_excluded_products table');

    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_excluded_products_session_id
      ON session_excluded_products(session_id);
    `);
    console.log('✓ Created index on session_id\n');

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
