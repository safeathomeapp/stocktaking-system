# Database Schema Changes - Removed Columns

**Date**: October 6, 2025
**Migration**: `remove-redundant-product-columns.js`

## Columns Removed from `products` Table

The following columns were removed from the `products` table as they were not used anywhere in the codebase:

### 1. `local_name` (varchar(255))
- **Reason for Removal**: Not used in any queries or code
- **Alternative**: Use `products.name` for venue-specific naming, or `product_aliases` table for alternate names
- **Data Impact**: No active data was using this field

### 2. `supplier` (varchar(100))
- **Reason for Removal**: Not used in code; supplier relationships moved to structured tables
- **Alternative**: Use `supplier_item_list` table for supplier-product relationships
- **Data Impact**: No active data was using this field

### 3. `cost_price` (numeric)
- **Reason for Removal**: Not used in code
- **Alternative**: Use `supplier_item_list.unit_cost` for supplier-specific pricing
- **Data Impact**: No active data was using this field

### 4. `selling_price` (numeric)
- **Reason for Removal**: Not used in code
- **Alternative**: Use `master_products.suggested_retail_price` or venue-specific pricing tables
- **Data Impact**: No active data was using this field

### 5. `local_notes` (text)
- **Reason for Removal**: Not used in any queries or code
- **Alternative**: Can be added back if needed for venue-specific product notes
- **Data Impact**: No active data was using this field

### 6. `auto_matched` (boolean)
- **Reason for Removal**: Not used in products table; matching logic moved to other tables
- **Alternative**: Use `supplier_item_list.auto_matched` for supplier item matching
- **Data Impact**: All rows had `false` value, no functional impact

---

## Columns KEPT in `products` Table

These columns are actively used in the codebase and were NOT removed:

### Active Columns:

1. **`area_id`** (integer) - **KEPT**
   - **Used in**: Product queries (server.js:423), product creation (server.js:438, 453)
   - **Purpose**: Links products to venue areas for organization
   - **Note**: While logically redundant (stock_entries.venue_area_id handles multi-area), it's actively used in code

2. **`expected_count`** (integer) - **KEPT**
   - **Used in**: Product creation (server.js:456)
   - **Purpose**: Expected stock level for the product
   - **Note**: Set to 0 by default on product creation

3. **Core fields** - **ALL KEPT**
   - `id`, `venue_id`, `master_product_id`, `name`, `category`, `brand`, `size`, `unit_type`, `barcode`, `created_at`, `updated_at`
   - All actively used in queries and product management

---

## Updated Schema (After Removal)

```sql
CREATE TABLE products (
  id                 uuid           PRIMARY KEY,
  venue_id           uuid          NOT NULL REFERENCES venues(id),
  master_product_id  uuid          REFERENCES master_products(id),
  name               varchar(255)  NOT NULL,
  category           varchar(100),
  brand              varchar(100),
  size               varchar(50),
  unit_type          varchar(50),
  barcode            varchar(100),
  area_id            integer       REFERENCES venue_areas(id),
  expected_count     integer       DEFAULT 0,
  created_at         timestamp     DEFAULT CURRENT_TIMESTAMP,
  updated_at         timestamp     DEFAULT CURRENT_TIMESTAMP
);
```

---

## Migration Safety

The migration script (`remove-redundant-product-columns.js`):

1. ✅ Checked current schema before removal
2. ✅ Backed up all data from columns being removed
3. ✅ Showed sample of backed up data
4. ✅ Removed columns safely using `DROP COLUMN IF EXISTS`
5. ✅ Verified final schema after removal

### Backup Data

23 product rows had at least one non-null value in the removed columns:
- All `auto_matched` values were `false` (default)
- All other fields (`local_name`, `supplier`, `cost_price`, `selling_price`, `local_notes`) were `null`

**Conclusion**: No meaningful data was lost during the removal.

---

## How to Restore (If Needed)

If any removed column needs to be restored:

```sql
-- Example: Restore local_name column
ALTER TABLE products ADD COLUMN local_name varchar(255);

-- Example: Restore cost_price column
ALTER TABLE products ADD COLUMN cost_price numeric(10,2);
```

**Note**: Restoring columns will add them as nullable fields with all existing rows having `NULL` values. Original data is not recoverable unless a database backup exists.

---

## Related Schema Changes

This removal is part of a larger schema cleanup:

1. **supplier_item_list** table added for supplier-specific product data
2. **master_products** remains the single source of truth for product specifications
3. **products** table streamlined to venue-specific essentials only
4. **Pricing data** moved to `supplier_item_list` table
5. **Product matching** logic moved to `supplier_item_list.auto_matched`

---

**Migration completed successfully on production database: October 6, 2025**
