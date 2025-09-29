-- Stock Entries Schema Update Migration
-- Remove obsolete fields and update data types

-- Step 1: Remove obsolete columns
ALTER TABLE stock_entries DROP COLUMN IF EXISTS quantity_level;
ALTER TABLE stock_entries DROP COLUMN IF EXISTS condition_flags;
ALTER TABLE stock_entries DROP COLUMN IF EXISTS photo_url;

-- Step 2: Replace location_notes with venue_area_id foreign key
ALTER TABLE stock_entries DROP COLUMN IF EXISTS location_notes;
ALTER TABLE stock_entries ADD COLUMN venue_area_id INTEGER REFERENCES venue_areas(id) ON DELETE SET NULL;

-- Step 3: Update quantity_units to DECIMAL(10,2) for precise decimal storage
ALTER TABLE stock_entries ALTER COLUMN quantity_units TYPE DECIMAL(10,2);
ALTER TABLE stock_entries ALTER COLUMN quantity_units SET DEFAULT 0.00;

-- Step 4: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_entries_venue_area_id ON stock_entries(venue_area_id);

-- Step 5: Add constraint to ensure quantity_units is non-negative
ALTER TABLE stock_entries ADD CONSTRAINT chk_quantity_units_non_negative
    CHECK (quantity_units >= 0.00);