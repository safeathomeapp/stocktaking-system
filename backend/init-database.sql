-- Stock Taking System Database Schema
-- Run this script to create the necessary tables

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    county VARCHAR(100),
    postcode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United Kingdom',
    phone VARCHAR(50),
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    billing_rate DECIMAL(10,2) DEFAULT 0.00,
    billing_currency VARCHAR(10) DEFAULT 'GBP',
    billing_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create venue_areas table
CREATE TABLE IF NOT EXISTS venue_areas (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    area_id INTEGER REFERENCES venue_areas(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),
    size VARCHAR(50),
    unit_type VARCHAR(50) DEFAULT 'bottles',
    barcode VARCHAR(100),
    expected_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_sessions table
CREATE TABLE IF NOT EXISTS stock_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    stocktaker_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_entries table
CREATE TABLE IF NOT EXISTS stock_entries (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES stock_sessions(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_level DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity_units INTEGER DEFAULT 0,
    location_notes TEXT,
    condition_flags TEXT,
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table (for future use)
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    session_id UUID REFERENCES stock_sessions(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    textract_data JSONB,
    processed_items JSONB,
    supplier_name VARCHAR(255),
    invoice_date DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create delivery_items table (for future use)
CREATE TABLE IF NOT EXISTS delivery_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    ordered_quantity INTEGER,
    delivered_quantity INTEGER,
    unit_cost DECIMAL(10,2),
    line_total DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name);
CREATE INDEX IF NOT EXISTS idx_venue_areas_venue_id ON venue_areas(venue_id);
CREATE INDEX IF NOT EXISTS idx_products_venue_id ON products(venue_id);
CREATE INDEX IF NOT EXISTS idx_products_area_id ON products(area_id);
CREATE INDEX IF NOT EXISTS idx_stock_sessions_venue_id ON stock_sessions(venue_id);
CREATE INDEX IF NOT EXISTS idx_stock_sessions_status ON stock_sessions(status);
CREATE INDEX IF NOT EXISTS idx_stock_entries_session_id ON stock_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_product_id ON stock_entries(product_id);

-- Insert sample data (2 test venues with products)
INSERT INTO venues (name, address_line_1, city, county, postcode, country, phone, contact_person, contact_email) VALUES
('The Red Lion', '123 Main Street', 'London', 'Greater London', 'SW1A 1AA', 'United Kingdom', '020 7123 4567', 'John Smith', 'john@redlion.com'),
('The Crown & Anchor', '456 High Street', 'Manchester', 'Greater Manchester', 'M1 2AB', 'United Kingdom', '0161 234 5678', 'Sarah Jones', 'sarah@crownanchor.com')
ON CONFLICT DO NOTHING;

-- Get venue IDs for inserting areas and products
DO $$
DECLARE
    venue1_id INTEGER;
    venue2_id INTEGER;
    area1_id INTEGER;
    area2_id INTEGER;
BEGIN
    -- Get venue IDs
    SELECT id INTO venue1_id FROM venues WHERE name = 'The Red Lion' LIMIT 1;
    SELECT id INTO venue2_id FROM venues WHERE name = 'The Crown & Anchor' LIMIT 1;

    -- Insert default areas for venue 1
    INSERT INTO venue_areas (venue_id, name, display_order, description) VALUES
    (venue1_id, 'Bar Area', 1, 'Main bar and serving area'),
    (venue1_id, 'Storage Room', 2, 'Main storage and inventory area'),
    (venue1_id, 'Kitchen', 3, 'Kitchen and food preparation area'),
    (venue1_id, 'Wine Cellar', 4, 'Wine storage and cellar area'),
    (venue1_id, 'Dry Storage', 5, 'Dry goods and non-refrigerated storage')
    ON CONFLICT DO NOTHING;

    -- Insert default areas for venue 2
    INSERT INTO venue_areas (venue_id, name, display_order, description) VALUES
    (venue2_id, 'Bar Area', 1, 'Main bar and serving area'),
    (venue2_id, 'Storage Room', 2, 'Main storage and inventory area'),
    (venue2_id, 'Kitchen', 3, 'Kitchen and food preparation area'),
    (venue2_id, 'Wine Cellar', 4, 'Wine storage and cellar area'),
    (venue2_id, 'Dry Storage', 5, 'Dry goods and non-refrigerated storage')
    ON CONFLICT DO NOTHING;

    -- Get area IDs for product insertion
    SELECT id INTO area1_id FROM venue_areas WHERE venue_id = venue1_id AND name = 'Bar Area' LIMIT 1;

    -- Insert sample products for venue 1
    INSERT INTO products (venue_id, area_id, name, category, brand, size, unit_type, expected_count) VALUES
    (venue1_id, area1_id, 'Budweiser', 'Beer', 'Budweiser', '330ml', 'bottles', 24),
    (venue1_id, area1_id, 'Stella Artois', 'Beer', 'Stella Artois', '330ml', 'bottles', 24),
    (venue1_id, area1_id, 'Guinness', 'Beer', 'Guinness', '440ml', 'cans', 12),
    (venue1_id, area1_id, 'Smirnoff Vodka', 'Spirits', 'Smirnoff', '700ml', 'bottles', 2),
    (venue1_id, area1_id, 'Jack Daniels', 'Spirits', 'Jack Daniels', '700ml', 'bottles', 1)
    ON CONFLICT DO NOTHING;

    -- Get area ID for venue 2
    SELECT id INTO area2_id FROM venue_areas WHERE venue_id = venue2_id AND name = 'Bar Area' LIMIT 1;

    -- Insert sample products for venue 2
    INSERT INTO products (venue_id, area_id, name, category, brand, size, unit_type, expected_count) VALUES
    (venue2_id, area2_id, 'Corona', 'Beer', 'Corona', '330ml', 'bottles', 24),
    (venue2_id, area2_id, 'Heineken', 'Beer', 'Heineken', '330ml', 'bottles', 24),
    (venue2_id, area2_id, 'Bacardi Rum', 'Spirits', 'Bacardi', '700ml', 'bottles', 2),
    (venue2_id, area2_id, 'Tanqueray Gin', 'Spirits', 'Tanqueray', '700ml', 'bottles', 1),
    (venue2_id, area2_id, 'Chardonnay', 'Wine', 'House Wine', '750ml', 'bottles', 6)
    ON CONFLICT DO NOTHING;

END $$;

-- Create a function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venue_areas_updated_at BEFORE UPDATE ON venue_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_sessions_updated_at BEFORE UPDATE ON stock_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_entries_updated_at BEFORE UPDATE ON stock_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;