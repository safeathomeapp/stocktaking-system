-- Master Products Database Schema
-- This creates a centralized product catalog that all venues can reference

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create master_products table
CREATE TABLE IF NOT EXISTS master_products (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core product information
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Product categorization
    category VARCHAR(100), -- e.g., chardonnay, sauvignon blanc, beer, cider, gin, vodka
    master_category VARCHAR(50), -- e.g., draught, spirits, wine, misc

    -- Container specifications
    container_type VARCHAR(50), -- e.g., bottle, can, keg, box, bag
    container_size VARCHAR(50), -- e.g., 275ml, 750ml, 568ml, 50L
    case_size INTEGER, -- e.g., 12, 24, 6 (units per case)

    -- Additional product details
    brand VARCHAR(100),
    alcohol_percentage DECIMAL(4,2), -- e.g., 12.5 for 12.5% ABV
    barcode VARCHAR(50),
    sku VARCHAR(100), -- Stock Keeping Unit

    -- Pricing information (optional)
    suggested_retail_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'GBP',

    -- Product status and metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Search optimization
    search_vector tsvector
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_master_products_name ON master_products(name);
CREATE INDEX IF NOT EXISTS idx_master_products_category ON master_products(category);
CREATE INDEX IF NOT EXISTS idx_master_products_master_category ON master_products(master_category);
CREATE INDEX IF NOT EXISTS idx_master_products_brand ON master_products(brand);
CREATE INDEX IF NOT EXISTS idx_master_products_barcode ON master_products(barcode);
CREATE INDEX IF NOT EXISTS idx_master_products_sku ON master_products(sku);
CREATE INDEX IF NOT EXISTS idx_master_products_active ON master_products(active);
CREATE INDEX IF NOT EXISTS idx_master_products_search ON master_products USING gin(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_master_products_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.category, '') || ' ' ||
        COALESCE(NEW.brand, '') || ' ' ||
        COALESCE(NEW.container_size, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
CREATE TRIGGER trigger_update_master_products_search_vector
    BEFORE INSERT OR UPDATE ON master_products
    FOR EACH ROW EXECUTE FUNCTION update_master_products_search_vector();

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_master_products_updated_at
    BEFORE UPDATE ON master_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample master products
INSERT INTO master_products (name, description, category, master_category, container_type, container_size, case_size, brand, alcohol_percentage) VALUES
-- Wines
('Chardonnay House White', 'Crisp and refreshing house white wine', 'chardonnay', 'wine', 'bottle', '750ml', 12, 'House Selection', 12.5),
('Sauvignon Blanc Reserve', 'Dry white wine with citrus notes', 'sauvignon blanc', 'wine', 'bottle', '750ml', 12, 'Reserve Collection', 13.0),
('Merlot Classic', 'Smooth red wine with berry flavors', 'merlot', 'wine', 'bottle', '750ml', 12, 'Classic Range', 13.5),
('Prosecco DOC', 'Italian sparkling wine', 'prosecco', 'wine', 'bottle', '750ml', 6, 'Villa Sandi', 11.0),

-- Beers
('Stella Artois', 'Premium European lager', 'lager', 'draught', 'keg', '50L', 1, 'Stella Artois', 5.0),
('Guinness Draught', 'Irish dry stout', 'stout', 'draught', 'keg', '50L', 1, 'Guinness', 4.2),
('Corona Extra', 'Mexican pale lager', 'lager', 'beer', 'bottle', '330ml', 24, 'Corona', 4.5),
('Peroni Nastro Azzurro', 'Italian premium lager', 'lager', 'beer', 'bottle', '330ml', 24, 'Peroni', 5.1),

-- Spirits
('Smirnoff Red Vodka', 'Premium triple distilled vodka', 'vodka', 'spirits', 'bottle', '700ml', 12, 'Smirnoff', 37.5),
('Gordon''s London Dry Gin', 'Classic London dry gin', 'gin', 'spirits', 'bottle', '700ml', 12, 'Gordon''s', 37.5),
('Jameson Irish Whiskey', 'Triple distilled Irish whiskey', 'whiskey', 'spirits', 'bottle', '700ml', 12, 'Jameson', 40.0),
('Jack Daniel''s Tennessee Whiskey', 'American Tennessee whiskey', 'whiskey', 'spirits', 'bottle', '700ml', 12, 'Jack Daniel''s', 40.0),

-- Ciders
('Strongbow Original', 'Dry English cider', 'cider', 'draught', 'keg', '50L', 1, 'Strongbow', 5.0),
('Magners Irish Cider', 'Irish apple cider', 'cider', 'beer', 'bottle', '568ml', 12, 'Magners', 4.5),

-- Soft Drinks & Misc
('Coca-Cola', 'Classic cola soft drink', 'cola', 'misc', 'bottle', '330ml', 24, 'Coca-Cola', 0.0),
('Orange Juice', 'Fresh orange juice', 'juice', 'misc', 'carton', '1L', 12, 'Tropicana', 0.0),
('Still Water', 'Natural still water', 'water', 'misc', 'bottle', '500ml', 24, 'Evian', 0.0),
('Tonic Water', 'Premium tonic water', 'mixer', 'misc', 'bottle', '200ml', 24, 'Fever-Tree', 0.0)

ON CONFLICT DO NOTHING;

-- Create view for easy category browsing
CREATE OR REPLACE VIEW master_products_summary AS
SELECT
    master_category,
    category,
    COUNT(*) as product_count,
    ARRAY_AGG(DISTINCT brand ORDER BY brand) as brands
FROM master_products
WHERE active = true
GROUP BY master_category, category
ORDER BY master_category, category;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON master_products TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE master_products_id_seq TO your_app_user;

COMMENT ON TABLE master_products IS 'Centralized master product catalog for all venues';
COMMENT ON COLUMN master_products.id IS 'Unique identifier for the product';
COMMENT ON COLUMN master_products.category IS 'Specific product type (chardonnay, lager, gin, etc.)';
COMMENT ON COLUMN master_products.master_category IS 'High-level grouping (wine, spirits, draught, beer, misc)';
COMMENT ON COLUMN master_products.container_type IS 'Physical container (bottle, can, keg, box, bag)';
COMMENT ON COLUMN master_products.container_size IS 'Size of individual container (750ml, 50L, etc.)';
COMMENT ON COLUMN master_products.case_size IS 'Number of units per case/pack';