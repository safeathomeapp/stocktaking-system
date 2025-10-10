const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🔧 Creating invoices and invoice_line_items tables...\n');

    await client.query('BEGIN');

    // Create invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id                uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
        invoice_number    varchar(100)   NOT NULL,
        venue_id          uuid           NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
        supplier_id       uuid           NOT NULL REFERENCES suppliers(sup_id) ON DELETE RESTRICT,
        invoice_date      date           NOT NULL,
        date_ordered      date,
        date_delivered    date,
        delivery_number   varchar(100),
        customer_ref      varchar(100),
        subtotal          numeric(10,2),
        vat_total         numeric(10,2),
        total_amount      numeric(10,2),
        currency          varchar(3)     DEFAULT 'GBP',
        payment_status    varchar(50)    DEFAULT 'unpaid',
        import_method     varchar(50),
        import_metadata   jsonb,
        notes             text,
        created_at        timestamp      DEFAULT CURRENT_TIMESTAMP,
        updated_at        timestamp      DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT unique_invoice_number_supplier UNIQUE(supplier_id, invoice_number)
      );
    `);
    console.log('✓ Created invoices table');

    // Create invoice_line_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_line_items (
        id                      serial         PRIMARY KEY,
        invoice_id              uuid           NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        master_product_id       uuid           REFERENCES master_products(id),
        supplier_item_list_id   integer        REFERENCES supplier_item_list(id),
        line_number             integer,
        product_code            varchar(100),
        product_name            varchar(255)   NOT NULL,
        product_description     text,
        quantity                numeric(10,2)  NOT NULL,
        unit_price              numeric(10,2),
        nett_price              numeric(10,2),
        vat_code                varchar(10),
        vat_rate                numeric(5,2),
        vat_amount              numeric(10,2),
        line_total              numeric(10,2),
        created_at              timestamp      DEFAULT CURRENT_TIMESTAMP,
        updated_at              timestamp      DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created invoice_line_items table');

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_venue_id ON invoices(venue_id);
    `);
    console.log('✓ Created index on invoices.venue_id');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_supplier_id ON invoices(supplier_id);
    `);
    console.log('✓ Created index on invoices.supplier_id');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
    `);
    console.log('✓ Created index on invoices.invoice_date');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
    `);
    console.log('✓ Created index on invoice_line_items.invoice_id');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoice_line_items_master_product_id ON invoice_line_items(master_product_id);
    `);
    console.log('✓ Created index on invoice_line_items.master_product_id\n');

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
