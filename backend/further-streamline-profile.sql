-- Further Streamline User Profile Table - Remove More Unnecessary Fields
-- Version: 1.6.0
-- Created: September 29, 2025

-- Remove additional unnecessary columns from user_profiles table
ALTER TABLE user_profiles
DROP COLUMN IF EXISTS tiktok_handle,
DROP COLUMN IF EXISTS snapchat_handle,
DROP COLUMN IF EXISTS profile_picture_url,
DROP COLUMN IF EXISTS preferred_name;

-- Update comment to track changes
COMMENT ON TABLE user_profiles IS 'Further streamlined user profile data for single-user stock-taking system - removed social media handles, profile picture, and preferred name fields';

-- Show updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;