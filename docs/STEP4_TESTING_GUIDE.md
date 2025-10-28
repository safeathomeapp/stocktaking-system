# Step 4 Testing Guide

## Quick Start

### 1. Start Development Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start

# Terminal 3 (Optional): Run automated endpoint tests
cd backend
node test-step4-endpoints.js
```

### 2. Manual Testing Steps

#### Pre-Testing Checklist
- [ ] Backend is running on `http://localhost:3005`
- [ ] Frontend is running on `http://localhost:3000`
- [ ] Database is accessible
- [ ] PostgreSQL supplier_item_list has test data
- [ ] Browser DevTools is open (F12)

#### Test Data Verification
```sql
-- Check if pre-matched items exist for Booker supplier
SELECT COUNT(*) as pre_matched_items
FROM supplier_item_list
WHERE supplier_id = (SELECT sup_id FROM suppliers WHERE sup_name LIKE '%Booker%')
AND master_product_id IS NOT NULL;

-- Expected: Should return > 0 for proper testing
```

---

## Step 4 Features Tested

### Feature 1: Database-First Matching ✓
**Implementation**: Load from `supplier_item_list` on component mount

**What to Test**:
1. Navigate to Step 4
2. Check Network tab in DevTools → should see:
   - `GET /api/supplier-items/get-supplier-items?supplierId=...`
   - Response: 200 OK with array of pre-matched items
3. Items from database should display with **green background**
4. Verify no fuzzy-matching requests are made for these items

**Expected Behavior**:
- Pre-matched items load from database instantly
- Performance optimized by skipping fuzzy matching
- Visual indicator (green) shows these are cached matches

---

### Feature 2: Fuzzy Matching for Unmatched Items ✓
**Implementation**: Only run fuzzy matching for items NOT in database

**What to Test**:
1. After database items load, watch for fuzzy matching
2. Items without pre-match should have **white background**
3. Fuzzy matching should complete within 5-10 seconds
4. Each unmatched item should show candidates sorted by confidence

**Expected Behavior**:
- Only unmatched items trigger fuzzy matching
- Performance is better than old approach (skipped items don't match)
- Auto-selected match is highest confidence candidate

---

### Feature 3: Candidate Sorting ✓
**Implementation**: Sort by confidence_score descending

**What to Test**:
1. Click "Change Match" on any item
2. Look at candidates in dropdown/modal
3. Candidates should be ordered: 99%, 95%, 87%, 72%, etc. (high to low)

**Expected Behavior**:
- Highest confidence matches appear first
- User can easily find best alternatives
- Each candidate shows: product name, confidence %, other details

---

### Feature 4: Manual Product Creation ✓
**Implementation**: Modal form creates entries in both master_products and supplier_item_list

**What to Test**:
1. Click "Create New Product" in match modal
2. Form should appear with fields:
   - Product Name: **Required** (pre-filled with supplier name)
   - Brand: Optional
   - Category: Optional (dropdown)
   - Subcategory: Optional
   - Unit Type: Optional (dropdown)
   - Unit Size: Optional (pre-filled from invoice)
   - Case Size: Optional
   - Barcode, EAN Code, UPC Code: Optional
3. Submit form with valid data
4. Observe:
   - Loading indicator during submission
   - Modal closes on success
   - Item shows **orange background** (manually matched)
   - Match displays new product with confidence: 100

**Database Verification**:
```sql
-- Check new product was created
SELECT id, name, brand, category FROM master_products
ORDER BY created_at DESC LIMIT 1;

-- Check supplier_item_list was updated
SELECT supplier_id, supplier_sku, master_product_id, confidence_score
FROM supplier_item_list
WHERE master_product_id = (latest_id_from_above)
ORDER BY created_at DESC LIMIT 1;
```

---

## Testing Workflow

### Full End-to-End Test

1. **Upload Invoice** (Step 1)
   - Upload test Booker invoice with 20+ items
   - Should parse successfully

2. **Review Items** (Step 2)
   - Uncheck 2-3 items to ignore them
   - Check re-previously-ignored items if any exist
   - Proceed to Step 3

3. **Confirm Ignored Items** (Step 3)
   - Verify items you unchecked appear
   - Add reasons (optional)
   - Proceed to Step 4

4. **Match Products** (Step 4) ← **FOCUS HERE**
   - [ ] **Green Items** (Pre-matched):
     - Verify ~60-80% of items are green
     - Spot-check a few matches
     - Try "Change Match" on one green item
     - Select different candidate, confirm change

   - [ ] **Blue Items** (Auto-matched):
     - Verify remaining items show blue background
     - Check match confidence scores
     - Click "Change Match" on 1-2 items
     - Try selecting different candidate

   - [ ] **Manual Product Creation**:
     - On an unmatched or pre-matched item, click "Create New Product"
     - Fill form:
       ```
       Product Name: Test Soft Drink
       Brand: Premium Cola
       Category: Beverages
       Subcategory: Soft Drinks
       Unit Type: bottle
       Unit Size: 500ml
       Case Size: 24
       ```
     - Submit and verify:
       - Modal closes
       - Item now shows orange background
       - Confidence shows 100%
       - Database has new entries

5. **Summary & Confirmation** (Step 5)
   - Review all matched items
   - Verify no unmatched items remain
   - Proceed to final save

---

## Debugging Checklist

### If Step 4 Won't Load
1. **Check browser console** (DevTools → Console tab)
   - Look for JavaScript errors
   - Check for network errors

2. **Check Network tab**
   - Is `GET /api/supplier-items/get-supplier-items` being called?
   - Response should be 200 OK
   - If 500, check backend terminal for errors

3. **Verify backend is running**
   ```bash
   curl http://localhost:3005/api/supplier-items/get-supplier-items?supplierId=1
   ```
   - Should return JSON with items array

### If Pre-matched Items Don't Show
1. **Check database has data**
   ```sql
   SELECT COUNT(*) FROM supplier_item_list
   WHERE master_product_id IS NOT NULL;
   ```
   - If 0, there's no test data

2. **Check supplier ID is correct**
   - Get supplier ID from database
   - Verify frontend is passing correct supplierId

3. **Check API response**
   - Open DevTools Network tab
   - Look at the GET request response
   - Verify it returns items array

### If Fuzzy Matching Fails
1. **Check fuzzy-match API**
   - Look for fuzzy match requests in Network tab
   - Verify they return candidates

2. **Check backend logs**
   - Should see parsing and similarity calculations
   - Look for error messages

### If Manual Product Creation Fails
1. **Check form validation**
   - Product Name is required
   - Try again with all fields filled

2. **Check API response**
   - Network tab → POST `/api/supplier-items/create-and-match`
   - Should return `success: true` and `masterProductId`
   - If 400, check request body format

3. **Verify database**
   - Check master_products table
   - Check supplier_item_list for link

---

## Performance Benchmarks

Expected times on modern hardware:

| Action | Target | Notes |
|--------|--------|-------|
| Step 4 load | < 2s | Database items should load instantly |
| Database query | < 1s | Fastest part of the step |
| Fuzzy matching | < 5s | May take longer for many items |
| Modal open/close | < 200ms | Should be instant |
| Form submission | < 1s | API call + database insert |
| Total Step 4 time | < 10s | From entering step to ready for Step 5 |

---

## Test Results Template

```markdown
# Step 4 Test Results

**Date**: [Date]
**Tester**: [Name]
**Invoice Used**: [Supplier/Invoice#]
**Items in Invoice**: [Count]

## Test Outcomes

### Database-First Matching
- [ ] Pre-matched items loaded: __ green items shown
- [ ] No duplicate fuzzy matching: ✓ (verified in Network tab)
- [ ] Visual indicator (green): ✓
- **Status**: ☐ PASS ☐ FAIL

### Fuzzy Matching
- [ ] Unmatched items fuzzy-matched: __ blue items shown
- [ ] Candidates sorted by confidence: ✓
- [ ] Auto-selected best match: ✓
- **Status**: ☐ PASS ☐ FAIL

### Change Match
- [ ] Changed pre-matched item: ✓
- [ ] Changed auto-matched item: ✓
- [ ] Visual indicator updated: ✓
- **Status**: ☐ PASS ☐ FAIL

### Manual Product Creation
- [ ] Form opened correctly: ✓
- [ ] Form fields pre-populated: ✓ (Product Name, Unit Size)
- [ ] Form validation works: ✓
- [ ] Product created in both tables: ✓
- [ ] Visual indicator (orange): ✓
- **Status**: ☐ PASS ☐ FAIL

### Edge Cases
- [ ] Duplicate manual product: [Behavior]
- [ ] Special characters in name: ✓
- [ ] Network error handling: [Behavior]
- **Status**: ☐ PASS ☐ FAIL

### Browser Console
- Errors: None ✓
- Warnings: [List if any]
- Network errors: None ✓

## Overall Result
☐ ALL TESTS PASSED ✓
☐ Some tests failed (see above)
☐ Blocked by issues

## Issues Found
1. ...

## Sign-off
- Code reviewer: ______________
- Date approved: ______________
```

---

## Quick Reference: API Endpoints

### GET /api/supplier-items/get-supplier-items
**Purpose**: Load pre-matched items from database

```bash
curl "http://localhost:3005/api/supplier-items/get-supplier-items?supplierId=1"
```

**Response**:
```json
{
  "success": true,
  "items": [
    {
      "id": 123,
      "supplier_sku": "BOOKER001",
      "supplier_name": "Product Name",
      "master_product_id": 456,
      "confidence_score": 100,
      "unit_size": "500ml",
      "pack_size": "12"
    }
  ]
}
```

### POST /api/supplier-items/create-and-match
**Purpose**: Create new master product and link via supplier_item_list

```bash
curl -X POST "http://localhost:3005/api/supplier-items/create-and-match" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "1",
    "supplierSku": "NEW-SKU-001",
    "supplierName": "Product from Invoice",
    "productName": "New Product Name",
    "brand": "Brand Name",
    "category": "Beverages",
    "subcategory": "Soft Drinks",
    "unitType": "bottle",
    "unitSize": "500ml",
    "caseSize": "12",
    "barcode": "1234567890",
    "eaCode": "9876543210",
    "upcCode": "1111111111"
  }'
```

**Response**:
```json
{
  "success": true,
  "masterProductId": 789,
  "message": "Product created and linked successfully"
}
```

### GET /api/supplier-items/:id
**Purpose**: Get single supplier item with master product details

```bash
curl "http://localhost:3005/api/supplier-items/123"
```

---

## Next Steps After Testing

1. **If all tests pass**:
   - [ ] Commit test results to git
   - [ ] Mark Step 4 as complete
   - [ ] Move to Step 5 testing

2. **If issues found**:
   - [ ] Document issues clearly
   - [ ] Prioritize by severity
   - [ ] Fix and re-test
   - [ ] Update test results

3. **Performance optimization**:
   - [ ] Review backend logs for slow queries
   - [ ] Check database indexes
   - [ ] Profile fuzzy matching performance
   - [ ] Consider caching strategies

---

## Support

For issues or questions:
1. Check the test plan document: `STEP4_TEST_PLAN.md`
2. Review this testing guide
3. Check backend logs: `npm run dev` output
4. Inspect browser DevTools: Network, Console, Application tabs
5. Review database schema if needed
