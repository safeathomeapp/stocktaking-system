const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrateDatabase() {
  try {
    console.log('🚀 Starting database migration...');

    // Step 1: Add missing columns to venues table
    console.log('📋 Adding missing columns to venues table...');

    const addColumnQueries = [
      // Add new address fields
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255)`,
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255)`,
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS city VARCHAR(100)`,
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS county VARCHAR(100)`,
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS postcode VARCHAR(20)`,
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United Kingdom'`,

      // Add contact and billing fields
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`,
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255)`,
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)`,
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS billing_rate DECIMAL(10,2) DEFAULT 0.00`,
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS billing_currency VARCHAR(10) DEFAULT 'GBP'`,
      `ALTER TABLE venues ADD COLUMN IF NOT EXISTS billing_notes TEXT`,
    ];

    for (const query of addColumnQueries) {
      await pool.query(query);
    }

    // Step 2: Create venue_areas table if it doesn't exist
    console.log('📍 Creating venue_areas table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS venue_areas (
        id SERIAL PRIMARY KEY,
        venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        display_order INTEGER DEFAULT 1,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Step 3: Update products table to add area_id if missing
    console.log('📦 Updating products table...');
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS area_id INTEGER REFERENCES venue_areas(id) ON DELETE SET NULL
    `);
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100)
    `);
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100)
    `);
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR(50)
    `);
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_type VARCHAR(50) DEFAULT 'bottles'
    `);
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100)
    `);
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS expected_count INTEGER DEFAULT 0
    `);

    // Step 4: Create indexes for better performance
    console.log('⚡ Creating indexes...');
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name)`,
      `CREATE INDEX IF NOT EXISTS idx_venue_areas_venue_id ON venue_areas(venue_id)`,
      `CREATE INDEX IF NOT EXISTS idx_products_venue_id ON products(venue_id)`,
      `CREATE INDEX IF NOT EXISTS idx_products_area_id ON products(area_id)`,
      `CREATE INDEX IF NOT EXISTS idx_stock_sessions_venue_id ON stock_sessions(venue_id)`,
      `CREATE INDEX IF NOT EXISTS idx_stock_sessions_status ON stock_sessions(status)`,
      `CREATE INDEX IF NOT EXISTS idx_stock_entries_session_id ON stock_entries(session_id)`,
      `CREATE INDEX IF NOT EXISTS idx_stock_entries_product_id ON stock_entries(product_id)`,
    ];

    for (const query of indexQueries) {
      await pool.query(query);
    }

    // Step 5: Create update timestamp triggers
    console.log('⏰ Creating timestamp triggers...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    const triggerQueries = [
      `DROP TRIGGER IF EXISTS update_venues_updated_at ON venues`,
      `CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
      `DROP TRIGGER IF EXISTS update_venue_areas_updated_at ON venue_areas`,
      `CREATE TRIGGER update_venue_areas_updated_at BEFORE UPDATE ON venue_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
      `DROP TRIGGER IF EXISTS update_products_updated_at ON products`,
      `CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
      `DROP TRIGGER IF EXISTS update_stock_sessions_updated_at ON stock_sessions`,
      `CREATE TRIGGER update_stock_sessions_updated_at BEFORE UPDATE ON stock_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
      `DROP TRIGGER IF EXISTS update_stock_entries_updated_at ON stock_entries`,
      `CREATE TRIGGER update_stock_entries_updated_at BEFORE UPDATE ON stock_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
    ];

    for (const query of triggerQueries) {
      await pool.query(query);
    }

    console.log('✅ Database migration completed successfully!');

    // Test the migration by checking table structure
    const venuesStructure = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'venues'
      ORDER BY ordinal_position
    `);

    console.log('📋 Updated venues table structure:');
    venuesStructure.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    // Check areas table
    const areasResult = await pool.query('SELECT COUNT(*) as count FROM venue_areas');
    console.log(`📍 Venue areas count: ${areasResult.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error migrating database:', error);
    process.exit(1);
  }
}

migrateDatabase();