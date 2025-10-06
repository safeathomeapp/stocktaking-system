/**
 * CREATE EPOS SALES TABLES
 *
 * This migration creates tables to store EPOS (Electronic Point of Sale) data
 * from CSV imports. Designed to be flexible for different EPOS systems.
 *
 * Tables:
 * - epos_imports: Tracks each CSV import
 * - epos_sales_records: Individual line items from EPOS
 *
 * Usage: node migrations/create-epos-sales-tables.js
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
    console.log('🚀 Creating EPOS sales tables...\n');
    await client.query('BEGIN');

    // Table 1: EPOS Imports (header/metadata for each CSV upload)
    console.log('1️⃣ Creating epos_imports table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS epos_imports (
        id                  uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
        venue_id            uuid          NOT NULL REFERENCES venues(id) ON DELETE CASCADE,

        -- Import metadata
        import_date         timestamp     DEFAULT CURRENT_TIMESTAMP,
        original_filename   varchar(255),
        epos_system_name    varchar(100),  -- e.g., "Lightspeed", "Square", "Bookers", "Clover"

        -- Period covered by this data
        period_start_date   date,
        period_end_date     date,

        -- Summary stats
        total_records       integer       DEFAULT 0,
        matched_records     integer       DEFAULT 0,
        unmatched_records   integer       DEFAULT 0,
        total_sales_value   decimal(10,2) DEFAULT 0,

        -- Import details
        imported_by         varchar(255),
        import_notes        text,

        created_at          timestamp     DEFAULT CURRENT_TIMESTAMP,
        updated_at          timestamp     DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ epos_imports table created');

    // Table 2: EPOS Sales Records (individual line items from CSV)
    console.log('\n2️⃣ Creating epos_sales_records table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS epos_sales_records (
        id                  uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
        import_id           uuid          NOT NULL REFERENCES epos_imports(id) ON DELETE CASCADE,
        venue_id            uuid          NOT NULL REFERENCES venues(id) ON DELETE CASCADE,

        -- Generic EPOS data fields (flexible for different systems)
        item_code           varchar(100),  -- PLU, SKU, barcode, or any product identifier
        item_description    varchar(255),  -- Product name/description from EPOS
        category            varchar(100),  -- Category from EPOS (if available)

        -- Sales data
        quantity_sold       decimal(10,2), -- Units/bottles sold
        unit_price          decimal(10,2), -- Price per unit
        total_value         decimal(10,2), -- Total revenue for this item

        -- Additional flexible fields for different EPOS systems
        epos_data           jsonb,         -- Store any extra fields as JSON

        -- Matching to our system
        venue_product_id    uuid          REFERENCES venue_products(id) ON DELETE SET NULL,
        master_product_id   uuid          REFERENCES master_products(id) ON DELETE SET NULL,
        match_status        varchar(20)   DEFAULT 'unmatched', -- 'exact', 'fuzzy', 'manual', 'unmatched'
        match_confidence    numeric(5,2),  -- 0-100 confidence score
        matched_at          timestamp,
        matched_by          varchar(255),

        created_at          timestamp     DEFAULT CURRENT_TIMESTAMP,
        updated_at          timestamp     DEFAULT CURRENT_TIMESTAMP,

        -- Indexes for common queries
        CONSTRAINT valid_match_status CHECK (match_status IN ('exact', 'fuzzy', 'manual', 'unmatched'))
      )
    `);
    console.log('   ✅ epos_sales_records table created');

    // Create indexes for performance
    console.log('\n3️⃣ Creating indexes...');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_epos_imports_venue_id
      ON epos_imports(venue_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_epos_imports_import_date
      ON epos_imports(import_date)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_epos_sales_records_import_id
      ON epos_sales_records(import_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_epos_sales_records_venue_id
      ON epos_sales_records(venue_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_epos_sales_records_item_code
      ON epos_sales_records(item_code)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_epos_sales_records_match_status
      ON epos_sales_records(match_status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_epos_sales_records_venue_product
      ON epos_sales_records(venue_product_id)
    `);

    console.log('   ✅ Indexes created');

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ EPOS sales tables created successfully!\n');

    // Show final schema
    console.log('📋 Created tables:');
    console.log('   1. epos_imports - Tracks each CSV import');
    console.log('   2. epos_sales_records - Individual sales line items');
    console.log('\n📝 Flexible fields for different EPOS systems:');
    console.log('   - item_code: PLU/SKU/barcode/any identifier');
    console.log('   - item_description: Product name from EPOS');
    console.log('   - epos_data: JSON field for system-specific extra data');
    console.log('\n🔗 Product matching:');
    console.log('   - Links to venue_products and master_products');
    console.log('   - Tracks match status and confidence\n');

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
