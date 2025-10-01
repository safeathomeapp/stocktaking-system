/**
 * THREE-TABLE PRODUCT ARCHITECTURE DESIGN
 *
 * Global Naming Convention:
 * - ven_ = Venue-specific fields
 * - mas_ = Master catalog fields
 * - sup_ = Supplier-specific fields
 * - global_ = Cross-system identifiers
 */

const architectureDesign = {

  // ====================
  // TABLE 1: VENUE_ITEM_LIST
  // ====================
  venue_item_list: {
    description: "Venue-specific product catalog - fast local operations",
    naming_prefix: "ven_",

    schema: `
      CREATE TABLE venue_item_list (
        -- Primary identification
        ven_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,

        -- Venue-specific product details
        ven_name VARCHAR(255) NOT NULL,              -- Venue's preferred name
        ven_category VARCHAR(100),                   -- Venue's category classification
        ven_brand VARCHAR(100),                      -- Venue's brand preference
        ven_size VARCHAR(50),                        -- Venue's size description
        ven_unit_type VARCHAR(50),                   -- Venue's unit preference
        ven_barcode VARCHAR(100),                    -- Venue's barcode
        ven_sku VARCHAR(100),                        -- Venue's internal SKU
        ven_location_area INTEGER REFERENCES venue_areas(id),
        ven_expected_count INTEGER DEFAULT 0,        -- Venue's expected stock level
        ven_cost_price DECIMAL(10,2),               -- Venue's cost price
        ven_selling_price DECIMAL(10,2),            -- Venue's selling price
        ven_notes TEXT,                              -- Venue-specific notes
        ven_active BOOLEAN DEFAULT true,             -- Active in this venue

        -- Global linking
        global_master_id UUID REFERENCES master_item_list(mas_item_id),
        global_created_from VARCHAR(20) DEFAULT 'manual', -- 'manual', 'master', 'supplier'
        global_auto_matched BOOLEAN DEFAULT false,   -- Auto-linked to master
        global_verified BOOLEAN DEFAULT false,       -- User verified link

        -- Timestamps
        ven_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ven_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ven_last_counted TIMESTAMP,

        -- Indexes for performance
        CONSTRAINT venue_item_list_venue_name_unique UNIQUE(venue_id, ven_name)
      );

      -- Performance indexes
      CREATE INDEX idx_venue_item_list_venue_id ON venue_item_list(venue_id);
      CREATE INDEX idx_venue_item_list_global_master_id ON venue_item_list(global_master_id);
      CREATE INDEX idx_venue_item_list_ven_category ON venue_item_list(ven_category);
      CREATE INDEX idx_venue_item_list_ven_barcode ON venue_item_list(ven_barcode) WHERE ven_barcode IS NOT NULL;
    `,

    migration_from_current: `
      -- Migrate existing 'products' table to new 'venue_item_list'
      INSERT INTO venue_item_list (
        ven_item_id, venue_id, ven_name, ven_category, ven_brand, ven_size,
        ven_unit_type, ven_barcode, ven_location_area, ven_expected_count,
        ven_cost_price, ven_selling_price, ven_notes, global_master_id,
        global_auto_matched, ven_created_at, ven_updated_at
      )
      SELECT
        id, venue_id, COALESCE(local_name, name), category, brand, size,
        unit_type, barcode, area_id, expected_count,
        cost_price, selling_price, local_notes, master_product_id,
        COALESCE(auto_matched, false), created_at, updated_at
      FROM products;
    `
  },

  // ====================
  // TABLE 2: MASTER_ITEM_LIST
  // ====================
  master_item_list: {
    description: "Global master catalog - single source of truth",
    naming_prefix: "mas_",

    schema: `
      CREATE TABLE master_item_list (
        -- Primary identification
        mas_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- Master product details
        mas_name VARCHAR(255) NOT NULL,              -- Official product name
        mas_description TEXT,                        -- Detailed description
        mas_brand VARCHAR(100),                      -- Official brand
        mas_category VARCHAR(100),                   -- Primary category
        mas_subcategory VARCHAR(100),               -- Sub-category
        mas_master_category VARCHAR(100),           -- Top-level grouping

        -- Physical specifications
        mas_container_type VARCHAR(50),             -- bottle, can, keg, etc.
        mas_container_size VARCHAR(50),             -- 330ml, 750ml, etc.
        mas_unit_size VARCHAR(50),                  -- individual, case, pack
        mas_case_size INTEGER,                      -- units per case
        mas_alcohol_percentage DECIMAL(5,2),       -- alcohol %

        -- Identification codes
        mas_barcode VARCHAR(100),                   -- Primary barcode
        mas_ean_code VARCHAR(100),                  -- EAN code
        mas_upc_code VARCHAR(100),                  -- UPC code
        mas_sku VARCHAR(100),                       -- Master SKU
        mas_alternative_codes TEXT[],               -- Array of alternative codes

        -- Search and matching
        mas_search_terms TEXT[],                    -- Search keywords
        mas_phonetic_key VARCHAR(100),              -- Phonetic matching
        mas_normalized_name VARCHAR(255),           -- Normalized for matching

        -- Usage tracking
        mas_usage_count INTEGER DEFAULT 0,         -- Times used across venues
        mas_success_rate DECIMAL(5,2) DEFAULT 0,   -- Matching success rate
        mas_venues_seen UUID[],                     -- Array of venue IDs
        mas_total_venues_count INTEGER DEFAULT 0,  -- Total venues using
        mas_last_used TIMESTAMP,                   -- Last usage timestamp

        -- Quality and verification
        mas_verification_status VARCHAR(50) DEFAULT 'unverified', -- verified, unverified, pending
        mas_confidence_score DECIMAL(5,2) DEFAULT 0, -- Data quality score
        mas_created_by VARCHAR(100),                -- Who created this record

        -- Pricing (suggested retail)
        mas_suggested_retail_price DECIMAL(10,2),  -- Suggested price
        mas_currency VARCHAR(10) DEFAULT 'GBP',    -- Currency

        -- Status
        mas_active BOOLEAN DEFAULT true,           -- Active in system

        -- Timestamps
        mas_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mas_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- Constraints
        CONSTRAINT master_item_list_name_brand_unique UNIQUE(mas_name, mas_brand, mas_container_size)
      );

      -- Performance indexes
      CREATE INDEX idx_master_item_list_mas_name ON master_item_list(mas_name);
      CREATE INDEX idx_master_item_list_mas_brand ON master_item_list(mas_brand);
      CREATE INDEX idx_master_item_list_mas_category ON master_item_list(mas_category);
      CREATE INDEX idx_master_item_list_mas_barcode ON master_item_list(mas_barcode) WHERE mas_barcode IS NOT NULL;
      CREATE INDEX idx_master_item_list_mas_sku ON master_item_list(mas_sku) WHERE mas_sku IS NOT NULL;
      CREATE INDEX idx_master_item_list_search ON master_item_list USING gin(mas_search_terms);

      -- Full-text search index
      CREATE INDEX idx_master_item_list_text_search ON master_item_list
      USING gin(to_tsvector('english', mas_name || ' ' || COALESCE(mas_brand, '') || ' ' || COALESCE(mas_description, '')));
    `,

    migration_from_current: `
      -- Migrate existing 'master_products' table to new 'master_item_list'
      INSERT INTO master_item_list (
        mas_item_id, mas_name, mas_description, mas_brand, mas_category, mas_subcategory,
        mas_master_category, mas_container_type, mas_container_size, mas_unit_size,
        mas_case_size, mas_alcohol_percentage, mas_barcode, mas_ean_code, mas_upc_code,
        mas_sku, mas_alternative_codes, mas_search_terms, mas_phonetic_key, mas_normalized_name,
        mas_usage_count, mas_success_rate, mas_venues_seen, mas_total_venues_count,
        mas_last_used, mas_verification_status, mas_confidence_score, mas_created_by,
        mas_suggested_retail_price, mas_currency, mas_active, mas_created_at, mas_updated_at
      )
      SELECT
        id, name, description, brand, category, subcategory,
        master_category, container_type, container_size, unit_size,
        case_size, alcohol_percentage, barcode, ean_code, upc_code,
        sku, ARRAY[barcode, ean_code, upc_code]::TEXT[], search_terms, phonetic_key, normalized_name,
        COALESCE(usage_count, 0), COALESCE(success_rate, 0), venues_seen, COALESCE(total_venues_count, 0),
        last_used, COALESCE(verification_status, 'unverified'), COALESCE(confidence_score, 0), created_by,
        suggested_retail_price, COALESCE(currency, 'GBP'), COALESCE(active, true), created_at, updated_at
      FROM master_products;
    `
  },

  // ====================
  // TABLE 3: SUPPLIER_ITEM_LIST
  // ====================
  supplier_item_list: {
    description: "Supplier-specific product mappings with PLU codes",
    naming_prefix: "sup_",

    schema: `
      -- First create suppliers table
      CREATE TABLE suppliers (
        supplier_id SERIAL PRIMARY KEY,
        supplier_name VARCHAR(255) NOT NULL UNIQUE,
        supplier_code VARCHAR(50),                  -- Short code (e.g., 'BOOKERS', 'BRAKES')
        supplier_contact_email VARCHAR(255),
        supplier_contact_phone VARCHAR(50),
        supplier_website VARCHAR(255),
        supplier_active BOOLEAN DEFAULT true,
        supplier_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        supplier_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Supplier item mappings table
      CREATE TABLE supplier_item_list (
        -- Primary identification
        sup_mapping_id SERIAL PRIMARY KEY,
        supplier_id INTEGER NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,

        -- Supplier-specific product details
        sup_name VARCHAR(255) NOT NULL,             -- Supplier's product name
        sup_description TEXT,                       -- Supplier's description
        sup_brand VARCHAR(100),                     -- Supplier's brand
        sup_category VARCHAR(100),                  -- Supplier's category
        sup_size VARCHAR(50),                       -- Supplier's size description

        -- Supplier codes and pricing
        sup_sku VARCHAR(100),                       -- Supplier's SKU/PLU
        sup_barcode VARCHAR(100),                   -- Supplier's barcode
        sup_alternative_skus TEXT[],                -- Array of alternative PLU codes
        sup_unit_cost DECIMAL(10,2),               -- Supplier's unit cost
        sup_case_cost DECIMAL(10,2),               -- Supplier's case cost
        sup_pack_size INTEGER DEFAULT 1,           -- Units per pack
        sup_case_size INTEGER,                      -- Packs per case
        sup_minimum_order INTEGER DEFAULT 1,       -- Minimum order quantity

        -- Global linking
        global_master_id UUID REFERENCES master_item_list(mas_item_id),
        global_confidence_score DECIMAL(5,2) DEFAULT 0, -- Mapping confidence
        global_verified BOOLEAN DEFAULT false,      -- User verified mapping
        global_auto_matched BOOLEAN DEFAULT false,  -- Auto-matched by system

        -- Status and tracking
        sup_active BOOLEAN DEFAULT true,            -- Active with supplier
        sup_last_cost_update TIMESTAMP,            -- Last price update
        sup_last_ordered TIMESTAMP,                -- Last order date
        sup_order_frequency_days INTEGER,          -- Typical reorder frequency

        -- Timestamps
        sup_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sup_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- Constraints
        CONSTRAINT supplier_item_list_supplier_sku_unique UNIQUE(supplier_id, sup_sku)
      );

      -- Performance indexes
      CREATE INDEX idx_supplier_item_list_supplier_id ON supplier_item_list(supplier_id);
      CREATE INDEX idx_supplier_item_list_global_master_id ON supplier_item_list(global_master_id);
      CREATE INDEX idx_supplier_item_list_sup_sku ON supplier_item_list(sup_sku) WHERE sup_sku IS NOT NULL;
      CREATE INDEX idx_supplier_item_list_sup_barcode ON supplier_item_list(sup_barcode) WHERE sup_barcode IS NOT NULL;
      CREATE INDEX idx_supplier_item_list_sup_name ON supplier_item_list(sup_name);
    `,

    sample_data: `
      -- Sample suppliers
      INSERT INTO suppliers (supplier_name, supplier_code) VALUES
      ('Bookers Cash & Carry', 'BOOKERS'),
      ('Brakes', 'BRAKES'),
      ('Bidfood', 'BIDFOOD'),
      ('Matthew Clark', 'MATTHEW_CLARK');

      -- Sample supplier items (PLU examples)
      INSERT INTO supplier_item_list (
        supplier_id, sup_name, sup_sku, sup_barcode, sup_unit_cost,
        sup_pack_size, sup_case_size, global_master_id
      ) VALUES
      (1, 'Stella Artois 330ml Bottle', 'STL330', '5000116001234', 1.25, 24, 4, null),
      (1, 'Coca Cola 330ml Can', 'COK330', '5000116005678', 0.45, 24, 6, null),
      (2, 'Heineken 330ml Bottle', 'HNK330B', '8712000000123', 1.30, 24, 4, null);
    `
  },

  // ====================
  // GLOBAL FUNCTIONS
  // ====================
  global_functions: {
    description: "Cross-table functions with global naming",

    plu_lookup_function: `
      -- Global PLU/SKU lookup function
      CREATE OR REPLACE FUNCTION global_find_by_plu(plu_code VARCHAR)
      RETURNS TABLE (
        source_table VARCHAR,
        global_master_id UUID,
        mas_name VARCHAR,
        supplier_name VARCHAR,
        sup_unit_cost DECIMAL,
        ven_venues_count BIGINT
      ) AS $$
      BEGIN
        RETURN QUERY
        -- Search supplier items first
        SELECT
          'supplier'::VARCHAR as source_table,
          sil.global_master_id,
          mil.mas_name,
          s.supplier_name,
          sil.sup_unit_cost,
          0::BIGINT as ven_venues_count
        FROM supplier_item_list sil
        JOIN suppliers s ON sil.supplier_id = s.supplier_id
        LEFT JOIN master_item_list mil ON sil.global_master_id = mil.mas_item_id
        WHERE sil.sup_sku = plu_code
           OR sil.sup_barcode = plu_code
           OR plu_code = ANY(sil.sup_alternative_skus)

        UNION ALL

        -- Search master items
        SELECT
          'master'::VARCHAR as source_table,
          mil.mas_item_id as global_master_id,
          mil.mas_name,
          'Master Catalog'::VARCHAR as supplier_name,
          mil.mas_suggested_retail_price as sup_unit_cost,
          mil.mas_total_venues_count::BIGINT as ven_venues_count
        FROM master_item_list mil
        WHERE mil.mas_sku = plu_code
           OR mil.mas_barcode = plu_code
           OR mil.mas_ean_code = plu_code
           OR mil.mas_upc_code = plu_code
           OR plu_code = ANY(mil.mas_alternative_codes)

        UNION ALL

        -- Search venue items
        SELECT
          'venue'::VARCHAR as source_table,
          vil.global_master_id,
          vil.ven_name as mas_name,
          'Venue Specific'::VARCHAR as supplier_name,
          vil.ven_cost_price as sup_unit_cost,
          1::BIGINT as ven_venues_count
        FROM venue_item_list vil
        WHERE vil.ven_sku = plu_code
           OR vil.ven_barcode = plu_code

        ORDER BY source_table, mas_name;
      END;
      $$ LANGUAGE plpgsql;
    `,

    smart_search_function: `
      -- Global smart search across all three tables
      CREATE OR REPLACE FUNCTION global_smart_search(
        search_query VARCHAR,
        venue_filter UUID DEFAULT NULL,
        limit_results INTEGER DEFAULT 20
      )
      RETURNS TABLE (
        search_rank INTEGER,
        source_table VARCHAR,
        global_master_id UUID,
        item_name VARCHAR,
        item_brand VARCHAR,
        item_category VARCHAR,
        match_score DECIMAL
      ) AS $$
      BEGIN
        RETURN QUERY
        WITH search_results AS (
          -- Venue items (highest priority if venue specified)
          SELECT
            1 as search_rank,
            'venue'::VARCHAR as source_table,
            vil.global_master_id,
            vil.ven_name as item_name,
            vil.ven_brand as item_brand,
            vil.ven_category as item_category,
            similarity(vil.ven_name, search_query) as match_score
          FROM venue_item_list vil
          WHERE vil.ven_active = true
            AND (venue_filter IS NULL OR vil.venue_id = venue_filter)
            AND (vil.ven_name ILIKE '%' || search_query || '%'
                 OR vil.ven_brand ILIKE '%' || search_query || '%')

          UNION ALL

          -- Master items
          SELECT
            2 as search_rank,
            'master'::VARCHAR as source_table,
            mil.mas_item_id as global_master_id,
            mil.mas_name as item_name,
            mil.mas_brand as item_brand,
            mil.mas_category as item_category,
            similarity(mil.mas_name, search_query) as match_score
          FROM master_item_list mil
          WHERE mil.mas_active = true
            AND (mil.mas_name ILIKE '%' || search_query || '%'
                 OR mil.mas_brand ILIKE '%' || search_query || '%'
                 OR search_query = ANY(mil.mas_search_terms))

          UNION ALL

          -- Supplier items
          SELECT
            3 as search_rank,
            'supplier'::VARCHAR as source_table,
            sil.global_master_id,
            sil.sup_name as item_name,
            sil.sup_brand as item_brand,
            sil.sup_category as item_category,
            similarity(sil.sup_name, search_query) as match_score
          FROM supplier_item_list sil
          WHERE sil.sup_active = true
            AND (sil.sup_name ILIKE '%' || search_query || '%'
                 OR sil.sup_brand ILIKE '%' || search_query || '%')
        )
        SELECT * FROM search_results
        WHERE match_score > 0.1
        ORDER BY search_rank, match_score DESC, item_name
        LIMIT limit_results;
      END;
      $$ LANGUAGE plpgsql;
    `
  }
};

console.log('🏗️  THREE-TABLE PRODUCT ARCHITECTURE DESIGN');
console.log('================================================');
console.log('');
console.log('📋 Table Structure:');
console.log('1. VENUE_ITEM_LIST (ven_*) - Fast venue-specific operations');
console.log('2. MASTER_ITEM_LIST (mas_*) - Global product catalog');
console.log('3. SUPPLIER_ITEM_LIST (sup_*) - PLU codes and supplier pricing');
console.log('');
console.log('🔗 Global Naming Convention:');
console.log('- ven_* = Venue-specific fields');
console.log('- mas_* = Master catalog fields');
console.log('- sup_* = Supplier-specific fields');
console.log('- global_* = Cross-system identifiers');
console.log('');
console.log('💾 Benefits:');
console.log('✅ Clear data lineage (know where every field comes from)');
console.log('✅ Fast venue operations (no cross-venue queries)');
console.log('✅ Comprehensive PLU lookup system');
console.log('✅ Maintains existing functionality');
console.log('✅ Future-proof for voice recognition and invoice processing');
console.log('');
console.log('Design saved to: backend/design-three-table-architecture.js');

module.exports = architectureDesign;