# Step 5: Final Summary & Confirmation - Design Document

## Overview

Step 5 is the final review and confirmation stage of the invoice import workflow. Users review a comprehensive summary of all data that will be saved to the database, verify everything looks correct, and then confirm to save the complete invoice import.

This is a critical quality gate before data is permanently written to the database. After Step 5 confirmation, the system creates four types of records:
1. **invoices** - Invoice header record
2. **invoice_line_items** - Selected items from the invoice
3. **supplier_item_list** - New supplier→master product mappings (learning system)
4. **venue_ignored_items** - Items the venue doesn't stock

## Workflow Position

```
Step 1: Upload → Parse PDF
   ↓
Step 2: Review → Select/Deselect items (with progressive learning unchecking)
   ↓
Step 3: Ignore → Confirm ignored items + reasons
   ↓
Step 4: Match → Manually match unmatched items to master products
   ↓
Step 5: Confirm → FINAL REVIEW before saving to database
   ↓
✅ INVOICE SAVED - Return to Dashboard
```

## Architecture

### Database Tables Updated in Step 5

#### 1. invoices (Header Record)

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  total_amount DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  vat_total DECIMAL(10,2),
  line_item_count INT,
  ignored_item_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by UUID,
  notes TEXT,

  FOREIGN KEY (venue_id) REFERENCES venues(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_invoices_venue ON invoices(venue_id);
CREATE INDEX idx_invoices_supplier ON invoices(supplier_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
```

#### 2. invoice_line_items (Selected Items)

```sql
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  supplier_item_list_id UUID,
  master_product_id UUID,
  supplier_sku VARCHAR(100),
  product_name VARCHAR(255),
  quantity INT,
  unit_price DECIMAL(10,2),
  line_total DECIMAL(10,2),
  category VARCHAR(100),
  vat_code VARCHAR(10),
  vat_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (supplier_item_list_id) REFERENCES supplier_item_list(id),
  FOREIGN KEY (master_product_id) REFERENCES master_products(id)
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_line_items_master ON invoice_line_items(master_product_id);
```

#### 3. supplier_item_list (Learning System)

```sql
-- Already exists from Step 3/4
-- Step 5 just references records created/updated in Step 3 & 4
-- No new updates needed here
```

#### 4. venue_ignored_items (Ignored Items Record)

```sql
CREATE TABLE venue_ignored_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  venue_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  supplier_sku VARCHAR(100),
  product_name VARCHAR(255),
  reason VARCHAR(500),
  quantity INT,
  unit_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (venue_id) REFERENCES venues(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE INDEX idx_ignored_items_invoice ON venue_ignored_items(invoice_id);
CREATE INDEX idx_ignored_items_venue ON venue_ignored_items(venue_id);
```

### Component Props Interface

**Step5_Summary receives:**

```javascript
{
  // Invoice metadata from Step 1
  invoiceMetadata: {
    invoiceNumber: "3596857",
    invoiceDate: "2025-05-01",
    totalAmount: 1245.67,
    subtotal: 1204.50,
    vatTotal: 41.17
  },

  // All parsed items from Step 1
  parsedItems: [
    {
      supplierSku: "BK-OJ-2L",
      supplierName: "Orange Juice 2L",
      categoryHeader: "SOFT DRINK",
      quantity: 5,
      unitPrice: 2.50,
      lineTotal: 12.50,
      vatCode: "A",
      vatRate: 0,
      // ... other fields
    },
    // ... 58 items total
  ],

  // Checkbox state from Step 2 (true = will be saved)
  itemCheckboxes: {
    0: true,   // Selected
    1: false,  // Ignored
    2: true,   // Selected
    // ... etc
  },

  // Matched items from Step 4
  matchedItems: {
    0: { masterProductId: "UUID", notes: "user selected" },
    2: { masterProductId: "UUID", notes: "auto-matched" },
    // ... etc
  },

  // Ignored items from Step 3
  ignoredItems: [
    {
      supplierSku: "045632",
      supplierName: "Butter 500g",
      // ...
    },
    // ... 6 items total
  ],

  // Reasons for ignoring from Step 3
  ignoreReasons: {
    "045632": "We don't stock dairy",
    "058234": "",
    // ... etc
  },

  // Supplier context
  detectedSupplier: {
    id: "74f1b14b-6020-4575-a23c-2ff7a4a6f7d2",
    name: "Booker Limited"
  },

  // Callbacks
  onSubmit: () => Promise<void>,   // Save to database
  onBack: () => void,               // Return to Step 4
  isSubmitting: boolean             // Show loading state
}
```

## UI Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Final Summary & Confirmation                                    │
├──────────────────────────────────────────────────────────────────┤
│  INVOICE METADATA                                                │
│  ─────────────────────────────────────────────────────────────── │
│  Invoice Number: 3596857   │   Invoice Date: 01/05/2025        │
│  Supplier: Booker Limited  │   Total Amount: £1,245.67          │
│                            │   (Subtotal: £1,204.50 + VAT: £41.17)
├──────────────────────────────────────────────────────────────────┤
│  ITEMS SUMMARY                                                   │
│  ─────────────────────────────────────────────────────────────── │
│  Total Parsed Items:      58                                     │
│  ├─ Will be saved:       52 items    [See Details ▼]           │
│  ├─ Will be ignored:      6 items    [See Details ▼]           │
│  └─ Status: All matched ✅                                      │
├──────────────────────────────────────────────────────────────────┤
│  ITEMS BEING SAVED (52)                                          │
│  ─────────────────────────────────────────────────────────────── │
│  SKU     │ Product Name          │ Qty │ Unit Price │ Total    │
│  ─────────┼───────────────────────┼─────┼────────────┼──────── │
│  BK-OJ-2L │ Orange Juice 2L       │  5  │  £2.50    │ £12.50  │
│  BK-CZ-330│ Coca-Cola Zero 330ml  │ 10  │  £0.45    │  £4.50  │
│  BK-CW-500│ Cranberry Water 500ml │  2  │  £1.20    │  £2.40  │
│           [... 49 more items ...]   │     │           │         │
│  ─────────┴───────────────────────┴─────┴────────────┴──────── │
│  Total Line Items:        52         | Total Amount: £1,245.67  │
├──────────────────────────────────────────────────────────────────┤
│  ITEMS BEING IGNORED (6)                                         │
│  ─────────────────────────────────────────────────────────────── │
│  SKU     │ Product Name          │ Qty │ Reason               │
│  ─────────┼───────────────────────┼─────┼────────────────────── │
│  BK-BTR-500 │ Butter 500g          │  1  │ We don't stock dairy │
│  BK-MIL-1L  │ Milk Semi-Skimmed 1L │  2  │ Out of stock         │
│           [... 4 more items ...]   │     │                      │
│  ─────────┴───────────────────────┴─────┴────────────────────── │
│  Total Ignored Items: 6                                          │
├──────────────────────────────────────────────────────────────────┤
│  BREAKDOWN BY CATEGORY                                           │
│  ─────────────────────────────────────────────────────────────── │
│  SOFT DRINK        16 items     [▰▰▰▰▰▰▰░░░░░░░░░░░░░░░░░░░░░] │
│  SNACKS             8 items     [▰▰▰░░░░░░░░░░░░░░░░░░░░░░░░░░░] │
│  HOT BEVERAGES      7 items     [▰▰░░░░░░░░░░░░░░░░░░░░░░░░░░░░] │
│  CONFECTIONERY     12 items     [▰▰▰▰▰░░░░░░░░░░░░░░░░░░░░░░░░░] │
│  OTHER              9 items     [▰▰░░░░░░░░░░░░░░░░░░░░░░░░░░░░] │
├──────────────────────────────────────────────────────────────────┤
│  ⚠️  WARNINGS (if any)                                           │
│  ─────────────────────────────────────────────────────────────── │
│  [ ] Items with 0 quantity                                       │
│  [ ] Items with £0 unit price                                    │
│  [ ] Items created as new master products (3 items)              │
│  [ ] Items requiring manual verification (0 items)               │
├──────────────────────────────────────────────────────────────────┤
│  [← Back to Step 4]  [Save Invoice →]                            │
│                                                                  │
│  ✅ No issues detected - Ready to save!                         │
└──────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Complete Invoice Summary

**Header Information:**
- Invoice number
- Invoice date
- Total amount (with breakdown: subtotal + VAT)
- Supplier name and ID
- Item counts (saved + ignored)

### 2. Items Being Saved Table

- **Columns:** SKU, Product Name, Quantity, Unit Price, Line Total
- **Sortable:** By any column (click header)
- **Expandable:** Click row to see full details including category, VAT code
- **Scrollable:** If large number of items
- **Subtotal:** Shows count and total amount

### 3. Items Being Ignored Table

- **Columns:** SKU, Product Name, Quantity, Reason
- **Expandable:** Click row to see full product details
- **Reason Display:** Shows reason entered in Step 3

### 4. Category Breakdown

- **Visual bar chart** showing item distribution by category
- **Percentage/count** for each category
- **Color-coded bars** for quick visual scanning

### 5. Warnings & Validation

Display warnings if:
- Items with 0 quantity found
- Items with £0 unit price
- New master products created (unusual, may indicate mismatch)
- Unmatched items still present (should not happen if Step 4 complete)
- Duplicate supplier SKUs
- Missing critical fields

**Example:**
```
⚠️ Warnings (3 detected):
  • 1 item has £0 unit price (SKU: BK-XYZ-000)
  • 2 new master products created (consider reviewing)
  • No issues detected otherwise - Safe to save
```

### 6. Action Buttons

- **← Back to Step 4**: Return to edit matchings (loses Step 5 context)
- **Save Invoice →**: Final submission (triggers database save)

**Loading State:**
- Button disabled during submission
- Spinner showing "Saving invoice..."
- Prevent double-submission

## Workflow Integration

### InvoiceWorkflow State Management

```javascript
// State for Step 5
const [finalConfirm, setFinalConfirm] = useState(false);

// When Step 4 completes:
const handleMatchingComplete = (matches) => {
  setMatchedItems(matches);
  setCurrentStep(5);  // Move to Step 5
};

// When user submits Step 5:
const handleFinalSubmit = async () => {
  try {
    setFinalConfirm(true);  // Show loading

    // Call API to save everything
    const response = await fetch('/api/invoices/save', {
      method: 'POST',
      body: JSON.stringify({
        invoiceId,
        venueId,
        supplierId: detectedSupplier.id,
        invoiceMetadata,
        selectedItems: parsedItems.filter((_, idx) => itemCheckboxes[idx]),
        ignoredItems,
        ignoreReasons,
        matchedItems
      })
    });

    if (response.ok) {
      // Success - navigate to dashboard or show success message
      showSuccessMessage("Invoice saved successfully!");
      setTimeout(() => navigateToDashboard(), 2000);
    } else {
      throw new Error("Failed to save invoice");
    }
  } catch (error) {
    setError(`Failed to submit invoice: ${error.message}`);
    setFinalConfirm(false);
  }
};
```

## API Endpoint

### POST /api/invoices/save

**Purpose:** Save the complete invoice import with all related data

**Request:**
```javascript
POST /api/invoices/save

{
  invoiceId: "UUID or null if new",
  venueId: "UUID",
  supplierId: "UUID",
  invoiceMetadata: {
    invoiceNumber: "3596857",
    invoiceDate: "2025-05-01",
    totalAmount: 1245.67,
    subtotal: 1204.50,
    vatTotal: 41.17
  },
  selectedItems: [
    {
      supplierSku: "BK-OJ-2L",
      productName: "Orange Juice 2L",
      masterProductId: "UUID",
      supplierItemListId: "UUID",
      quantity: 5,
      unitPrice: 2.50,
      lineTotal: 12.50,
      category: "SOFT DRINK",
      vatCode: "A",
      vatRate: 0
    },
    // ... 52 items
  ],
  ignoredItems: [
    {
      supplierSku: "045632",
      productName: "Butter 500g",
      quantity: 1,
      unitPrice: 4.50,
      reason: "We don't stock dairy"
    },
    // ... 6 items
  ]
}
```

**Response:**
```javascript
{
  success: true,
  invoiceId: "UUID",
  savedAt: "2025-10-27T14:45:00Z",
  stats: {
    lineItemsSaved: 52,
    ignoredItemsSaved: 6,
    newSupplierItemsCreated: 3,
    totalAmount: 1245.67
  },
  message: "Invoice saved successfully",
  redirectUrl: "/dashboard"
}
```

**Backend Logic (Transaction):**

```sql
BEGIN TRANSACTION;

-- 1. Create invoices record
INSERT INTO invoices (
  venue_id, supplier_id, invoice_number, invoice_date,
  total_amount, subtotal, vat_total, line_item_count,
  ignored_item_count, uploaded_by
)
VALUES ($venueId, $supplierId, $invoiceNumber, $invoiceDate,
        $totalAmount, $subtotal, $vatTotal, 52, 6, $userId)
RETURNING id AS invoice_id;

-- 2. Insert invoice_line_items (selected items only)
INSERT INTO invoice_line_items (
  invoice_id, supplier_item_list_id, master_product_id,
  supplier_sku, product_name, quantity, unit_price, line_total,
  category, vat_code, vat_rate
)
SELECT
  $invoiceId,
  item->>'supplierItemListId',
  item->>'masterProductId',
  item->>'supplierSku',
  item->>'productName',
  (item->>'quantity')::INT,
  (item->>'unitPrice')::DECIMAL,
  (item->>'lineTotal')::DECIMAL,
  item->>'category',
  item->>'vatCode',
  (item->>'vatRate')::DECIMAL
FROM jsonb_each($selectedItemsJson) AS t(item_idx, item);

-- 3. Create venue_ignored_items records
INSERT INTO venue_ignored_items (
  invoice_id, venue_id, supplier_id,
  supplier_sku, product_name, reason, quantity, unit_price
)
SELECT
  $invoiceId, $venueId, $supplierId,
  item->>'supplierSku',
  item->>'productName',
  item->>'reason',
  (item->>'quantity')::INT,
  (item->>'unitPrice')::DECIMAL
FROM jsonb_each($ignoredItemsJson) AS t(item_idx, item);

-- 4. Note: supplier_item_list already updated in Steps 3 & 4
-- No additional updates needed here

COMMIT;
```

## Error Handling

### Validation Before Submission

1. **Ensure at least 1 item selected:**
   - Cannot save invoice with 0 line items
   - Display: "Must select at least 1 item to save"

2. **Verify all items have master_product_id:**
   - Check in Step 5 before allowing submission
   - If any items missing: "Cannot submit - incomplete matching"
   - Link back to Step 4

3. **Validate invoice metadata:**
   - Invoice number not empty
   - Invoice date valid and in past
   - Total amounts make sense

4. **Check for duplicate invoice numbers:**
   - Warn if same invoice number already exists for this venue+supplier
   - Offer: "This invoice number already exists. Continue anyway?" or "Modify invoice number"

### Submission Error Handling

1. **Database constraint violations:**
   - Duplicate invoice number
   - Invalid foreign key references
   - Display: "Error saving invoice: [constraint violated]"

2. **Transaction rollback:**
   - If any part fails, entire transaction rolls back
   - No partial saves
   - User returns to Step 5 with error message

3. **Timeout during save:**
   - If API takes >30 seconds
   - Display: "Save operation timed out. Please try again."
   - Allow retry

4. **Network error:**
   - Display: "Network error. Please check connection and try again."
   - Allow retry

## Data Flow Summary

```
Step 5 Input (from Steps 1-4):
├── invoiceMetadata: { number, date, totals }
├── parsedItems: [58 total items from PDF]
├── itemCheckboxes: { idx: boolean }  (52 selected, 6 ignored)
├── matchedItems: { idx: { masterProductId } }
├── ignoredItems: [6 items]
├── ignoreReasons: { sku: reason }
└── detectedSupplier: { id, name }

User Review & Validation:
├── Review items summary
├── Check warnings
├── Verify category breakdown
└── Approve or go back to Step 4

Final Submission:
├── Create invoices record
├── Create 52 invoice_line_items records
├── Create 6 venue_ignored_items records
├── supplier_item_list already updated (Steps 3&4)
└── Return success + redirect to dashboard

Step 5 Output:
├── invoiceId: UUID (saved to database)
├── success: true
└── redirectUrl: "/dashboard"
```

## Testing Scenarios

1. **Happy Path**: 52 items saved, 6 ignored, success
2. **No Warnings**: All items valid, no warnings shown
3. **With Warnings**: Show various warning conditions
4. **Back Navigation**: Go back to Step 4, modify, return to Step 5
5. **Submission Error**: Simulate API error, show retry option
6. **Duplicate Invoice**: Try saving with existing invoice number
7. **Large Invoice**: Test with 200+ items, verify scrolling works
8. **Category Breakdown**: Verify accurate counts and visualization
9. **Double Submit**: Click Save twice, prevent double-submission
10. **Loading State**: Verify button disabled during submission

## Success Criteria

After Step 5 submission:

1. **Database Records Created:**
   - ✅ invoices table: 1 record
   - ✅ invoice_line_items table: 52 records
   - ✅ venue_ignored_items table: 6 records
   - ✅ supplier_item_list: Updated/created records (from Steps 3&4)

2. **Data Integrity:**
   - ✅ All foreign keys valid
   - ✅ Line item totals sum to invoice total
   - ✅ No orphaned records
   - ✅ Dates are valid and consistent

3. **User Experience:**
   - ✅ Success message displayed
   - ✅ Redirect to dashboard within 2 seconds
   - ✅ User can see imported invoice in dashboard
   - ✅ No errors in browser console

4. **Learning System Updated:**
   - ✅ supplier_item_list records marked verified
   - ✅ Next invoice from same supplier uses Tier 1 matching
   - ✅ Step 4 not needed for subsequent invoices

## Future Enhancements

- [ ] PDF preview in Step 5 (show actual invoice image)
- [ ] Export summary as PDF report
- [ ] Email confirmation of import
- [ ] Batch import multiple invoices
- [ ] Undo functionality to delete saved import
- [ ] Duplicate invoice detection with merge option
- [ ] Analytics dashboard for import metrics
- [ ] Custom validation rules per venue
- [ ] Approval workflow for high-value invoices
