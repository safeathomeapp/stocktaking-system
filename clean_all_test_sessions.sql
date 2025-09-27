-- Clean ALL test/development sessions and related data
-- This script removes ALL sessions, stock entries, and resets for fresh production start
-- WARNING: This will delete ALL existing session data!

-- First, delete all stock entries (due to foreign key constraints)
DELETE FROM stock_entries;

-- Delete all stock sessions
DELETE FROM stock_sessions;

-- Reset all sequences to start from 1 again
-- This ensures the next session will have ID 1, next entry will have ID 1, etc.
SELECT setval('stock_sessions_id_seq', 1, false);
SELECT setval('stock_entries_id_seq', 1, false);

-- Keep venues and products as they are legitimate business data
-- Only reset their sequences if they were also test data
-- Uncomment the next lines if you want to also remove test venues/products:

-- DELETE FROM products WHERE venue_id IN (
--     SELECT id FROM venues WHERE name IN ('The Red Lion', 'The Crown & Anchor')
-- );
-- DELETE FROM venues WHERE name IN ('The Red Lion', 'The Crown & Anchor');
-- SELECT setval('venues_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM venues;
-- SELECT setval('products_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM products;

-- Display final counts to confirm cleanup
SELECT 'Stock Sessions' as table_name, COUNT(*) as count FROM stock_sessions
UNION ALL
SELECT 'Stock Entries', COUNT(*) FROM stock_entries
UNION ALL
SELECT 'Venues', COUNT(*) FROM venues
UNION ALL
SELECT 'Products', COUNT(*) FROM products;

-- Show next ID values that will be used
SELECT 'Next Session ID' as description, last_value as next_id FROM stock_sessions_id_seq
UNION ALL
SELECT 'Next Entry ID', last_value FROM stock_entries_id_seq;

-- Success message
SELECT 'Database cleaned successfully! All test sessions and stock entries removed.' as status;