-- User Profile Table for Single-User Stock-taking System
-- Version: 1.3.0
-- Created: September 29, 2025

-- Create user_profiles table with comprehensive contact details
CREATE TABLE IF NOT EXISTS user_profiles (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100), -- What they like to be called
    date_of_birth DATE,

    -- Address Information
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    county VARCHAR(100),
    postcode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United Kingdom',

    -- Phone Numbers
    mobile_phone VARCHAR(20),
    home_phone VARCHAR(20),
    work_phone VARCHAR(20),
    whatsapp_number VARCHAR(20), -- May be same as mobile or different

    -- Email Addresses
    primary_email VARCHAR(255),
    work_email VARCHAR(255),
    personal_email VARCHAR(255),

    -- Social Media Handles (without @ symbol)
    facebook_handle VARCHAR(100),
    instagram_handle VARCHAR(100),
    twitter_handle VARCHAR(100),
    linkedin_handle VARCHAR(100),
    tiktok_handle VARCHAR(100),
    snapchat_handle VARCHAR(100),

    -- Professional Information
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    industry VARCHAR(100),

    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),

    -- System Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Europe/London',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    currency VARCHAR(3) DEFAULT 'GBP',

    -- Account Status
    active BOOLEAN DEFAULT true,
    profile_complete BOOLEAN DEFAULT false,

    -- Privacy Settings
    share_phone BOOLEAN DEFAULT false,
    share_email BOOLEAN DEFAULT false,
    share_social_media BOOLEAN DEFAULT false,

    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,

    -- Additional Notes
    notes TEXT,
    profile_picture_url VARCHAR(500)
);

-- Create index on active users (for quick lookup)
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(active);

-- Create index on email for login purposes
CREATE INDEX IF NOT EXISTS idx_user_profiles_primary_email ON user_profiles(primary_email);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default user profile (will be updated through Settings UI)
INSERT INTO user_profiles (
    first_name,
    last_name,
    preferred_name,
    country,
    currency,
    timezone,
    active,
    profile_complete,
    notes
) VALUES (
    'Stock',
    'Taker',
    'Stock Taker',
    'United Kingdom',
    'GBP',
    'Europe/London',
    true,
    false,
    'Default user profile - please update through Settings'
) ON CONFLICT DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE user_profiles IS 'Comprehensive user profile data for single-user stock-taking system';
COMMENT ON COLUMN user_profiles.whatsapp_number IS 'WhatsApp number - may be different from mobile phone';
COMMENT ON COLUMN user_profiles.preferred_name IS 'Name to display in the application (e.g., nickname)';
COMMENT ON COLUMN user_profiles.profile_complete IS 'True when user has filled out essential profile information';
COMMENT ON COLUMN user_profiles.share_phone IS 'Privacy setting for sharing phone number in reports/exports';
COMMENT ON COLUMN user_profiles.share_email IS 'Privacy setting for sharing email in reports/exports';