-- Supplier Product Mappings Bridge Table
-- Maps various supplier formats to standardized master_products

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Suppliers table to track different data sources
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- e.g., "Bookers", "Tesco", "CSV_Import_2024"
    type VARCHAR(50) NOT NULL, -- e.g., "invoice", "csv", "ocr", "manual"
    description TEXT,

    -- Field mapping configuration (JSON format)
    field_mappings JSONB, -- Maps supplier fields to our fields

    -- Status and metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier product mappings - the bridge table
CREATE TABLE IF NOT EXISTS supplier_product_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Link to supplier and master product
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    master_product_id UUID REFERENCES master_products(id) ON DELETE CASCADE,

    -- Original supplier data (raw format)
    supplier_product_code VARCHAR(100), -- Their internal code (e.g., Bookers code)
    supplier_description TEXT NOT NULL, -- Raw description from supplier
    supplier_category VARCHAR(100), -- Their category name
    supplier_pack_size VARCHAR(50), -- Their pack size format
    supplier_unit_size VARCHAR(50), -- Their unit size format
    supplier_brand VARCHAR(100), -- Their brand name

    -- Additional supplier-specific fields (flexible JSON storage)
    supplier_data JSONB, -- Store any extra fields like price, VAT, etc.

    -- Mapping confidence and validation
    mapping_confidence DECIMAL(5,2) DEFAULT 1.0, -- 0.0 to 1.0 confidence score
    auto_mapped BOOLEAN DEFAULT false, -- Was this auto-mapped or manual?
    verified BOOLEAN DEFAULT false, -- Has this mapping been verified?

    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP,

    -- Status and metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),

    -- Ensure unique mapping per supplier
    UNIQUE(supplier_id, supplier_product_code)
);

-- Parsing rules for automatic mapping
CREATE TABLE IF NOT EXISTS parsing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,

    -- Rule definition
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- e.g., "regex", "keyword", "format"
    rule_pattern TEXT NOT NULL, -- The actual pattern/rule
    target_field VARCHAR(50) NOT NULL, -- Which master_products field this maps to

    -- Processing instructions
    processing_function VARCHAR(100), -- e.g., "extract_container_type", "normalize_size"
    priority INTEGER DEFAULT 100, -- Rule priority (lower number = higher priority)

    -- Status
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_mappings_supplier_id ON supplier_product_mappings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_mappings_master_product_id ON supplier_product_mappings(master_product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_mappings_supplier_code ON supplier_product_mappings(supplier_product_code);
CREATE INDEX IF NOT EXISTS idx_supplier_mappings_description ON supplier_product_mappings USING gin(to_tsvector('english', supplier_description));
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_parsing_rules_supplier ON parsing_rules(supplier_id);

-- Sample suppliers
INSERT INTO suppliers (name, type, description, field_mappings) VALUES
('Bookers', 'invoice', 'Bookers wholesale invoice OCR', '{
    "product_code": "internal_code",
    "description": "description",
    "pack_size": "pack",
    "unit_size": "size",
    "quantity": "qty",
    "price": "price",
    "total_value": "value",
    "vat": "VAT",
    "rrp": "STD_RRP"
}'),
('CSV_Import', 'csv', 'Generic CSV import', '{
    "name": "product_name",
    "category": "category",
    "size": "size",
    "pack": "pack_size"
}'),
('Manual_Entry', 'manual', 'Manual product entry', '{
    "name": "name",
    "category": "category",
    "container_type": "container_type",
    "container_size": "container_size",
    "case_size": "case_size"
}')
ON CONFLICT (name) DO NOTHING;

-- Sample parsing rules for Bookers
INSERT INTO parsing_rules (supplier_id, rule_name, rule_type, rule_pattern, target_field, processing_function, priority) VALUES
((SELECT id FROM suppliers WHERE name = 'Bookers'), 'Extract Container Type from Description', 'regex', '\b(bottle|can|keg|box|bag)\b', 'container_type', 'extract_container_type', 10),
((SELECT id FROM suppliers WHERE name = 'Bookers'), 'Extract Size from Size Field', 'regex', '(\d+(?:\.\d+)?)\s*(ml|cl|l|gallons?)', 'container_size', 'normalize_size', 20),
((SELECT id FROM suppliers WHERE name = 'Bookers'), 'Extract Pack Size', 'regex', '(\d+)', 'case_size', 'extract_number', 30),
((SELECT id FROM suppliers WHERE name = 'Bookers'), 'Determine Wine Category', 'keyword', 'wine|chardonnay|merlot|sauvignon|prosecco|champagne', 'master_category', 'set_wine_category', 40),
((SELECT id FROM suppliers WHERE name = 'Bookers'), 'Determine Beer Category', 'keyword', 'beer|lager|ale|stout|bitter', 'master_category', 'set_beer_category', 50),
((SELECT id FROM suppliers WHERE name = 'Bookers'), 'Determine Spirits Category', 'keyword', 'vodka|gin|whiskey|rum|brandy|spirit', 'master_category', 'set_spirits_category', 60),
((SELECT id FROM suppliers WHERE name = 'Bookers'), 'Determine Soft Drinks Category', 'keyword', 'cola|coke|pepsi|fanta|sprite|water|juice|lemonade|tonic|soda|mineral', 'master_category', 'set_soft_drinks_category', 70)
ON CONFLICT DO NOTHING;

-- Sample mapping data for Bookers Coca Cola example
INSERT INTO supplier_product_mappings
(supplier_id, supplier_product_code, supplier_description, supplier_pack_size, supplier_unit_size, supplier_data, master_product_id)
VALUES
((SELECT id FROM suppliers WHERE name = 'Bookers'),
 'BK123456',
 'Coca Cola Can',
 '24',
 '330ml',
 '{"price": 18.50, "value": 37.00, "VAT": 7.40, "STD_RRP": 1.20, "POR": "12345"}',
 (SELECT id FROM master_products WHERE name LIKE '%Coca Cola%' LIMIT 1))
ON CONFLICT (supplier_id, supplier_product_code) DO NOTHING;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_mappings_updated_at BEFORE UPDATE ON supplier_product_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE suppliers IS 'Different data sources (Bookers, CSV imports, etc.) with their field mapping configurations';
COMMENT ON TABLE supplier_product_mappings IS 'Bridge table mapping supplier-specific product data to standardized master_products';
COMMENT ON TABLE parsing_rules IS 'Rules for automatically parsing and mapping supplier data to master product fields';