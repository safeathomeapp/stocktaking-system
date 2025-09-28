-- Add unit_size column and other missing columns to existing master_products table

-- Add missing columns if they don't exist
ALTER TABLE master_products
ADD COLUMN IF NOT EXISTS master_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS container_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS container_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS case_size INTEGER,
ADD COLUMN IF NOT EXISTS unit_size VARCHAR(100), -- NEW: Unit size description (e.g., "24 bottles per case", "11 gallons per container")
ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS alcohol_percentage DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
ADD COLUMN IF NOT EXISTS suggested_retail_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'GBP',
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_master_products_master_category ON master_products(master_category);
CREATE INDEX IF NOT EXISTS idx_master_products_brand ON master_products(brand);
CREATE INDEX IF NOT EXISTS idx_master_products_barcode ON master_products(barcode);
CREATE INDEX IF NOT EXISTS idx_master_products_sku ON master_products(sku);
CREATE INDEX IF NOT EXISTS idx_master_products_active ON master_products(active);
CREATE INDEX IF NOT EXISTS idx_master_products_search ON master_products USING gin(search_vector);

-- Update existing records with sample unit sizes if they don't have them
UPDATE master_products SET
    master_category = 'wine',
    container_type = 'bottle',
    container_size = '750ml',
    case_size = 12,
    unit_size = '12 bottles per case'
WHERE name LIKE '%Chardonnay%' OR name LIKE '%wine%' AND unit_size IS NULL;

UPDATE master_products SET
    master_category = 'draught',
    container_type = 'keg',
    container_size = '50L',
    case_size = 1,
    unit_size = '1 keg (50 litres)'
WHERE name LIKE '%draught%' OR name LIKE '%keg%' AND unit_size IS NULL;

UPDATE master_products SET
    master_category = 'beer',
    container_type = 'bottle',
    container_size = '330ml',
    case_size = 24,
    unit_size = '24 bottles per case'
WHERE name LIKE '%beer%' OR name LIKE '%lager%' AND master_category IS NULL;

UPDATE master_products SET
    master_category = 'spirits',
    container_type = 'bottle',
    container_size = '700ml',
    case_size = 12,
    unit_size = '12 bottles per case'
WHERE name LIKE '%vodka%' OR name LIKE '%gin%' OR name LIKE '%whiskey%' AND master_category IS NULL;

-- Add some example products with unit sizes
INSERT INTO master_products (name, description, category, master_category, container_type, container_size, case_size, unit_size, brand, alcohol_percentage) VALUES
('Becks Lager Bottles', 'German premium lager', 'lager', 'beer', 'bottle', '275ml', 24, '24 bottles per case', 'Becks', 5.0),
('Guinness Draught Keg', 'Irish dry stout on draught', 'stout', 'draught', 'keg', '11 gallons', 1, '1 keg (11 gallons)', 'Guinness', 4.2),
('House Wine Box', 'House red wine in bag-in-box', 'red blend', 'wine', 'box', '3L', 4, '4 boxes per case (3L each)', 'House Selection', 12.5),
('Vodka 70cl Case', 'Premium vodka bottles', 'vodka', 'spirits', 'bottle', '70cl', 12, '12 bottles per case', 'Premium Brand', 40.0)

ON CONFLICT DO NOTHING;

-- Create or update the search vector update function
CREATE OR REPLACE FUNCTION update_master_products_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.category, '') || ' ' ||
        COALESCE(NEW.brand, '') || ' ' ||
        COALESCE(NEW.container_size, '') || ' ' ||
        COALESCE(NEW.unit_size, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_master_products_search_vector ON master_products;
CREATE TRIGGER trigger_update_master_products_search_vector
    BEFORE INSERT OR UPDATE ON master_products
    FOR EACH ROW EXECUTE FUNCTION update_master_products_search_vector();

-- Update search vectors for existing records
UPDATE master_products SET search_vector = to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(category, '') || ' ' ||
    COALESCE(brand, '') || ' ' ||
    COALESCE(container_size, '') || ' ' ||
    COALESCE(unit_size, '')
);

COMMENT ON COLUMN master_products.unit_size IS 'Unit size description (e.g., "24 bottles per case", "11 gallons per container", "12 x 750ml bottles")';