/**
 * CREATE SUPPLIER INVOICE PREFERENCES TABLE
 *
 * Stores column mapping preferences for invoice imports per supplier.
 * This allows the system to remember how each supplier's invoice format should be mapped.
 *
 * Usage: node migrations/create-supplier-invoice-preferences.js
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
    console.log('🚀 Creating supplier_invoice_preferences table...\n');
    await client.query('BEGIN');

    console.log('1️⃣ Creating supplier_invoice_preferences table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_invoice_preferences (
        id                      uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
        supplier_id             uuid           NOT NULL UNIQUE REFERENCES suppliers(sup_id) ON DELETE CASCADE,

        -- Invoice header column mappings (stores column index or -1 for N/A)
        invoice_number_column   integer        DEFAULT -1,
        invoice_date_column     integer        DEFAULT -1,
        delivery_number_column  integer        DEFAULT -1,
        date_ordered_column     integer        DEFAULT -1,
        date_delivered_column   integer        DEFAULT -1,
        customer_ref_column     integer        DEFAULT -1,
        subtotal_column         integer        DEFAULT -1,
        vat_total_column        integer        DEFAULT -1,
        total_amount_column     integer        DEFAULT -1,

        -- Line item column mappings
        product_code_column     integer        DEFAULT -1,
        product_name_column     integer        DEFAULT 0,
        product_description_column integer     DEFAULT -1,
        quantity_column         integer        DEFAULT -1,
        unit_price_column       integer        DEFAULT -1,
        nett_price_column       integer        DEFAULT -1,
        vat_code_column         integer        DEFAULT -1,
        vat_rate_column         integer        DEFAULT -1,
        vat_amount_column       integer        DEFAULT -1,
        line_total_column       integer        DEFAULT -1,

        -- Format settings
        import_method           varchar(50)    DEFAULT 'csv',  -- csv, ocr, manual
        date_format             varchar(50)    DEFAULT 'DD/MM/YYYY',
        currency                varchar(3)     DEFAULT 'GBP',

        -- Metadata
        last_updated            timestamp      DEFAULT CURRENT_TIMESTAMP,
        updated_by              varchar(255),

        created_at              timestamp      DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ supplier_invoice_preferences table created');

    // Create index
    console.log('\n2️⃣ Creating index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_supplier_invoice_preferences_supplier_id
      ON supplier_invoice_preferences(supplier_id)
    `);
    console.log('   ✅ Index created');

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Supplier invoice preferences table created successfully!\n');

    console.log('📋 Table structure:');
    console.log('   - One record per supplier');
    console.log('   - Stores column index for each field mapping');
    console.log('   - -1 indicates N/A (field not available in invoice)');
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
