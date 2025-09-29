const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateStockEntries() {
  try {
    console.log('🔄 Starting stock_entries table migration...');

    // Step 1: Remove obsolete columns
    console.log('📋 Removing obsolete columns...');
    await pool.query('ALTER TABLE stock_entries DROP COLUMN IF EXISTS quantity_level');
    await pool.query('ALTER TABLE stock_entries DROP COLUMN IF EXISTS condition_flags');
    await pool.query('ALTER TABLE stock_entries DROP COLUMN IF EXISTS photo_url');
    console.log('✅ Removed quantity_level, condition_flags, photo_url');

    // Step 2: Replace location_notes with venue_area_id
    console.log('🔗 Adding venue_area_id foreign key...');
    await pool.query('ALTER TABLE stock_entries DROP COLUMN IF EXISTS location_notes');
    await pool.query('ALTER TABLE stock_entries ADD COLUMN IF NOT EXISTS venue_area_id INTEGER REFERENCES venue_areas(id) ON DELETE SET NULL');
    console.log('✅ Added venue_area_id foreign key');

    // Step 3: Update quantity_units to DECIMAL(10,2)
    console.log('🔢 Updating quantity_units to DECIMAL(10,2)...');
    await pool.query('ALTER TABLE stock_entries ALTER COLUMN quantity_units TYPE DECIMAL(10,2)');
    await pool.query('ALTER TABLE stock_entries ALTER COLUMN quantity_units SET DEFAULT 0.00');
    console.log('✅ Updated quantity_units to DECIMAL(10,2)');

    // Step 4: Add indexes
    console.log('⚡ Creating indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_entries_venue_area_id ON stock_entries(venue_area_id)');
    console.log('✅ Created venue_area_id index');

    // Step 5: Add constraint (if it doesn't exist)
    console.log('🛡️ Adding constraints...');
    try {
      await pool.query(`
        ALTER TABLE stock_entries
        ADD CONSTRAINT chk_quantity_units_non_negative
        CHECK (quantity_units >= 0.00)
      `);
    } catch (error) {
      if (error.code === '42710') {
        console.log('   - Constraint already exists, skipping');
      } else {
        throw error;
      }
    }
    console.log('✅ Added non-negative quantity_units constraint');

    // Step 6: Verify the new schema
    console.log('🔍 Verifying new schema...');
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'stock_entries'
      ORDER BY ordinal_position
    `);

    console.log('📋 Updated stock_entries table structure:');
    schemaResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    console.log('✅ Stock entries migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error migrating stock_entries:', error);
    process.exit(1);
  }
}

migrateStockEntries();