# Database Schema Refactoring Plan

**Date**: October 6, 2025

## Problems Identified

### 1. Unnecessary `product_aliases` Table
- **Issue**: Extra intermediary table for EPOS matching
- **Solution**: Use `products.name` directly (already venue-specific)
- **Impact**: Simplifies architecture, reduces joins

### 2. Redundant Fields in `products` Table
- **Issue**: Duplicates data from `master_products`
- **Fields to Remove**: brand, size, unit_type, barcode, area_id, expected_count
- **Why**: All specifications should come from master_products only

### 3. Confusing Table Name
- **Current**: `products`
- **Should be**: `venue_products`
- **Why**: Clarifies it's venue-specific, not global

---

## Proposed New Architecture

### Simplified Product Flow

```
┌─────────────────────────────────────────┐
│        MASTER_PRODUCTS                  │
│  - Single source of truth               │
│  - brand, size, unit_type, barcode     │
│  - case_size, category, specifications │
└──────────────┬──────────────────────────┘
               │
       ┌───────▼────────────┐
       │  VENUE_PRODUCTS    │
       │  (renamed from     │
       │   products)        │
       ├────────────────────┤
       │ - id               │
       │ - venue_id         │
       │ - master_product_id│ (REQUIRED, NOT NULL)
       │ - name             │ (venue's local name)
       │ - created_at       │
       │ - updated_at       │
       └────────────────────┘
```

### EPOS Matching Flow

```
EPOS CSV "JD"
  ↓
venue_products.name = "JD"  (venue calls it "JD")
  ↓
master_product_id → master_products (has all specs)
  ↓
Returns: Jack Daniels, 700ml, bottle, case_size=12
```

---

## Refactoring Steps

### Phase 1: Rename `products` to `venue_products`

**Difficulty**: Medium
**Breaking Changes**: Yes - requires code updates
**Files to Update**:
- backend/server.js (all SQL queries)
- frontend components (API responses)
- Migration script

**SQL**:
```sql
ALTER TABLE products RENAME TO venue_products;
```

**Estimated Changes**: ~50-100 lines across backend

---

### Phase 2: Remove Redundant Fields from `venue_products`

**Fields to Remove**:
- `brand` - Get from master_products
- `size` - Get from master_products
- `unit_type` - Get from master_products
- `barcode` - Get from master_products
- `area_id` - Not needed (stock_entries.venue_area_id handles this)
- `expected_count` - Not used meaningfully
- `category` - Get from master_products

**Fields to Keep**:
- `id` - Primary key
- `venue_id` - Links to venue
- `master_product_id` - **Make NOT NULL** (required link)
- `name` - Venue's local name for product
- `created_at` - Tracking
- `updated_at` - Tracking

**New Schema**:
```sql
CREATE TABLE venue_products (
  id                 uuid           PRIMARY KEY,
  venue_id           uuid          NOT NULL REFERENCES venues(id),
  master_product_id  uuid          NOT NULL REFERENCES master_products(id), -- NOW REQUIRED
  name               varchar(255)  NOT NULL,  -- Venue's local name
  created_at         timestamp     DEFAULT CURRENT_TIMESTAMP,
  updated_at         timestamp     DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(venue_id, master_product_id)  -- One entry per master product per venue
);
```

**Code Changes Required**:
All queries selecting from products need to JOIN master_products:

```sql
-- OLD (redundant data)
SELECT p.name, p.brand, p.size, p.category
FROM products p
WHERE p.venue_id = $1

-- NEW (join to master)
SELECT
  vp.name as venue_name,
  mp.brand,
  mp.size,
  mp.category,
  mp.case_size,
  mp.unit_type,
  mp.barcode
FROM venue_products vp
JOIN master_products mp ON vp.master_product_id = mp.id
WHERE vp.venue_id = $1
```

---

### Phase 3: Remove `product_aliases` Table

**Reasoning**: Redundant with venue_products.name

**Migration**:
```sql
-- Migrate any useful aliases to venue_products if needed
-- Then drop the table
DROP TABLE product_aliases CASCADE;
```

**Code Changes**:
- Remove from fuzzyMatchingService.js
- Update search logic to use venue_products.name

---

## Benefits of Refactoring

### 1. **Simpler Architecture**
- 2 tables instead of 3 (venue_products + master_products)
- Clear separation: venue naming vs. product specs

### 2. **No Data Redundancy**
- Brand, size, category only in master_products
- Venue only stores their local name

### 3. **Easier Maintenance**
- Update specs once in master_products
- All venues get updated specs automatically

### 4. **Clearer Purpose**
- `venue_products` = "What does this venue call this product?"
- `master_products` = "What IS this product?"

---

## Risks & Considerations

### 1. **Breaking Changes**
- All existing code reading `products.brand`, `products.size` etc. must be updated
- API responses will change structure

### 2. **Data Migration**
- Must ensure all products have valid master_product_id
- Orphaned records need cleanup

### 3. **Query Performance**
- More JOINs required
- Need proper indexes on master_product_id

### 4. **Code Complexity**
- Need to update ~50+ queries
- Testing required for all product-related features

---

## Recommendation

### Option A: Full Refactor (Ideal but High Risk)
1. Rename products → venue_products
2. Remove redundant fields
3. Make master_product_id NOT NULL
4. Remove product_aliases
5. Update all queries to JOIN master_products

**Pros**: Clean architecture, no redundancy
**Cons**: High risk, lots of code changes, testing required

### Option B: Incremental Refactor (Safer)
1. ✅ Start using master_product_id in new code
2. ✅ Document that brand/size/etc should come from master_products
3. ✅ Gradually migrate queries to use JOINs
4. Eventually remove redundant fields when all code updated
5. Eventually remove product_aliases

**Pros**: Lower risk, gradual migration
**Cons**: Takes longer, temporary inconsistency

### Option C: Keep As-Is (Not Recommended)
- Keep redundancy
- Accept data duplication
- Live with complex architecture

**Pros**: No changes needed
**Cons**: Technical debt, confusion, maintenance burden

---

## Recommended Next Steps

1. **Decide on approach** (A, B, or C)
2. **If proceeding**:
   - Create backup of production database
   - Write comprehensive migration script
   - Update all SQL queries
   - Test thoroughly on local database
   - Deploy to production with rollback plan

---

**Question for Decision**:
Which approach do you want to take? I recommend **Option B (Incremental)** as it's safer and we can do it step-by-step without breaking production.
