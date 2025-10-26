-- ============================================================================
-- Migration: Add RRP and Category Name to invoice_line_items
-- ============================================================================
--
-- Purpose:
--   Add support for storing supplier-specific RRP (Recommended Retail Price)
--   and category information in invoice line items.
--
-- Context:
--   Step 2 (Review Items) requires parsing and displaying category-based
--   invoice data. Booker invoices organize items by supplier categories
--   and include RRP information that needs to be captured.
--
-- Columns Added:
--   1. rrp (NUMERIC(10,2))
--      - Recommended Retail Price from supplier invoice
--      - For Booker: Extracted from "STD RRP" field
--      - If item is Price Marked Pack (PM notation), stores the PM value
--      - Example: 10.50, 15.99, NULL if not specified
--
--   2. category_name (VARCHAR(100))
--      - Supplier-specific invoice category (NOT master product category)
--      - For Booker: Category name as it appears on invoice (e.g., "RETAIL GROCERY", "AMBIENT")
--      - Used for Step 2 UI grouping and display
--      - Each supplier may organize invoices differently
--      - Example: "RETAIL GROCERY", "CHILLED", "FROZEN", "BEVERAGES"
--
-- Notes:
--   - Both columns are NULLABLE - invoices without this data are still valid
--   - RRP is separate from unit_price (unit_price is purchase cost, RRP is selling price)
--   - category_name is supplier-specific and should not be confused with
--     master_products.category (which is our internal categorization system)
--   - POR (Price of Recommendation) can be calculated from RRP if needed later
--
-- Testing:
--   - Tested against Booker invoice 3596857
--   - Verified column sizes accommodate all Booker data
--
-- ============================================================================

ALTER TABLE invoice_line_items ADD COLUMN rrp NUMERIC(10,2);
ALTER TABLE invoice_line_items ADD COLUMN category_name VARCHAR(100);

-- Add table comments for documentation
COMMENT ON COLUMN invoice_line_items.rrp IS
'Recommended Retail Price from supplier invoice. For Booker: from STD RRP field. Price Marked Packs (PM notation) stored as their PM value.';

COMMENT ON COLUMN invoice_line_items.category_name IS
'Supplier-specific invoice category (not master product category). For Booker: category as displayed on invoice (e.g., RETAIL GROCERY, CHILLED, FROZEN).';
