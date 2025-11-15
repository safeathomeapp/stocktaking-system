# System Architecture & Design Principles

## Master Products - Single Source of Truth

**Critical Design Principle:** All product information comes from `master_products` ONLY.

### Data Model:

**`master_products`** = Single source of truth for ALL product specifications
  - name, brand, category, subcategory, unit_type, unit_size, case_size, barcode

**`venue_products`** = Linkage table ONLY
  - Stores: `master_product_id`, `area_id`, `venue_id`
  - Purpose: Maps master products to specific venues
  - Does NOT store product specifications

**`supplier_item_list`** = Supplier-specific naming
  - Maps supplier SKUs and names to `master_product_id`
  - Used for invoice OCR matching only

### Why This Matters:
- Ensures consistency across all venues
- Eliminates duplicate/conflicting product data
- Simplifies updates (change once in master, applies everywhere)
- Enables accurate cross-venue reporting

---

## Data Flow

```
User adds product to stocktake
    ↓
Search master_products (fuzzy match)
    ↓
Create venue_products entry (if new) with master_product_id
    ↓
Create stock_entry with product_id → venue_products.id
    ↓
Display uses: JOIN venue_products → master_products
```

---

## Project Structure

### Current Active Structure (v2.0.1 - October 2025)

```
stocktaking-system/
├── backend/
│   ├── src/
│   │   └── database.js          # PostgreSQL connection pool
│   ├── server.js                # Main API server (port 3005)
│   ├── schema.sql               # Complete database schema (15 tables)
│   └── .env                     # Local database configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/          # ✅ ALL active React components
│   │   │   ├── Dashboard.js
│   │   │   ├── VenueManagement.js
│   │   │   ├── Settings.js
│   │   │   ├── StockTaking.js
│   │   │   ├── SessionHistory.js
│   │   │   ├── AreaSetup.js
│   │   │   ├── Analysis.js
│   │   │   ├── InvoiceInput.js
│   │   │   ├── InvoiceImport.js
│   │   │   ├── ManualInvoiceEntry.js
│   │   │   ├── SupplierInvoiceReview.js
│   │   │   ├── EposCsvInput.js
│   │   │   ├── InvoiceImportSummary.js
│   │   │   └── MasterProductMatcher.js
│   │   │
│   │   ├── services/
│   │   │   └── apiService.js    # ✅ Active API service
│   │   │
│   │   ├── styles/
│   │   │   ├── components/
│   │   │   │   └── Button.js    # ✅ Only active styled component
│   │   │   ├── GlobalStyles.js
│   │   │   └── theme/
│   │   │
│   │   ├── config/
│   │   │   └── api.js           # API URL configuration
│   │   │
│   │   ├── utils/
│   │   │   └── helpers.js       # Utility functions
│   │   │
│   │   └── _archived/           # 🗂️ Archived unused files (see below)
│   │
│   └── App.js                   # Main app component (routes)
│
├── docs/                         # 📚 Documentation (split from README)
│   ├── GETTING_STARTED.md       # Setup instructions
│   ├── DEVELOPMENT.md           # Dev workflow
│   ├── ARCHITECTURE.md          # This file - system design
│   ├── DATABASE_SCHEMA.md       # Database documentation
│   ├── API_ENDPOINTS.md         # API reference
│   ├── WORKFLOW.md              # Stock-taking workflow
│   └── PARSERS.md               # Invoice parser documentation
│
├── archive-unused-files.sh      # Cleanup script
├── restore-archived-files.sh    # Restore script (if needed)
└── CLEANUP_REPORT.md            # Detailed cleanup documentation
```

---

## Recently Archived Files (October 2025)

**9 unused files moved to `frontend/src/_archived/` to reduce codebase complexity:**

**Duplicate Pages (replaced by components/):**
- ❌ `pages/Dashboard.js` → replaced by `components/Dashboard.js`
- ❌ `pages/SessionHistory.js` → replaced by `components/SessionHistory.js`
- ❌ `pages/StockTaking.js` → replaced by `components/StockTaking.js`
- ❌ `pages/VenueSelection.js` → deprecated entirely

**Unused Services:**
- ❌ `services/api.js` → replaced by `apiService.js`

**Unused Styled Components:**
- ❌ `styles/components/Card.js` → not imported anywhere
- ❌ `styles/components/Form.js` → not imported anywhere
- ❌ `styles/components/Layout.js` → not imported anywhere

### Why Archive Instead of Delete?
- Files safely stored in `_archived/` directory
- Can be restored if needed with `./restore-archived-files.sh`
- Verified 0 imports across codebase before archiving
- See `CLEANUP_REPORT.md` for full analysis and methodology

### Impact:
- ✅ Reduced code complexity and confusion
- ✅ Clearer project structure
- ✅ No breaking changes (verified compilation success)
- ✅ All routes and features still work

---

## Product-Area Relationships

**Q: Where is product-area information stored?**

**A:** The `stock_entries` table stores the relationship via `venue_area_id`:

```sql
stock_entries
├── product_id      (which product)
├── venue_area_id   (which area it was counted in)
└── quantity_units  (how many)
```

- **Products** (`venue_products`) are venue-wide, not tied to specific areas
- **Areas** (`venue_areas`) are physical locations in the venue
- **Stock Entries** link a product to an area for each count during stocktaking

**Example:** "5 bottles of Beck's in the Main Bar" creates a stock_entry with:
- `product_id` = Beck's
- `venue_area_id` = Main Bar
- `quantity_units` = 5
