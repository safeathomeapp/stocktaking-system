# Master Products Schema Cleanup - Change Log

## Date: 2025-10-07

### Columns to REMOVE:
1. `size` - replaced by case_size (integer mls)
2. `alcohol_percentage` - not required
3. `search_terms` - not utilized
4. `phonetic_key` - voice search removed
5. `normalized_name` - covered by bridging tables
6. `usage_count` - not required
7. `success_rate` - not required
8. `last_used` - not required
9. `venues_seen` - not required
10. `total_venues_count` - not required
11. `first_seen_venue` - not required
12. `verification_status` - not required
13. `confidence_score` - not required
14. `description` - not required
15. `container_type` - not required
16. `container_size` - not required
17. `sku` - not required
18. `suggested_retail_price` - not required
19. `currency` - not required

### Columns to RENAME:
1. `unit_size` → `case_size` (should be integer for mls)
2. `created_by` → `created_by_id` (stores supplier_id or venue_id UUID)

### Columns to KEEP:
- id (uuid)
- name (varchar)
- brand (varchar)
- category (varchar)
- subcategory (varchar)
- master_category (varchar)
- unit_type (varchar)
- case_size (integer - renamed from unit_size)
- barcode (varchar)
- ean_code (varchar)
- upc_code (varchar)
- active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
- created_by_id (uuid - renamed from created_by)

## Code Changes Required:

### Backend Files:
1. `/backend/server.js` - Lines 550-655 (OLD duplicate POST/PUT endpoints - DELETE)
2. `/backend/server.js` - Lines 1398-1450 (POST endpoint - UPDATE to remove dropped fields)

### Migration File:
- Create `/backend/migrations/slim-master-products-schema.js`

### Documentation:
- Update `/README.md` master_products table schema

## Implementation Status:
✅ Migration completed successfully (slim-master-products-schema.js)
✅ Removed duplicate POST/PUT endpoints (lines 549-655 in server.js)
✅ Updated POST endpoint (line 1314 in server.js) to use new schema
✅ Updated supplier mapping queries (lines 1477, 1575 in server.js)
✅ Updated supplier-mapping-service.js to use new schema
✅ Updated README.md with new master_products schema
✅ Frontend requires no changes (no references to dropped columns)

## Notes:
- Found DUPLICATE POST `/api/master-products` endpoints (line 550 and line 1398)
- Removed older endpoint (lines 549-655) which used deprecated fields
- Updated newer POST endpoint (line 1314) to use new schema
- Supplier mapping service updated to not generate dropped fields

---

## REVISION - Date: 2025-10-07 (Same Day)

### Additional Changes Requested:
User requested to **remove master_category** and **restore unit_size** column.

### Changes Made:

#### Columns REMOVED (Additional):
1. `master_category` - not required

#### Columns RESTORED:
1. `unit_size` (VARCHAR(100)) - user wants this field for storing unit size descriptions

### Final Schema (v2):
- id (uuid)
- name (varchar)
- brand (varchar)
- category (varchar)
- subcategory (varchar)
- unit_type (varchar)
- **unit_size (varchar(100))** ✅ RESTORED
- case_size (integer)
- barcode (varchar)
- ean_code (varchar)
- upc_code (varchar)
- active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
- created_by_id (uuid)

### Migration File:
✅ Created `/backend/migrations/restore-unit-size-drop-master-category.js`
✅ Executed successfully

### Code Changes:

#### Backend Files Updated:
1. **server.js**:
   - Line 487: Removed master_category from query params
   - Line 505-509: Removed master_category filter logic
   - Line 512: Removed description from search (dropped column)
   - Line 548: Updated ORDER BY to remove master_category
   - Line 1566: Removed mp.master_category from SELECT
   - Line 2347-2348: Removed mp.size, changed mp.category as master_category to just mp.category

2. **supplier-mapping-service.js**:
   - Line 30: Replaced master_category with unit_size in parseBookersData
   - Line 262: Updated INSERT to use unit_size instead of master_category
   - Line 267-268: Updated values array accordingly

#### Frontend:
✅ No changes required (no references to master_category found)

#### Documentation:
✅ Updated README.md master_products schema (removed master_category, added unit_size)
✅ Updated SCHEMA_CHANGES.md with revision notes

### Implementation Status (Revision):
✅ Migration completed (restore-unit-size-drop-master-category.js)
✅ Updated server.js (removed all master_category references)
✅ Updated supplier-mapping-service.js (unit_size restored)
✅ Updated README.md
✅ Updated SCHEMA_CHANGES.md
✅ Frontend - no changes needed

---

## HOTFIX - Date: 2025-10-07 (Same Day)

### Issue:
After deploying schema changes, discovered 500 errors when opening stocktaking sessions:
- GET `/api/venues/:id/products` - 500 error
- GET `/api/sessions/:id/entries` - 500 error

### Root Cause:
SQL queries were still referencing `mp.size` column which was dropped in initial migration.

### Locations Fixed:
1. **server.js line 429**: GET `/api/venues/:id/products` - removed `mp.size`, added `mp.unit_size`
2. **server.js line 991**: GET `/api/sessions/:id/entries` - removed `mp.size`, added `mp.unit_size`
3. **server.js line 947**: POST stock entry creation - removed `mp.size`, added `mp.unit_size`
4. **server.js line 1120**: PUT stock entry update - removed `mp.size`, added `mp.unit_size`

### Changes:
All 4 SQL queries updated to:
- **REMOVE**: `mp.size` (dropped column)
- **ADD**: `mp.unit_size` (restored column)

### Status:
✅ All `mp.size` references removed from server.js
✅ All queries now use `mp.unit_size` instead
✅ Ready to commit and deploy
