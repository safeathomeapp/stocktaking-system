-- Update venues table to include additional fields for venue management
-- Add new columns to existing venues table

ALTER TABLE venues
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_rate DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS billing_currency VARCHAR(3) DEFAULT 'GBP',
ADD COLUMN IF NOT EXISTS billing_notes TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Create areas table for venue-specific areas
CREATE TABLE IF NOT EXISTS venue_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for venue areas
CREATE INDEX IF NOT EXISTS idx_venue_areas_venue_id ON venue_areas(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_areas_order ON venue_areas(venue_id, display_order);

-- Add unique constraint to prevent duplicate area names per venue
ALTER TABLE venue_areas
ADD CONSTRAINT IF NOT EXISTS unique_venue_area_name
UNIQUE (venue_id, name);

-- Update the products table to include area reference
ALTER TABLE products
ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES venue_areas(id) ON DELETE SET NULL;

-- Create index for product areas
CREATE INDEX IF NOT EXISTS idx_products_area_id ON products(area_id);

-- Create default areas for existing venues (if any)
-- These are common hospitality areas
INSERT INTO venue_areas (venue_id, name, display_order, description)
SELECT
    v.id,
    area.name,
    area.display_order,
    area.description
FROM venues v
CROSS JOIN (
    VALUES
        ('Bar Area', 1, 'Main bar and serving area'),
        ('Storage Room', 2, 'Main storage and inventory area'),
        ('Kitchen', 3, 'Kitchen and food preparation area'),
        ('Wine Cellar', 4, 'Wine storage and cellar area'),
        ('Dry Storage', 5, 'Dry goods and non-refrigerated storage')
) AS area(name, display_order, description)
WHERE NOT EXISTS (
    SELECT 1 FROM venue_areas va WHERE va.venue_id = v.id AND va.name = area.name
);

-- Display the updated schema info
SELECT 'Venues table updated with new columns' as status;
SELECT 'venue_areas table created' as status;
SELECT 'Default areas added to existing venues' as status;