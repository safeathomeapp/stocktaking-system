/**
 * CREATE VENUE CSV PREFERENCES TABLE
 *
 * Stores column mapping preferences for EPOS CSV imports per venue.
 * This allows the system to remember how each venue's CSV should be mapped.
 *
 * Usage: node migrations/create-venue-csv-preferences.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🚀 Creating venue_csv_preferences table...\n');
    await client.query('BEGIN');

    console.log('1️⃣ Creating venue_csv_preferences table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS venue_csv_preferences (
        id                  uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
        venue_id            uuid          NOT NULL UNIQUE REFERENCES venues(id) ON DELETE CASCADE,

        -- Column mapping preferences (stores column index or -1 for N/A)
        item_code_column    integer       DEFAULT -1,
        item_description_column integer   DEFAULT 0,
        quantity_sold_column integer      DEFAULT -1,
        unit_price_column   integer       DEFAULT -1,
        total_value_column  integer       DEFAULT -1,

        -- Metadata
        last_updated        timestamp     DEFAULT CURRENT_TIMESTAMP,
        updated_by          varchar(255),

        created_at          timestamp     DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ venue_csv_preferences table created');

    // Create index
    console.log('\n2️⃣ Creating index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_venue_csv_preferences_venue_id
      ON venue_csv_preferences(venue_id)
    `);
    console.log('   ✅ Index created');

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Venue CSV preferences table created successfully!\n');

    console.log('📋 Table structure:');
    console.log('   - One record per venue');
    console.log('   - Stores column index for each field mapping');
    console.log('   - -1 indicates N/A (field not available in CSV)');
    console.log('   - Automatically remembered for next import\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed, rolled back:', error.message);
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

module.exports = { migrate };
