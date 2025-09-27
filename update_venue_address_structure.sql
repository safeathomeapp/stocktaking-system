-- Update venue address structure for better mapping support
-- Replace single address field with structured address components

-- Add new structured address fields
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS county VARCHAR(100),
ADD COLUMN IF NOT EXISTS postcode VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United Kingdom';

-- Migrate existing address data to address_line_1 (if any venues exist)
UPDATE venues
SET address_line_1 = address
WHERE address IS NOT NULL AND address_line_1 IS NULL;

-- Remove the old address column (after migration)
-- Note: Uncomment this line after verifying the migration worked correctly
-- ALTER TABLE venues DROP COLUMN IF EXISTS address;

-- Display the updated schema
SELECT 'Address structure updated successfully' as status;

-- Show sample of how the new structure looks
SELECT
    'Updated venues table structure:' as info,
    'address_line_1, address_line_2, city, county, postcode, country' as new_fields;