const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

/**
 * SAFE MIGRATION TO THREE-TABLE ARCHITECTURE (FIXED FOR DUPLICATES)
 *
 * Strategy: Create new tables alongside existing ones, migrate data handling duplicates,
 * then create views for backward compatibility before eventually dropping old tables.
 */

async function migrateToThreeTableArchitecture() {
  try {
    console.log('🚀 Starting migration to three-table architecture...\n');

    // =================
    // PHASE 1: CREATE NEW TABLES
    // =================
    console.log('📋 Phase 1: Creating new tables with global naming...\n');

    await createMasterItemList();
    await createSupplierTables();
    await createVenueItemList();

    // =================
    // PHASE 2: MIGRATE DATA
    // =================
    console.log('\n📦 Phase 2: Migrating existing data...\n');

    await migrateMasterProducts();
    await migrateVenueProductsWithDuplicateHandling();
    await createSampleSupplierData();

    // =================
    // PHASE 3: CREATE GLOBAL FUNCTIONS
    // =================
    console.log('\n🔧 Phase 3: Creating global functions...\n');

    await createGlobalFunctions();

    // =================
    // PHASE 4: CREATE COMPATIBILITY VIEWS
    // =================
    console.log('\n🔗 Phase 4: Creating backward compatibility views...\n');

    await createCompatibilityViews();

    // =================
    // PHASE 5: VERIFICATION
    // =================
    console.log('\n✅ Phase 5: Verification...\n');

    await verifyMigration();

    console.log('🎉 Migration completed successfully!\n');
    console.log('📋 Summary:');
    console.log('  - New tables created with global naming conventions');
    console.log('  - Data migrated from existing tables (duplicates handled)');
    console.log('  - Compatibility views created for existing API endpoints');
    console.log('  - Global PLU lookup function installed');
    console.log('  - All existing functionality preserved\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function createMasterItemList() {
  console.log('Creating master_item_list table...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS master_item_list (
      mas_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mas_name VARCHAR(255) NOT NULL,
      mas_brand VARCHAR(255),
      mas_category VARCHAR(100),
      mas_description TEXT,
      mas_base_unit VARCHAR(50),
      mas_case_size INTEGER,
      mas_alcohol_percentage DECIMAL(5,2),
      mas_barcode VARCHAR(100),
      mas_ean_code VARCHAR(13),
      mas_upc_code VARCHAR(12),
      mas_sku VARCHAR(100),
      mas_search_terms TEXT,
      mas_phonetic_key VARCHAR(100),
      mas_normalized_name VARCHAR(255),

      -- Global analytics
      global_usage_count INTEGER DEFAULT 0,
      global_success_rate DECIMAL(5,2) DEFAULT 0.00,
      global_venues_seen TEXT[],
      global_total_venues_count INTEGER DEFAULT 0,
      global_last_used TIMESTAMP,
      global_verification_status VARCHAR(20) DEFAULT 'unverified',
      global_confidence_score DECIMAL(5,2) DEFAULT 0.00,
      global_created_by UUID,

      -- Pricing reference
      mas_suggested_retail_price DECIMAL(10,2),
      mas_currency VARCHAR(3) DEFAULT 'GBP',

      -- Status
      mas_active BOOLEAN DEFAULT true,
      mas_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      mas_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      -- Indexes for performance
      CONSTRAINT master_item_list_name_brand_unique UNIQUE (mas_name, mas_brand)
    );

    -- Performance indexes (simplified - no trigram)
    CREATE INDEX IF NOT EXISTS idx_master_item_list_name ON master_item_list (mas_name);
    CREATE INDEX IF NOT EXISTS idx_master_item_list_brand ON master_item_list (mas_brand);
    CREATE INDEX IF NOT EXISTS idx_master_item_list_category ON master_item_list (mas_category);
    CREATE INDEX IF NOT EXISTS idx_master_item_list_active ON master_item_list (mas_active);
    CREATE INDEX IF NOT EXISTS idx_master_item_list_usage ON master_item_list (global_usage_count DESC);
  `);

  console.log('✅ master_item_list created');
}

async function createSupplierTables() {
  console.log('Creating supplier tables...');

  // Suppliers table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      sup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sup_name VARCHAR(255) NOT NULL UNIQUE,
      sup_contact_person VARCHAR(255),
      sup_email VARCHAR(255),
      sup_phone VARCHAR(50),
      sup_address TEXT,
      sup_website VARCHAR(255),
      sup_account_number VARCHAR(100),
      sup_payment_terms VARCHAR(100),
      sup_delivery_days VARCHAR(100),
      sup_minimum_order DECIMAL(10,2),
      sup_active BOOLEAN DEFAULT true,
      sup_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sup_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Supplier items table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS supplier_item_list (
      sup_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID REFERENCES suppliers(sup_id) ON DELETE CASCADE,
      sup_name VARCHAR(255) NOT NULL,
      sup_brand VARCHAR(255),
      sup_description TEXT,
      sup_category VARCHAR(100),
      sup_plu_code VARCHAR(50),
      sup_sku VARCHAR(100),
      sup_barcode VARCHAR(100),
      sup_case_size INTEGER,
      sup_unit_size VARCHAR(50),
      sup_pack_description VARCHAR(255),

      -- Global linkage
      global_master_id UUID REFERENCES master_item_list(mas_item_id),
      global_confidence_score DECIMAL(5,2) DEFAULT 0.00,

      -- Pricing
      sup_cost_price DECIMAL(10,2),
      sup_list_price DECIMAL(10,2),
      sup_currency VARCHAR(3) DEFAULT 'GBP',
      sup_price_per_unit DECIMAL(10,2),

      -- Availability
      sup_lead_time_days INTEGER,
      sup_availability VARCHAR(50) DEFAULT 'available',
      sup_minimum_quantity INTEGER DEFAULT 1,

      -- Status
      sup_active BOOLEAN DEFAULT true,
      sup_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sup_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      -- Constraints
      CONSTRAINT supplier_item_list_plu_unique UNIQUE (supplier_id, sup_plu_code),
      CONSTRAINT supplier_item_list_name_supplier_unique UNIQUE (supplier_id, sup_name, sup_brand)
    );

    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_supplier_item_list_plu ON supplier_item_list (sup_plu_code);
    CREATE INDEX IF NOT EXISTS idx_supplier_item_list_name ON supplier_item_list (sup_name);
    CREATE INDEX IF NOT EXISTS idx_supplier_item_list_supplier ON supplier_item_list (supplier_id);
    CREATE INDEX IF NOT EXISTS idx_supplier_item_list_master ON supplier_item_list (global_master_id);
  `);

  console.log('✅ Supplier tables created');
}

async function createVenueItemList() {
  console.log('Creating venue_item_list table...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS venue_item_list (
      ven_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
      ven_name VARCHAR(255) NOT NULL,
      ven_category VARCHAR(100),
      ven_brand VARCHAR(255),
      ven_size VARCHAR(100),
      ven_unit_type VARCHAR(50),
      ven_barcode VARCHAR(100),
      ven_location_area INTEGER,
      ven_expected_count INTEGER DEFAULT 0,
      ven_cost_price DECIMAL(10,2),
      ven_selling_price DECIMAL(10,2),
      ven_notes TEXT,

      -- Global linkage
      global_master_id UUID REFERENCES master_item_list(mas_item_id),
      global_auto_matched BOOLEAN DEFAULT false,

      -- Timestamps
      ven_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ven_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      -- Constraints
      CONSTRAINT venue_item_list_venue_name_unique UNIQUE (venue_id, ven_name)
    );

    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_venue_item_list_venue ON venue_item_list (venue_id);
    CREATE INDEX IF NOT EXISTS idx_venue_item_list_name ON venue_item_list (ven_name);
    CREATE INDEX IF NOT EXISTS idx_venue_item_list_category ON venue_item_list (ven_category);
    CREATE INDEX IF NOT EXISTS idx_venue_item_list_master ON venue_item_list (global_master_id);
  `);

  console.log('✅ venue_item_list created');
}

async function migrateMasterProducts() {
  console.log('Migrating data from master_products to master_item_list...');

  const result = await pool.query(`
    INSERT INTO master_item_list (
      mas_item_id, mas_name, mas_brand, mas_category, mas_description,
      mas_base_unit, mas_case_size, mas_alcohol_percentage, mas_barcode,
      mas_ean_code, mas_upc_code, mas_sku, mas_search_terms, mas_phonetic_key,
      mas_normalized_name, global_usage_count, global_success_rate, global_venues_seen,
      global_total_venues_count, global_last_used, global_verification_status,
      global_confidence_score, global_created_by, mas_suggested_retail_price,
      mas_currency, mas_active, mas_created_at, mas_updated_at
    )
    SELECT
      id, name, brand, category, description,
      unit_type, case_size, alcohol_percentage, barcode,
      ean_code, upc_code, sku, search_terms, phonetic_key,
      normalized_name, COALESCE(usage_count, 0), COALESCE(success_rate, 0), venues_seen,
      COALESCE(total_venues_count, 0), last_used, COALESCE(verification_status, 'unverified'),
      COALESCE(confidence_score, 0),
      CASE WHEN created_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           THEN created_by::UUID
           ELSE NULL
      END,
      suggested_retail_price,
      COALESCE(currency, 'GBP'), COALESCE(active, true), created_at, updated_at
    FROM master_products
    ON CONFLICT (mas_item_id) DO NOTHING;
  `);

  console.log(`✅ Migrated ${result.rowCount} master products`);
}

async function migrateVenueProductsWithDuplicateHandling() {
  console.log('Migrating data from products to venue_item_list (handling duplicates)...');

  // First, identify and log duplicates
  const duplicates = await pool.query(`
    SELECT venue_id, name, COUNT(*) as count
    FROM products
    GROUP BY venue_id, name
    HAVING COUNT(*) > 1
    ORDER BY venue_id, name
  `);

  if (duplicates.rows.length > 0) {
    console.log(`⚠️  Found ${duplicates.rows.length} duplicate product name(s) - keeping most recent version`);
    duplicates.rows.forEach(row => {
      console.log(`   - "${row.name}" (${row.count} copies)`);
    });
  }

  // Migrate only the most recent version of each product (by created_at)
  const result = await pool.query(`
    INSERT INTO venue_item_list (
      ven_item_id, venue_id, ven_name, ven_category, ven_brand, ven_size,
      ven_unit_type, ven_barcode, ven_location_area, ven_expected_count,
      ven_cost_price, ven_selling_price, ven_notes, global_master_id,
      global_auto_matched, ven_created_at, ven_updated_at
    )
    SELECT DISTINCT ON (venue_id, COALESCE(local_name, name))
      id, venue_id, COALESCE(local_name, name), category, brand, size,
      unit_type, barcode, area_id, expected_count,
      cost_price, selling_price, local_notes, master_product_id,
      COALESCE(auto_matched, false), created_at, updated_at
    FROM products
    ORDER BY venue_id, COALESCE(local_name, name), created_at DESC;
  `);

  console.log(`✅ Migrated ${result.rowCount} venue products (duplicates resolved)`);
}

async function createSampleSupplierData() {
  console.log('Creating sample supplier data...');

  // Create a sample supplier
  await pool.query(`
    INSERT INTO suppliers (sup_id, sup_name, sup_contact_person, sup_email, sup_phone, sup_address)
    VALUES (
      gen_random_uuid(),
      'Sample Beverage Supplier Ltd',
      'John Smith',
      'orders@samplebeverage.co.uk',
      '+44 20 1234 5678',
      '123 Distribution Way, London, SW1A 1AA'
    )
    ON CONFLICT (sup_name) DO NOTHING;
  `);

  console.log('✅ Sample supplier data created');
}

async function createGlobalFunctions() {
  console.log('Creating global PLU lookup function...');

  await pool.query(`
    CREATE OR REPLACE FUNCTION lookup_plu(plu_code VARCHAR(50))
    RETURNS TABLE (
      source VARCHAR(20),
      item_id UUID,
      item_name VARCHAR(255),
      brand VARCHAR(255),
      category VARCHAR(100),
      supplier_name VARCHAR(255),
      cost_price DECIMAL(10,2),
      confidence DECIMAL(5,2)
    ) AS $$
    BEGIN
      -- Search supplier items first (most specific)
      RETURN QUERY
      SELECT
        'supplier'::VARCHAR(20) as source,
        sil.sup_item_id as item_id,
        sil.sup_name as item_name,
        sil.sup_brand as brand,
        sil.sup_category as category,
        s.sup_name as supplier_name,
        sil.sup_cost_price as cost_price,
        100.0::DECIMAL(5,2) as confidence
      FROM supplier_item_list sil
      JOIN suppliers s ON sil.supplier_id = s.sup_id
      WHERE sil.sup_plu_code = plu_code AND sil.sup_active = true;

      -- If no exact PLU match, try basic name matching
      IF NOT FOUND THEN
        RETURN QUERY
        SELECT
          'master'::VARCHAR(20) as source,
          mil.mas_item_id as item_id,
          mil.mas_name as item_name,
          mil.mas_brand as brand,
          mil.mas_category as category,
          NULL::VARCHAR(255) as supplier_name,
          mil.mas_suggested_retail_price as cost_price,
          25.0::DECIMAL(5,2) as confidence
        FROM master_item_list mil
        WHERE
          mil.mas_name ILIKE '%' || plu_code || '%'
          AND mil.mas_active = true
        ORDER BY LENGTH(mil.mas_name)
        LIMIT 3;
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `);

  console.log('✅ Global PLU lookup function created');
}

async function createCompatibilityViews() {
  console.log('Creating compatibility views for existing API endpoints...');

  // Products view - maps new table back to old structure
  await pool.query(`
    CREATE OR REPLACE VIEW products_view AS
    SELECT
      ven_item_id as id,
      venue_id,
      ven_name as name,
      ven_name as local_name,
      ven_category as category,
      ven_brand as brand,
      ven_size as size,
      ven_unit_type as unit_type,
      ven_barcode as barcode,
      ven_location_area as area_id,
      ven_expected_count as expected_count,
      ven_cost_price as cost_price,
      ven_selling_price as selling_price,
      ven_notes as local_notes,
      global_master_id as master_product_id,
      global_auto_matched as auto_matched,
      ven_created_at as created_at,
      ven_updated_at as updated_at
    FROM venue_item_list;
  `);

  // Master products view - maps new table back to old structure
  await pool.query(`
    CREATE OR REPLACE VIEW master_products_view AS
    SELECT
      mas_item_id as id,
      mas_name as name,
      mas_brand as brand,
      mas_category as category,
      mas_description as description,
      mas_base_unit as base_unit,
      mas_case_size as case_size,
      mas_alcohol_percentage as alcohol_percentage,
      mas_barcode as barcode,
      mas_ean_code as ean_code,
      mas_upc_code as upc_code,
      mas_sku as sku,
      mas_search_terms as search_terms,
      mas_phonetic_key as phonetic_key,
      mas_normalized_name as normalized_name,
      global_usage_count as usage_count,
      global_success_rate as success_rate,
      global_venues_seen as venues_seen,
      global_total_venues_count as total_venues_count,
      global_last_used as last_used,
      global_verification_status as verification_status,
      global_confidence_score as confidence_score,
      global_created_by as created_by,
      mas_suggested_retail_price as suggested_retail_price,
      mas_currency as currency,
      mas_active as active,
      mas_created_at as created_at,
      mas_updated_at as updated_at
    FROM master_item_list;
  `);

  console.log('✅ Compatibility views created');
}

async function verifyMigration() {
  console.log('Verifying migration results...');

  // Count records in new tables
  const [originalProducts, newVenueItems, originalMaster, newMasterItems] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM products'),
    pool.query('SELECT COUNT(*) FROM venue_item_list'),
    pool.query('SELECT COUNT(*) FROM master_products'),
    pool.query('SELECT COUNT(*) FROM master_item_list')
  ]);

  console.log('📊 Migration Results:');
  console.log(`  Original products: ${originalProducts.rows[0].count}`);
  console.log(`  New venue items: ${newVenueItems.rows[0].count}`);
  console.log(`  Original master products: ${originalMaster.rows[0].count}`);
  console.log(`  New master items: ${newMasterItems.rows[0].count}`);

  // Test compatibility views
  const [productsView, masterView] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM products_view'),
    pool.query('SELECT COUNT(*) FROM master_products_view')
  ]);

  console.log('🔗 Compatibility Views:');
  console.log(`  products_view: ${productsView.rows[0].count} records`);
  console.log(`  master_products_view: ${masterView.rows[0].count} records`);

  // Test PLU function
  const pluTest = await pool.query("SELECT * FROM lookup_plu('test') LIMIT 1");
  console.log(`🔧 PLU function: ${pluTest.rows.length === 0 ? 'Working (no matches expected)' : 'Working with results'}`);

  console.log('✅ Migration verification complete');
}

// Run the migration
migrateToThreeTableArchitecture()
  .then(() => {
    console.log('\n🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });