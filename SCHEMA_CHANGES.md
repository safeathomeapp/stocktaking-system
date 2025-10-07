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
