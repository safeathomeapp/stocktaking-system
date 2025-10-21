# Invoice Matching Logic - Step 3 & 4 Architecture

**Purpose:** Map supplier invoice items to master products through a three-tier matching system with learning capability.

---

## System Architecture Overview

### Tables Involved
```
invoice_line_items (raw PDF data)
    ↓ supplier_item_list_id FK
supplier_item_list (learning database)
    ↓ master_product_id FK
master_products (single source of truth)
```

### Data Flow

```
User uploads supplier PDF → System extracts line items → Step 3: Smart Matching
    ↓
    ├─ Tier 1: Supplier Item Exact Match
    │   └─ Check: Does THIS supplier use THIS SKU for a product we've seen before?
    │      ├─ YES → Link to existing supplier_item_list & master_product
    │      └─ Status: ✅ MATCHED
    │
    ├─ Tier 2: Master Product Fuzzy Match (NEW)
    │   └─ Check: Does this product name match a master product?
    │      ├─ GOOD MATCH → Create supplier_item_list entry + link to master_product
    │      ├─ Status: ⚙️ CREATED (auto-matched)
    │      │
    │      └─ NO/POOR MATCH → Create supplier_item_list with master_product_id=NULL
    │         └─ Status: ⚠️ NEEDS MASTER MATCH
    │
    └─ Step 4: Manual Master Product Linking
        └─ User manually selects from fuzzy search suggestions or creates new master product
           └─ Status: ✅ MANUALLY MATCHED
```

---

## Step 3: Smart Matching Logic (Backend: `/api/invoices/:invoiceId/match-supplier-items`)

### Input
- `invoiceId` - UUID
- Related invoice metadata (supplier_id, venue_id)
- Line items (product_code, product_name, quantity, pricing)

### Processing Steps

#### For Each Line Item:

**1️⃣ Tier 1 - Supplier Item SKU Match**
```sql
SELECT id, master_product_id
FROM supplier_item_list
WHERE supplier_id = $1 AND supplier_sku = $2
```
- **Match Found?**
  - ✅ YES → Update invoice_line_item with supplier_item_list_id & master_product_id
  - Result: `MATCHED` category
  - Learning: System already knows this supplier's naming convention

- **No Match?**
  - Continue to Tier 2

**2️⃣ Tier 2 - Master Product Fuzzy Match**
```sql
-- Use multi-tier scoring (same as /api/master-products/search)
SELECT id, name, similarity(name, $1) as sim_score,
       CASE
         WHEN LOWER(name) = LOWER($1) THEN 100
         WHEN name ~* $1 THEN 80
         WHEN similarity(name, $1) > 0.6 THEN 60
         ELSE similarity(name, $1) * 100
       END as match_score
FROM master_products
WHERE active = true
ORDER BY match_score DESC
LIMIT 1
```

- **Match Score ≥ 60 (Good Match)?**
  - ✅ YES →
    - Create NEW supplier_item_list entry with master_product_id set
    - Update invoice_line_item with both IDs
    - Result: `CREATED` category (auto-matched to master)
    - Learning: Added new supplier naming convention to system

- **Match Score < 60 (Poor/No Match)?**
  - ✅ Create supplier_item_list with master_product_id = NULL
  - Result: `NEEDS MASTER MATCH` category
  - Learning: System flagged this product for manual review in Step 4

### Output (Counts for Dashboard)

```javascript
{
  invoiceId: "uuid",
  totalItems: 247,                    // Total line items
  matched: 185,                       // Tier 1: Existing supplier items
  created: 45,                        // Tier 2: Newly fuzzy-matched
  failed: 17,                         // Tier 2: No match found (needs manual)
  results: {
    matched: [{lineItemId, productName, supplierItemId, masterProductId, status: 'matched'}, ...],
    created: [{lineItemId, productName, supplierItemId, masterProductId, status: 'created'}, ...],
    failed: [{lineItemId, productName, supplierItemId, masterProductId: null, status: 'needs_master_match'}, ...]
  }
}
```

### Result Categories

| Category | supplier_item_list | master_product_id | Next Step | Count in UI |
|----------|-------------------|------------------|-----------|------------|
| **MATCHED** | ✅ Exists | ✅ Linked | None - Done | matched |
| **CREATED** | ✅ New | ✅ Linked | None - Done | created |
| **NEEDS MASTER MATCH** | ✅ New | ❌ NULL | Step 4: Manual | failed |

---

## Step 4: Manual Master Product Linking (Future)

**Triggered When:** Items in "NEEDS MASTER MATCH" category remain after Step 3

**Flow:**
1. User sees list of unmatched supplier items
2. User searches master_products (with fuzzy suggestions from /api/master-products/search)
3. User selects master product or creates new one
4. System:
   - Updates supplier_item_list.master_product_id
   - Updates invoice_line_item.master_product_id
   - Updates supplier_item_list.verified = true (marked as manually verified)

**After Step 4:** ALL items have master_product_id set → Ready for Step 5

---

## Learning System (Continuous Improvement)

### How supplier_item_list Improves Matching

**Pattern:** Each matched item (Tier 1 or Tier 2) adds to the learning database

**Example Timeline:**
- **First Booker Limited invoice:**
  - supplier_item_list is empty
  - All items go through Tier 2 (fuzzy match against master)
  - System learns: "Booker SKU 'BK-CZ-330-CAN' = Coca-Cola Zero 330ml can (master_product_id: abc123)"

- **Second Booker Limited invoice:**
  - Tier 1 finds "BK-CZ-330-CAN" in supplier_item_list
  - Automatically linked to master_product without fuzzy searching
  - **Much faster processing!**

**Benefits:**
- Faster matching (Tier 1 exact match vs Tier 2 fuzzy search)
- Consistent supplier naming tracking
- Accumulating knowledge of supplier-specific SKUs
- Reduced manual intervention on subsequent imports

---

## Database Integrity Requirements

### master_products Table
**Requirement:** NO DUPLICATES
- Each unique product should exist exactly once
- Duplicates cause:
  - Supplier item links to wrong master product
  - Inventory counts split across duplicate records
  - Reporting inaccuracy

**Unique Identifiers:**
- Combination of: name + brand + category + unit_type + unit_size + case_size + barcode
- Not just name (e.g., "Coca-Cola 330ml can" might exist in 50 different master_product rows)

**Strategy:** [See DEDUPLICATION section below]

### supplier_item_list Table
**Requirement:** NO DUPLICATES PER SUPPLIER
- Each supplier_sku should map to exactly ONE master_product per supplier
- Constraint exists: `UNIQUE(supplier_id, supplier_sku)`

**Unique Identifiers:**
- supplier_id + supplier_sku (database constraint already enforces this)

**However:** May have duplicates if supplier_sku is ambiguous (e.g., same SKU used for different products)
- **Manual review needed:** Check for supplier_sku appearing with different product names

**Strategy:** [See DEDUPLICATION section below]

---

## DEDUPLICATION STRATEGY

### Phase 1: Master Products Deduplication

**Goal:** Ensure each physical product appears exactly once in master_products

**Steps:**
1. Identify duplicate candidates:
   ```sql
   SELECT name, brand, category, unit_type, unit_size, case_size,
          COUNT(*) as count, array_agg(id) as ids
   FROM master_products
   WHERE active = true
   GROUP BY name, brand, category, unit_type, unit_size, case_size
   HAVING COUNT(*) > 1
   ORDER BY count DESC;
   ```

2. For each group of duplicates:
   - Keep the oldest record (earliest created_at)
   - Mark others as inactive (active = false) - DON'T DELETE (referential integrity)
   - Update all FKs in supplier_item_list to point to kept record

3. Verify referential integrity:
   ```sql
   SELECT COUNT(*) FROM supplier_item_list
   WHERE master_product_id IS NOT NULL
   AND active = true
   AND master_product_id NOT IN (SELECT id FROM master_products WHERE active = true);
   ```

**Implementation:**
- Use transaction: BEGIN → Identify → Update FKs → Mark inactive → COMMIT
- Log which records were merged (for audit trail)
- Do NOT delete records (preserves historical references in invoice_line_items)

---

### Phase 2: Supplier Item List Deduplication

**Goal:** Ensure each supplier's SKU maps cleanly to one master product

**Steps:**
1. Identify suspicious supplier_skus:
   ```sql
   SELECT supplier_id, supplier_sku, COUNT(DISTINCT master_product_id) as master_count
   FROM supplier_item_list
   WHERE active = true
   GROUP BY supplier_id, supplier_sku
   HAVING COUNT(*) > 1 OR COUNT(DISTINCT master_product_id) > 1;
   ```

2. For each duplicate:
   - Keep the verified one (verified = true) if exists
   - Or keep the most recently matched one
   - Mark others as inactive

3. Verify no orphaned records:
   ```sql
   SELECT COUNT(*) FROM supplier_item_list
   WHERE active = true AND master_product_id IS NOT NULL
   AND master_product_id NOT IN (SELECT id FROM master_products WHERE active = true);
   ```

**Implementation:**
- Preserve historical records (set active = false, don't delete)
- Keep referential integrity intact
- Log changes for audit trail

---

## Testing & Validation

### After Deduplication:

1. **master_products integrity:**
   ```sql
   -- Should return 0
   SELECT COUNT(*) FROM (
     SELECT name, brand, category, unit_type, unit_size, case_size
     FROM master_products
     WHERE active = true
     GROUP BY name, brand, category, unit_type, unit_size, case_size
     HAVING COUNT(*) > 1
   ) t;
   ```

2. **supplier_item_list integrity:**
   ```sql
   -- Should return 0
   SELECT COUNT(*) FROM (
     SELECT supplier_id, supplier_sku
     FROM supplier_item_list
     WHERE active = true
     GROUP BY supplier_id, supplier_sku
     HAVING COUNT(*) > 1
   ) t;
   ```

3. **Foreign key referential integrity:**
   ```sql
   -- Should return 0
   SELECT COUNT(*) FROM supplier_item_list sil
   WHERE sil.active = true
   AND sil.master_product_id IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM master_products mp
     WHERE mp.id = sil.master_product_id AND mp.active = true
   );
   ```

---

## Future Enhancements

- [ ] Implement fuzzy matching in Step 3 backend
- [ ] Add barcode scanning for faster matching (check barcode first)
- [ ] Implement machine learning for confidence scores
- [ ] Add supplier product catalog sync (automated updates)
- [ ] Create audit log for all master_product merges
- [ ] Add UI for manual duplicate resolution
- [ ] Implement batch import with deduplication pre-check
