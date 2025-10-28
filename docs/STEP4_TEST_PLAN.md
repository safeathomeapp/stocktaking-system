# Step 4 - Master Product Matching: Test Plan

## Overview
This test plan validates the complete Step 4 workflow including:
- Database-first matching (loading pre-matched items from `supplier_item_list`)
- Fuzzy matching for unmatched items only (performance optimization)
- Manual product creation with database persistence
- Match change functionality

## Test Environment Setup

### Prerequisites
- [ ] Backend server running on `http://localhost:3005`
- [ ] Frontend server running on `http://localhost:3000`
- [ ] PostgreSQL database accessible
- [ ] Test invoice ready (from previous step)

### Starting the Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

---

## Test Scenarios

### Scenario 1: Database-First Matching (Pre-matched Items)
**Purpose**: Verify that items already in `supplier_item_list` load from database and skip fuzzy matching

#### 1.1 Load Step 4 with Pre-matched Items
- [ ] Navigate through Steps 1-3 with a test invoice
- [ ] Reach Step 4
- [ ] Observe: Component should load and display all items
- [ ] Check browser console: Should see no errors about "get-supplier-items"
- [ ] Verify: Items from database appear with green background (pre-matched indicator)

#### 1.2 Verify Database Items Skip Fuzzy Matching
- [ ] Wait for page to fully load
- [ ] Check browser DevTools Network tab: Should see one request to `/api/supplier-items/get-supplier-items?supplierId=...`
- [ ] Verify: No additional fuzzy matching requests are made for pre-matched items
- [ ] Confirm: Performance is improved (no unnecessary fuzzy-match API calls)

#### 1.3 Verify Match Display for Pre-matched Items
- [ ] Look at each item that was pre-matched (green background)
- [ ] Verify: Shows master product name and confidence score (should be 100 for pre-matched)
- [ ] Verify: "Change Match" button is available for all items

---

### Scenario 2: Fuzzy Matching for Unmatched Items
**Purpose**: Verify fuzzy matching works only for items NOT in the database

#### 2.1 Fuzzy Match Unmatched Items
- [ ] Identify items without pre-match (white background)
- [ ] Wait for fuzzy matching to complete
- [ ] Verify: Each unmatched item shows candidates sorted by confidence %
- [ ] Confirm: Best match (highest %) is auto-selected
- [ ] Check: Candidates display product name, brand, category, confidence score

#### 2.2 Candidate Sorting
- [ ] Click "Change Match" on an unmatched item
- [ ] Observe candidate list in dropdown
- [ ] Verify: Candidates are sorted by confidence score (highest first)
- [ ] Confirm: Top candidate has highest confidence %
- [ ] Example: Should see scores like 95%, 87%, 72%, etc. in descending order

#### 2.3 Multiple Candidates
- [ ] Select items with multiple matching candidates
- [ ] Verify: At least 3-5 candidates appear for complex items
- [ ] Confirm: All candidates are from `master_products` table
- [ ] Check: Candidate details are accurate

---

### Scenario 3: Change Match Functionality
**Purpose**: Verify users can change matches for both pre-matched and auto-matched items

#### 3.1 Change Pre-matched Item
- [ ] Find an item with green background (pre-matched)
- [ ] Click "Change Match" button
- [ ] Verify: Modal opens showing item details
- [ ] Confirm: Current match is selected/highlighted
- [ ] Select a different candidate
- [ ] Click "Confirm"
- [ ] Verify: Match changes to new selection
- [ ] Confirm: Visual indicator updates (color might change to orange for manually matched)

#### 3.2 Change Auto-matched Item
- [ ] Find an item with blue background (auto-matched)
- [ ] Click "Change Match" button
- [ ] Verify: Modal shows candidate list
- [ ] Select different candidate
- [ ] Click "Confirm"
- [ ] Verify: Match updates correctly

#### 3.3 Change to Manual Product
- [ ] From the candidate modal, locate "Create New Product" option
- [ ] Click it
- [ ] Verify: Manual product form opens

---

### Scenario 4: Manual Product Creation
**Purpose**: Verify users can create new master products with full form validation

#### 4.1 Open Manual Product Form
- [ ] Click "Change Match" on any item
- [ ] Look for "Create New Product" button/link
- [ ] Click it
- [ ] Verify: Form opens with all fields pre-populated from supplier item:
  - [ ] Product Name: Pre-filled with supplier name
  - [ ] Brand: Empty (ready for input)
  - [ ] Category: Empty (dropdown)
  - [ ] Subcategory: Empty
  - [ ] Unit Type: Empty (dropdown)
  - [ ] Unit Size: Pre-filled from invoice
  - [ ] Case Size: Empty
  - [ ] Barcode: Empty
  - [ ] EAN Code: Empty
  - [ ] UPC Code: Empty

#### 4.2 Form Validation
- [ ] Try submitting with blank Product Name
- [ ] Verify: Error message appears (Product Name is required)
- [ ] Enter a product name
- [ ] Fill in optional fields:
  - [ ] Brand: "Test Brand"
  - [ ] Category: Select from dropdown
  - [ ] Subcategory: If category allows
  - [ ] Unit Type: Select from dropdown
  - [ ] Unit Size: "500ml"
  - [ ] Case Size: "12"
  - [ ] Barcode: "1234567890"
  - [ ] EAN: "9876543210"
  - [ ] UPC: "9999999999"

#### 4.3 Submit Manual Product
- [ ] Click "Create Product" button
- [ ] Verify: Loading indicator appears
- [ ] Observe: Request to `POST /api/supplier-items/create-and-match`
- [ ] Confirm: Response shows `success: true`
- [ ] Verify: Modal closes
- [ ] Confirm: Item now shows orange background (manually matched)
- [ ] Check: New product is displayed with confidence: 100

#### 4.4 Database Verification
- [ ] Open database inspector or run SQL query
- [ ] Query: `SELECT id, name, brand FROM master_products ORDER BY created_at DESC LIMIT 1`
- [ ] Verify: New product exists with correct data
- [ ] Query: `SELECT * FROM supplier_item_list WHERE master_product_id = (latest_id) ORDER BY created_at DESC LIMIT 1`
- [ ] Verify: supplier_item_list entry created with:
  - [ ] `supplier_id`: Correct supplier
  - [ ] `master_product_id`: Points to new product
  - [ ] `confidence_score`: 100
  - [ ] `verified`: true
  - [ ] `active`: true

---

### Scenario 5: Visual Hierarchy & Status Indicators
**Purpose**: Verify correct visual feedback for match states

#### 5.1 Color Coding
- [ ] Green Background: Pre-matched items (from database)
- [ ] Blue Background: Auto-matched items (fuzzy-matched)
- [ ] Orange Background: Manually matched items (user created)
- [ ] White Background: Unmatched items (if any remain)

#### 5.2 Match Status Display
- [ ] Pre-matched item: Shows master product name + "Confidence: 100%"
- [ ] Auto-matched item: Shows master product name + confidence % from fuzzy match
- [ ] Manually-matched item: Shows master product name + "Confidence: 100%"
- [ ] Verify: All status indicators are visible and readable

---

### Scenario 6: Edge Cases & Error Handling
**Purpose**: Test boundary conditions and error scenarios

#### 6.1 Duplicate Manual Product
- [ ] Try creating the same product twice (same supplier SKU)
- [ ] Verify: Second attempt either:
  - [ ] Updates existing `supplier_item_list` entry (ON CONFLICT behavior)
  - [ ] Shows error message
- [ ] Check database: Only one entry should exist per supplier_sku

#### 6.2 Special Characters in Product Name
- [ ] Create product with: "Product & Co. Ltd. (Special)"
- [ ] Verify: Form accepts special characters
- [ ] Check: Database stores correctly without corruption

#### 6.3 Very Long Product Name
- [ ] Create product with 200+ character name
- [ ] Verify: Form handles gracefully
- [ ] Check: Database truncates or accepts as per schema

#### 6.4 Network Error Simulation
- [ ] Disable network (DevTools) mid-submission
- [ ] Verify: Error message displays
- [ ] Check: User can retry without data loss

---

### Scenario 7: Complete Workflow
**Purpose**: Test entire Step 4 from start to finish

#### 7.1 Full Test Run
- [ ] Start with fresh invoice (Steps 1-3)
- [ ] Enter Step 4
- [ ] Verify database items load (Green items)
- [ ] Verify auto-match completes (Blue items)
- [ ] Change 2-3 matches via dropdown
- [ ] Create 1-2 new products manually (Orange items)
- [ ] Verify all items have a master product assigned
- [ ] Click "Next Step" or "Save & Continue"
- [ ] Confirm: Transition to Step 5 without errors

#### 7.2 Summary Statistics
- [ ] Count items by match type:
  - [ ] Pre-matched (Green): X items
  - [ ] Auto-matched (Blue): Y items
  - [ ] Manually-matched (Orange): Z items
  - [ ] Total: X + Y + Z
- [ ] Verify: Matches with all items in step

---

## Test Data Requirements

### Sample Invoice with Expected Results
- **Supplier**: Booker Limited (must have entries in `supplier_item_list`)
- **Items**: Mix of:
  1. Items pre-matched in database (5-10 items)
  2. Items requiring fuzzy matching (20-30 items)
  3. Items needing manual product creation (2-5 items)

---

## Browser Console Checks

### Expected Logs
- [ ] No errors about "get-supplier-items"
- [ ] No "Cannot read property" errors
- [ ] No styled-components warnings about props
- [ ] No Redux/Context related errors

### API Calls Verification
Open DevTools → Network tab, and verify:
- [ ] `GET /api/supplier-items/get-supplier-items?supplierId=...` → 200 OK
- [ ] Fuzzy match requests (if needed) → 200 OK
- [ ] `POST /api/supplier-items/create-and-match` (for manual products) → 200 OK
- [ ] No duplicate requests
- [ ] All responses have `success: true`

---

## Performance Metrics

### Expected Performance
- [ ] Step 4 loads in < 2 seconds
- [ ] Pre-matched items display instantly (from cache)
- [ ] Fuzzy matching completes in < 5 seconds
- [ ] Modal opens/closes smoothly (< 200ms)
- [ ] Form submission completes in < 1 second

### Database Verification
```sql
-- Check pre-matched items exist
SELECT COUNT(*) FROM supplier_item_list
WHERE supplier_id = 'booker_id' AND master_product_id IS NOT NULL;

-- Check newly created products
SELECT COUNT(*) FROM master_products
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Verify relationships
SELECT sil.supplier_sku, mp.name, sil.confidence_score
FROM supplier_item_list sil
JOIN master_products mp ON sil.master_product_id = mp.id
WHERE sil.supplier_id = 'booker_id'
ORDER BY sil.created_at DESC LIMIT 10;
```

---

## Known Issues & Workarounds

### Issue 1: Route Ordering (FIXED)
**Status**: Fixed - Routes are correctly ordered with literal routes before parameterized
- GET `/api/supplier-items/get-supplier-items` (line 3309) ✓
- POST `/api/supplier-items/create-and-match` (line 3359) ✓
- GET `/api/supplier-items/:id` (line 3459) ✓

### Issue 2: Styled-Components Props (FIXED)
**Status**: Fixed - Using transient props ($variant instead of variant)
- Changed ActionButton to use `$variant` prop
- All usages updated to `$variant="primary"`

---

## Test Results Summary

### Test Execution Date: _____________
### Tester Name: _____________

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Database-First Matching | ☐ PASS ☐ FAIL | |
| 2. Fuzzy Matching | ☐ PASS ☐ FAIL | |
| 3. Change Match | ☐ PASS ☐ FAIL | |
| 4. Manual Product Creation | ☐ PASS ☐ FAIL | |
| 5. Visual Hierarchy | ☐ PASS ☐ FAIL | |
| 6. Edge Cases | ☐ PASS ☐ FAIL | |
| 7. Complete Workflow | ☐ PASS ☐ FAIL | |

### Overall Status
- ☐ All tests passed ✓
- ☐ Some tests failed (see notes)
- ☐ Tests blocked by issues

### Issues Found
1. ...
2. ...

---

## Next Steps
- [ ] Execute all test scenarios
- [ ] Document results
- [ ] File issues if problems found
- [ ] Verify fixes
- [ ] Proceed to Step 5 testing when ready
