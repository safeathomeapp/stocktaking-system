-- Clean up sample/test data from the database
-- Run this script to remove any sample data and start fresh

-- Delete stock entries (foreign key constraint)
DELETE FROM stock_entries WHERE session_id IN (
    SELECT id FROM stock_sessions WHERE notes LIKE '%sample%' OR notes LIKE '%test%'
);

-- Delete any test/sample sessions
DELETE FROM stock_sessions WHERE
    notes LIKE '%sample%'
    OR notes LIKE '%test%'
    OR stocktaker_name LIKE '%sample%'
    OR stocktaker_name LIKE '%test%';

-- Delete sample products (only if they were created from sample_data.sql)
DELETE FROM products WHERE venue_id IN (
    SELECT id FROM venues WHERE name IN ('The Red Lion', 'The Crown & Anchor')
);

-- Delete sample venues (if they exist from sample_data.sql)
DELETE FROM venues WHERE name IN ('The Red Lion', 'The Crown & Anchor');

-- Reset sequences to start fresh (PostgreSQL specific)
-- This ensures new records start with clean IDs
SELECT setval('venues_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM venues;
SELECT setval('products_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM products;
SELECT setval('stock_sessions_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM stock_sessions;
SELECT setval('stock_entries_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM stock_entries;

-- Display remaining data counts
SELECT 'Venues' as table_name, COUNT(*) as count FROM venues
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Stock Sessions', COUNT(*) FROM stock_sessions
UNION ALL
SELECT 'Stock Entries', COUNT(*) FROM stock_entries;