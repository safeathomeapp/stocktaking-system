/**
 * SUPPLIER ITEM LIST MIGRATION
 *
 * Creates the supplier_item_list table for mapping supplier-specific product names,
 * SKUs, and PLU codes to master products. This enables invoice OCR matching.
 *
 * Usage: node migrations/create-supplier-item-list.js
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
    console.log('🚀 Starting supplier_item_list migration...\n');

    // Check if suppliers table exists and has correct schema
    console.log('1️⃣ Checking suppliers table...');
    const suppliersCheck = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'suppliers'
      ORDER BY ordinal_position
    `);

    if (suppliersCheck.rows.length === 0) {
      console.log('   ⚠️  Suppliers table not found, creating it...');
      await client.query(`
        CREATE TABLE suppliers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          code VARCHAR(50),
          contact_person VARCHAR(255),
          contact_email VARCHAR(255),
          contact_phone VARCHAR(50),
          address TEXT,
          website VARCHAR(255),
          account_number VARCHAR(100),
          payment_terms VARCHAR(100),
          delivery_days VARCHAR(100),
          minimum_order NUMERIC(10,2),
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('   ✅ Suppliers table created');
    } else {
      console.log('   ✅ Suppliers table exists');
      console.log(`   Found ${suppliersCheck.rows.length} columns:`, suppliersCheck.rows.map(r => r.column_name).join(', '));
    }

    // Check if supplier_item_list already exists
    console.log('\n2️⃣ Checking supplier_item_list table...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'supplier_item_list'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('   ⚠️  Table already exists. Skipping creation.');
      console.log('   Run DROP TABLE supplier_item_list CASCADE; to recreate.');
      return;
    }

    // Create supplier_item_list table
    console.log('   Creating supplier_item_list table...');
    await client.query(`
      CREATE TABLE supplier_item_list (
        id SERIAL PRIMARY KEY,
        supplier_id UUID NOT NULL REFERENCES suppliers(sup_id) ON DELETE CASCADE,
        master_product_id UUID REFERENCES master_products(id) ON DELETE SET NULL,

        -- Supplier-specific product identification
        supplier_sku VARCHAR(100) NOT NULL,
        supplier_name VARCHAR(255) NOT NULL,
        supplier_description TEXT,
        supplier_brand VARCHAR(100),
        supplier_category VARCHAR(100),
        supplier_size VARCHAR(50),
        supplier_barcode VARCHAR(100),

        -- Pricing information
        unit_cost DECIMAL(10,2),
        case_cost DECIMAL(10,2),
        pack_size INTEGER DEFAULT 1,
        case_size INTEGER,
        minimum_order INTEGER DEFAULT 1,

        -- Matching metadata
        auto_matched BOOLEAN DEFAULT false,
        verified BOOLEAN DEFAULT false,
        confidence_score DECIMAL(5,2) DEFAULT 0,
        match_notes TEXT,

        -- Tracking
        last_cost_update TIMESTAMP,
        last_ordered TIMESTAMP,
        order_frequency_days INTEGER,
        active BOOLEAN DEFAULT true,

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),

        -- Constraints
        CONSTRAINT unique_supplier_sku UNIQUE(supplier_id, supplier_sku),
        CONSTRAINT valid_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 100)
      );
    `);
    console.log('   ✅ Table created');

    // Create indexes
    console.log('\n3️⃣ Creating indexes...');
    await client.query(`
      CREATE INDEX idx_supplier_item_list_supplier_id ON supplier_item_list(supplier_id);
      CREATE INDEX idx_supplier_item_list_master_product_id ON supplier_item_list(master_product_id);
      CREATE INDEX idx_supplier_item_list_supplier_sku ON supplier_item_list(supplier_sku);
      CREATE INDEX idx_supplier_item_list_supplier_name ON supplier_item_list(supplier_name);
      CREATE INDEX idx_supplier_item_list_supplier_barcode ON supplier_item_list(supplier_barcode) WHERE supplier_barcode IS NOT NULL;
      CREATE INDEX idx_supplier_item_list_active ON supplier_item_list(active) WHERE active = true;
    `);
    console.log('   ✅ Indexes created');

    // Create trigger for updated_at
    console.log('\n4️⃣ Creating update trigger...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_supplier_item_list_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trigger_supplier_item_list_updated_at
        BEFORE UPDATE ON supplier_item_list
        FOR EACH ROW
        EXECUTE FUNCTION update_supplier_item_list_updated_at();
    `);
    console.log('   ✅ Trigger created');

    // Insert sample suppliers if table is empty
    console.log('\n5️⃣ Checking for existing suppliers...');
    const supplierCount = await client.query('SELECT COUNT(*) FROM suppliers');

    if (supplierCount.rows[0].count === '0') {
      console.log('   Adding sample suppliers...');
      await client.query(`
        INSERT INTO suppliers (name, code, active) VALUES
        ('Bookers Cash & Carry', 'BOOKERS', true),
        ('Brakes', 'BRAKES', true),
        ('Bidfood', 'BIDFOOD', true),
        ('Matthew Clark', 'MATTHEW_CLARK', true),
        ('Bestway', 'BESTWAY', true),
        ('Sysco', 'SYSCO', true)
        ON CONFLICT (name) DO NOTHING;
      `);
      console.log('   ✅ Sample suppliers added');
    } else {
      console.log(`   ✅ Found ${supplierCount.rows[0].count} existing suppliers`);
    }

    // Show table structure
    console.log('\n6️⃣ Verifying table structure...');
    const columns = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'supplier_item_list'
      ORDER BY ordinal_position;
    `);

    console.log(`   ✅ Table has ${columns.rows.length} columns:`);
    columns.rows.forEach(col => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`      - ${col.column_name}: ${col.data_type}${length} ${nullable}`);
    });

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📋 Next steps:');
    console.log('   1. Use the API to add supplier items');
    console.log('   2. Link supplier items to master_products');
    console.log('   3. Use for invoice OCR matching\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
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
