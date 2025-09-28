-- Voice Recognition & Global Master Products Database Schema
-- This extends the existing database with voice recognition and global product catalog

-- ===== MASTER PRODUCTS TABLE =====
-- Global database of all products seen across all venues
CREATE TABLE IF NOT EXISTS master_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core Product Information
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100), -- Beer, Wine, Spirits, Soft Drinks, Food, etc.
    subcategory VARCHAR(100), -- Lager, Red Wine, Vodka, IPA, etc.

    -- Physical Attributes
    size VARCHAR(50), -- 275ml, 750ml, 1L, pint, etc.
    unit_type VARCHAR(50) CHECK (unit_type IN ('bottle', 'can', 'keg', 'case', 'jar', 'packet', 'other')),
    alcohol_percentage DECIMAL(4,2), -- 4.5%, 12.5%, 40.0%

    -- Identification & Barcodes
    barcode VARCHAR(100),
    ean_code VARCHAR(20),
    upc_code VARCHAR(20),

    -- Search Optimization for Voice Recognition
    search_terms TEXT[], -- Array of alternative names/spellings: ['becks', "beck's", 'becks beer']
    phonetic_key VARCHAR(100), -- Soundex/Metaphone for voice matching
    normalized_name VARCHAR(255), -- Lowercase, no special chars for matching

    -- Usage Statistics (Learning System)
    usage_count INTEGER DEFAULT 0, -- How often this product is selected globally
    success_rate DECIMAL(5,2) DEFAULT 0.0, -- % of times users select this when suggested
    last_used TIMESTAMP,

    -- Venue Tracking
    venues_seen UUID[], -- Array of venue IDs where this product was found
    first_seen_venue UUID REFERENCES venues(id),
    total_venues_count INTEGER DEFAULT 1,

    -- Quality & Confidence
    verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'disputed')),
    confidence_score DECIMAL(5,2) DEFAULT 50.0, -- Overall confidence in product data accuracy

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100), -- User/system that added this product

    -- Constraints
    UNIQUE(normalized_name, brand, size) -- Prevent exact duplicates
);

-- ===== VOICE RECOGNITION LOG =====
-- Track all voice recognition attempts for learning and debugging
CREATE TABLE IF NOT EXISTS voice_recognition_log (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES stock_sessions(id),
    user_identifier VARCHAR(100), -- For tracking user-specific patterns

    -- Voice Input Data
    raw_audio_text TEXT NOT NULL, -- What speech-to-text heard: "becks two seventy five"
    processed_query TEXT, -- Cleaned up version: "becks 275ml"
    confidence_score DECIMAL(5,2), -- Speech recognition confidence (0-100)
    audio_quality VARCHAR(20) CHECK (audio_quality IN ('excellent', 'good', 'fair', 'poor')),

    -- Search & Matching Process
    search_strategy VARCHAR(50), -- 'exact', 'fuzzy', 'phonetic', 'category'
    suggestions_returned JSONB, -- Array of suggested products with confidence scores
    total_suggestions INTEGER DEFAULT 0,

    -- User Action & Feedback
    selected_product_id UUID REFERENCES master_products(id),
    selection_rank INTEGER, -- Which suggestion did user pick? (1=first, 2=second, etc.)
    user_selected BOOLEAN DEFAULT false,
    manual_entry BOOLEAN DEFAULT false, -- User gave up on voice and typed manually
    user_feedback VARCHAR(20) CHECK (user_feedback IN ('correct', 'close', 'wrong', 'not_found')),

    -- Performance Metrics
    processing_time_ms INTEGER,
    suggestion_accuracy DECIMAL(5,2), -- Was correct product in suggestions?
    api_response_time_ms INTEGER,

    -- Context Information
    venue_id UUID REFERENCES venues(id),
    area_id INTEGER REFERENCES venue_areas(id),
    time_of_day TIME,
    background_noise_level VARCHAR(20) CHECK (background_noise_level IN ('quiet', 'moderate', 'noisy')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== PRODUCT ALIASES =====
-- Handle venue-specific names for the same global product
CREATE TABLE IF NOT EXISTS product_aliases (
    id SERIAL PRIMARY KEY,
    master_product_id UUID NOT NULL REFERENCES master_products(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,

    -- Alias Information
    alias_name VARCHAR(255) NOT NULL, -- "House Wine", "Cheap Beer", "The Good Stuff"
    alias_type VARCHAR(50) CHECK (alias_type IN ('venue_specific', 'regional', 'colloquial', 'brand_variation')),
    usage_frequency INTEGER DEFAULT 1,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),

    UNIQUE(venue_id, alias_name) -- Each venue can have unique aliases
);

-- ===== ENHANCE EXISTING PRODUCTS TABLE =====
-- Add references to master products and local customization
ALTER TABLE products ADD COLUMN IF NOT EXISTS master_product_id UUID REFERENCES master_products(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS local_name VARCHAR(255); -- Venue's custom name
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS local_notes TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS auto_matched BOOLEAN DEFAULT false; -- Was this matched automatically?

-- ===== SEARCH PERFORMANCE INDEXES =====

-- Master Products Search Optimization
CREATE INDEX IF NOT EXISTS idx_master_products_name_gin ON master_products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_master_products_brand_gin ON master_products USING gin(to_tsvector('english', brand));
CREATE INDEX IF NOT EXISTS idx_master_products_search_terms_gin ON master_products USING gin(search_terms);
CREATE INDEX IF NOT EXISTS idx_master_products_phonetic ON master_products(phonetic_key);
CREATE INDEX IF NOT EXISTS idx_master_products_normalized ON master_products(normalized_name);
CREATE INDEX IF NOT EXISTS idx_master_products_category ON master_products(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_master_products_usage ON master_products(usage_count DESC, success_rate DESC);

-- Voice Recognition Log Performance
CREATE INDEX IF NOT EXISTS idx_voice_log_session ON voice_recognition_log(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_log_product ON voice_recognition_log(selected_product_id);
CREATE INDEX IF NOT EXISTS idx_voice_log_timestamp ON voice_recognition_log(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_log_venue ON voice_recognition_log(venue_id);

-- Product Aliases Performance
CREATE INDEX IF NOT EXISTS idx_aliases_master_product ON product_aliases(master_product_id);
CREATE INDEX IF NOT EXISTS idx_aliases_venue ON product_aliases(venue_id);
CREATE INDEX IF NOT EXISTS idx_aliases_name_gin ON product_aliases USING gin(to_tsvector('english', alias_name));

-- Enhanced Products Table Indexes
CREATE INDEX IF NOT EXISTS idx_products_master_id ON products(master_product_id);
CREATE INDEX IF NOT EXISTS idx_products_local_name_gin ON products USING gin(to_tsvector('english', local_name));

-- ===== FUZZY SEARCH FUNCTIONS =====

-- Function to normalize text for fuzzy matching
CREATE OR REPLACE FUNCTION normalize_for_search(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN regexp_replace(
        lower(trim(input_text)),
        '[^a-z0-9\s]', '', 'g'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate phonetic key (simplified implementation)
CREATE OR REPLACE FUNCTION calculate_phonetic_key(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Simplified phonetic matching - remove vowels except first character
    -- Convert to lowercase and keep first letter + consonants
    RETURN CASE
        WHEN input_text IS NULL OR length(input_text) = 0 THEN ''
        ELSE
            left(lower(input_text), 1) ||
            regexp_replace(
                substring(lower(input_text) from 2),
                '[aeiou]', '', 'g'
            )
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically update normalized_name and phonetic_key
CREATE OR REPLACE FUNCTION update_master_product_search_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.normalized_name = normalize_for_search(NEW.name || ' ' || COALESCE(NEW.brand, '') || ' ' || COALESCE(NEW.size, ''));
    NEW.phonetic_key = calculate_phonetic_key(NEW.name);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_master_product_search ON master_products;
CREATE TRIGGER trigger_update_master_product_search
    BEFORE INSERT OR UPDATE ON master_products
    FOR EACH ROW EXECUTE FUNCTION update_master_product_search_fields();

-- ===== SAMPLE DATA FOR TESTING =====

-- Insert sample master products for testing voice recognition
INSERT INTO master_products (name, brand, category, subcategory, size, unit_type, alcohol_percentage, search_terms) VALUES
-- Beers
('Beck''s', 'Beck''s', 'Beer', 'Lager', '275ml', 'bottle', 4.8, ARRAY['becks', 'beck''s', 'becks beer', 'beck beer']),
('Stella Artois', 'Stella Artois', 'Beer', 'Lager', '330ml', 'bottle', 5.0, ARRAY['stella', 'stella artois', 'stella beer']),
('Guinness', 'Guinness', 'Beer', 'Stout', '440ml', 'can', 4.2, ARRAY['guinness', 'guinness stout', 'black beer']),
('Budweiser', 'Budweiser', 'Beer', 'Lager', '330ml', 'bottle', 5.0, ARRAY['bud', 'budweiser', 'bud beer']),

-- Spirits
('Smirnoff Vodka', 'Smirnoff', 'Spirits', 'Vodka', '700ml', 'bottle', 37.5, ARRAY['smirnoff', 'vodka', 'smirnoff vodka']),
('Jack Daniel''s', 'Jack Daniel''s', 'Spirits', 'Whiskey', '700ml', 'bottle', 40.0, ARRAY['jack daniels', 'jack', 'jd', 'whiskey']),
('Gordon''s Gin', 'Gordon''s', 'Spirits', 'Gin', '700ml', 'bottle', 37.5, ARRAY['gordons', 'gordon''s', 'gin', 'gordons gin']),

-- Wines
('House Chardonnay', 'House', 'Wine', 'White Wine', '750ml', 'bottle', 12.5, ARRAY['chardonnay', 'white wine', 'house wine', 'house chardonnay']),
('House Merlot', 'House', 'Wine', 'Red Wine', '750ml', 'bottle', 13.0, ARRAY['merlot', 'red wine', 'house red', 'house merlot']),
('Prosecco', 'Various', 'Wine', 'Sparkling', '750ml', 'bottle', 11.0, ARRAY['prosecco', 'sparkling wine', 'bubbly']),

-- Soft Drinks
('Coca Cola', 'Coca Cola', 'Soft Drinks', 'Cola', '330ml', 'bottle', 0.0, ARRAY['coke', 'coca cola', 'cola']),
('Orange Juice', 'Tropicana', 'Soft Drinks', 'Juice', '1L', 'other', 0.0, ARRAY['orange juice', 'oj', 'orange', 'tropicana'])

ON CONFLICT (normalized_name, brand, size) DO NOTHING;

-- Insert sample aliases for testing
INSERT INTO product_aliases (master_product_id, alias_name, alias_type)
SELECT id, 'House White', 'venue_specific' FROM master_products WHERE name = 'House Chardonnay'
UNION ALL
SELECT id, 'House Red', 'venue_specific' FROM master_products WHERE name = 'House Merlot'
UNION ALL
SELECT id, 'JD', 'colloquial' FROM master_products WHERE name = 'Jack Daniel''s'
ON CONFLICT (venue_id, alias_name) DO NOTHING;

-- ===== USEFUL QUERIES FOR TESTING =====

/*
-- Test fuzzy search functionality
SELECT
    mp.name,
    mp.brand,
    mp.size,
    mp.usage_count,
    similarity(mp.normalized_name, normalize_for_search('becks beer')) as similarity_score
FROM master_products mp
WHERE mp.normalized_name % normalize_for_search('becks beer')
   OR mp.phonetic_key = calculate_phonetic_key('becks beer')
   OR mp.search_terms && ARRAY['becks', 'beer']
ORDER BY similarity_score DESC, mp.usage_count DESC
LIMIT 10;

-- Test voice recognition log analysis
SELECT
    vrl.raw_audio_text,
    vrl.processed_query,
    vrl.confidence_score,
    mp.name as selected_product,
    vrl.selection_rank,
    vrl.processing_time_ms
FROM voice_recognition_log vrl
LEFT JOIN master_products mp ON vrl.selected_product_id = mp.id
ORDER BY vrl.created_at DESC
LIMIT 20;

-- Product usage analytics
SELECT
    mp.name,
    mp.brand,
    mp.category,
    mp.usage_count,
    mp.success_rate,
    array_length(mp.venues_seen, 1) as venues_count
FROM master_products mp
ORDER BY mp.usage_count DESC, mp.success_rate DESC
LIMIT 20;
*/