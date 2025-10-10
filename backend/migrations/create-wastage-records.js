const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🔧 Creating wastage_records table...\n');

    await client.query('BEGIN');

    // Create wastage_records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wastage_records (
        id              uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id      uuid           NOT NULL REFERENCES stock_sessions(id) ON DELETE CASCADE,
        product_id      uuid           NOT NULL REFERENCES venue_products(id) ON DELETE RESTRICT,
        venue_area_id   integer        REFERENCES venue_areas(id),
        quantity        numeric(10,2)  NOT NULL CHECK (quantity > 0),
        wastage_type    varchar(50)    NOT NULL,
        reason          varchar(255),
        notes           text,
        recorded_by     varchar(255),
        recorded_at     timestamp      DEFAULT CURRENT_TIMESTAMP,
        created_at      timestamp      DEFAULT CURRENT_TIMESTAMP,
        updated_at      timestamp      DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created wastage_records table');

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wastage_records_session_id ON wastage_records(session_id);
    `);
    console.log('✓ Created index on wastage_records.session_id');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wastage_records_product_id ON wastage_records(product_id);
    `);
    console.log('✓ Created index on wastage_records.product_id');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wastage_records_wastage_type ON wastage_records(wastage_type);
    `);
    console.log('✓ Created index on wastage_records.wastage_type\n');

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
