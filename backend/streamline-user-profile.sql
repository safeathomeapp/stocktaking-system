-- Streamline User Profile Table - Remove Unnecessary Fields
-- Version: 1.5.0
-- Created: September 29, 2025

-- Remove unnecessary columns from user_profiles table
ALTER TABLE user_profiles
DROP COLUMN IF EXISTS date_of_birth,
DROP COLUMN IF EXISTS industry,
DROP COLUMN IF EXISTS emergency_contact_name,
DROP COLUMN IF EXISTS emergency_contact_phone,
DROP COLUMN IF EXISTS emergency_contact_relationship;

-- Add comment to track changes
COMMENT ON TABLE user_profiles IS 'Streamlined user profile data for single-user stock-taking system - removed DOB, industry, emergency contact fields';

-- Show updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;