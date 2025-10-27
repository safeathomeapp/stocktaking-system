# Step 2: Review & Select Items - Design Document

## Overview

Step 2 is where users review parsed invoice items and select which items they want to import. This step includes a critical **progressive learning feature** that automatically unchecks items previously ignored by this venue from this supplier, speeding up the process on repeat invoices.

## Workflow Position

```
Step 1: Upload & Supplier Detection
    ↓ (parsedItems, detectedSupplier)
Step 2: Review & Select Items ← YOU ARE HERE
    ├─ Load venue_ignore table (progressive learning)
    ├─ Auto-uncheck items from venue_ignore
    └─ User reviews and adjusts selections
    ↓ (itemCheckboxes)
Step 3: Confirm Ignored Items & Record Reasons
    ↓
Step 4: Match to Master Products
    ↓
Step 5: Final Summary & Save to Database
```

## Progressive Learning System

This is the **feedback loop** for the learning system:

```
INVOICE 1 (First Time):
├─ Load venue_ignore for this venue+supplier
│  └─ Table is empty (no prior data)
├─ All items displayed as CHECKED (will be imported)
└─ User unchecks items they don't stock
    └─ Send to Step 3 for confirmation

INVOICE 2 (Same Supplier, Same Venue):
├─ Load venue_ignore for this venue+supplier
│  └─ Contains 6 items from Invoice 1
├─ All 6 items auto-unchecked (learn from past!)
├─ User reviews: 5 are still correct, 1 they NOW want
│  └─ User rechecks the 1 they need
├─ User unchecks 1 new item they don't need
└─ Send to Step 3 with FEWER items to ignore
    └─ Much faster than Invoice 1!
```

**Key insight**: Step 2 is where the *learning* happens (auto-unchecking). Step 3 is where *new learning* is recorded.

## Architecture

### Database Context: venue_ignore Table

```sql
CREATE TABLE venue_ignore (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  supplier_sku VARCHAR(100) NOT NULL,
  product_name VARCHAR(255),
  reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,

  UNIQUE(venue_id, supplier_id, supplier_sku),
  FOREIGN KEY (venue_id) REFERENCES venues(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE INDEX idx_venue_supplier ON venue_ignore(venue_id, supplier_id);
```

**Purpose**: Store items this venue doesn't want from this supplier (learning database)

**Lifecycle**:
- **Created in Step 3** when user confirms ignored items
- **Loaded in Step 2** to auto-uncheck items
- **Updated in Step 3** with new ignored items or removed items

### Component Props Interface

**Step2_ReviewItems receives:**

```javascript
{
  // Parsed items from Step 1
  parsedItems: [
    {
      supplierSku: "063724",
      supplierName: "Coke Zero 330ml Can",
      categoryHeader: "RETAIL GROCERY",
      packSize: "24x330ml",
      unitSize: "330ml",
      quantity: 1,
      unitPrice: 4.25,
      rrp: 5.99,
      lineTotal: 4.25,
      vatCode: "B",
      vatRate: 20,
      // ... other fields from parser
    },
    // ... 58 items total
  ],

  // Checkbox state (populated with progressive learning)
  itemCheckboxes: {
    0: true,    // Item 0 is selected for import
    1: true,
    2: false,   // Item 2 auto-unchecked from venue_ignore
    3: false,   // Item 3 auto-unchecked from venue_ignore
    4: true,
    // ... etc for all 58 items
  },

  // Detected supplier context
  detectedSupplier: {
    id: "74f1b14b-6020-4575-a23c-2ff7a4a6f7d2",
    name: "Booker Limited"
  },

  // Invoice metadata from Step 1
  invoiceMetadata: {
    invoiceNumber: "3596857",
    invoiceDate: "2025-05-01",
    totalAmount: 1245.67,
    subtotal: 1204.50,
    vatTotal: 41.17
  },

  // Callbacks
  onItemCheckboxChange: (index, checked) => void,
  onComplete: (itemCheckboxes) => void,
  onBack: () => void
}
```

## UI Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Review Invoice Items                                            │
│                                                                  │
│  Invoice #3596857 | Date: 01/05/2025 | Booker Limited          │
│  📚 Showing 58 items from this invoice                          │
├──────────────────────────────────────────────────────────────────┤
│  ▼  ☑  RETAIL GROCERY  (52/54 selected, £892.50)              │
│  ┌──────────────────────────────────────────────────────────────┐
│  │ [☑] 063724  Coke Zero 330ml Can       qty: [−] 1 [+] £4.25 │
│  │ [☑] 061452  Sprite 1.5L Bottle        qty: [−] 2 [+] £8.50 │
│  │ [☐] 071234  Apple Juice 2L (AUTO)     qty: [−] 1 [+] £3.20 │
│  │        ^ Previously ignored, auto-unchecked                  │
│  │ [☑] 045389  Fanta Orange 330ml        qty: [−] 5 [+] £12.00│
│  │ ...more items...                                             │
│  └──────────────────────────────────────────────────────────────┘
│
│  ▼  ☑  CHILLED  (12/14 selected, £95.25)                       │
│  ┌──────────────────────────────────────────────────────────────┐
│  │ [☑] 045632  Butter 500g                qty: [−] 1 [+] £4.50│
│  │ [☐] 058234  Milk Semi-Skimmed 1L      qty: [−] 2 [+] £6.00│
│  │        ^ Previously ignored, auto-unchecked                  │
│  │ ...more items...                                             │
│  └──────────────────────────────────────────────────────────────┘
│
├──────────────────────────────────────────────────────────────────┤
│  Items Selected: 52 of 58  |  Subtotal: £1,245.67              │
│                                                                  │
│  📊 Progressive Learning Active:                                │
│  6 items auto-unchecked from your ignore list                  │
│  (You can change these selections above)                        │
├──────────────────────────────────────────────────────────────────┤
│  [← Back]                                    [Next: Confirm →]   │
└──────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Progressive Learning Auto-Unchecking

**How it works:**
1. On Step 2 load, fetch venue_ignore items for this venue+supplier
2. For each parsed item, check if it's in venue_ignore by SKU
3. If found, pre-populate checkbox as FALSE (unchecked)
4. Display visual indicator showing these were auto-unchecked
5. User can override (re-check) items they now want

**Implementation:**
```javascript
// When Step 2 component mounts
useEffect(() => {
  // Load venue_ignore items
  const ignoredByVenue = await fetch(
    `/api/venue-ignore/list?venueId=${venueId}&supplierId=${supplier.id}`
  ).then(r => r.json());

  // Create checkbox state
  const checkboxes = {};
  parsedItems.forEach((item, idx) => {
    const isIgnored = ignoredByVenue.items.some(
      ignored => ignored.supplier_sku === item.supplierSku
    );
    checkboxes[idx] = !isIgnored; // FALSE if ignored (unchecked)
  });

  setItemCheckboxes(checkboxes);
}, [venueId, supplier.id]);
```

### 2. Category-Based Organization

- **Collapsible categories**: Each supplier-defined category (RETAIL GROCERY, CHILLED, etc.)
- **Expand/Collapse**: Chevron icon toggles visibility
- **Category header shows**:
  - Select-all checkbox for category
  - Category name
  - Item count (X selected / Y total)
  - Category subtotal
  - Blue highlight when expanded

**Example:**
```
▼ ☑ RETAIL GROCERY (52/54 selected, £892.50)
```

### 3. Item Selection with Checkboxes

**Styling (same as Step 2 from original design):**
- **Checked**: Blue background (#007bff), white checkmark
- **Unchecked**: Light gray background (#dee2e6), gray border
- **Disabled**: Grayed out if category is unchecked

**Features:**
- Individual item checkbox
- Clicking checkbox toggles item selection
- Unchecked items appear with 70% opacity
- SKU and product name clearly displayed

### 4. Quantity Editor (Per-Item)

```
SKU  Name  [−] Quantity [+]  Price
```

- **Default quantity**: From parser (usually 1)
- **Decrease button (−)**: Reduce quantity (disabled if qty = 1)
- **Input field**: Show current quantity (read-only or editable)
- **Increase button (+)**: Increase quantity
- **Disabled if**: Item is unchecked

**Real-time calculation:**
```
price × qty = line_total (displayed)
```

### 5. Real-Time Calculations

**Per-category:**
- Selected items count
- Category subtotal
- Display: "X selected / Y total items in category"

**Overall:**
- Grand total of all selected items
- Display at bottom: "Items Selected: X of Y | Subtotal: £Z"

### 6. Visual Indicators

**Auto-unchecked items indicator:**
```
[☐] 058234  Milk Semi-Skimmed 1L
     ^ Previously ignored, auto-unchecked
```

**Progressive learning banner:**
```
📊 Progressive Learning Active:
6 items auto-unchecked from your ignore list
(You can change these selections above)
```

### 7. Select-All per Category

- Checkbox in category header
- Clicking selects/deselects ALL items in that category
- Useful for bulk operations (e.g., "Uncheck all CHILLED")
- Updates real-time counts

### 8. Action Buttons

- **← Back**: Return to Step 1 to upload different file
- **Next: Confirm →**: Proceed to Step 3 (disabled if 0 items selected)

## Workflow Integration

### From InvoiceWorkflow Perspective

```javascript
// In InvoiceWorkflow (parent component)

// Step 1 completes:
const handleUploadComplete = (file, pdfText, supplier, items, metadata) => {
  setDetectedSupplier(supplier);
  setParsedItems(items);
  setInvoiceMetadata(metadata);
  setCurrentStep(2);
};

// Step 2 loads: Load venue_ignore and auto-uncheck items
useEffect(() => {
  if (currentStep === 2 && venueId && detectedSupplier) {
    loadVenueIgnoreItems(venueId, detectedSupplier.id)
      .then(ignoredItems => {
        // Create checkbox state with auto-unchecked items
        const checkboxes = {};
        parsedItems.forEach((item, idx) => {
          const isIgnored = ignoredItems.some(
            i => i.supplier_sku === item.supplierSku
          );
          checkboxes[idx] = !isIgnored;
        });
        setItemCheckboxes(checkboxes);
      });
  }
}, [currentStep, venueId, detectedSupplier]);

// When item checkbox changes:
const handleItemCheckboxChange = (index, checked) => {
  setItemCheckboxes(prev => ({
    ...prev,
    [index]: checked
  }));
};

// Step 2 completes:
const handleReviewComplete = (checkboxState) => {
  setItemCheckboxes(checkboxState);

  // Extract unchecked items (candidates for venue_ignore)
  const uncheckedIndices = Object.entries(checkboxState)
    .filter(([_, isChecked]) => !isChecked)
    .map(([idx, _]) => parseInt(idx));

  const ignoredItems = uncheckedIndices.map(idx => ({
    ...parsedItems[idx],
    originalIndex: idx
  }));

  setIgnoredItems(ignoredItems);
  setCurrentStep(3);
};
```

### Data Passed to Step 3

```javascript
{
  ignoredItems: [
    // Items that were UNCHECKED in Step 2
    { supplierSku, supplierName, category, ... },
    // ... only the unchecked ones
  ],
  itemCheckboxes: { /* original state */ },
  // User will confirm these in Step 3
}
```

## API Endpoints

### GET /api/venue-ignore/list

**Purpose**: Get items this venue ignores from this supplier (for auto-unchecking)

**Request:**
```javascript
GET /api/venue-ignore/list?venueId=UUID&supplierId=UUID
```

**Response:**
```javascript
{
  success: true,
  items: [
    {
      id: "UUID",
      supplier_sku: "058234",
      product_name: "Milk Semi-Skimmed 1L",
      reason: "Out of stock"
    },
    {
      id: "UUID",
      supplier_sku: "089115",
      product_name: "Sambuca Liqueur",
      reason: "Customer requested no alcohol"
    },
    // ... 6 items total
  ],
  count: 6
}
```

**Error (if venue or supplier not found):**
```javascript
{
  success: true,
  items: [],
  count: 0
  // No error - just return empty list
}
```

## Progressive Learning Flow Summary

```
Step 2 Load:
  1. Fetch venue_ignore for venue+supplier
  2. Create checkbox state with FALSE for ignored items
  3. Display with auto-uncheck indicator

User Reviews:
  4. User can check/uncheck any item
  5. Real-time calculations update
  6. User confirms selections

Step 3:
  7. Unchecked items go to Step 3
  8. User records reasons
  9. Step 3 SAVES checked items to venue_ignore

Next Invoice (same venue+supplier):
  10. Step 2 loads again
  11. venue_ignore now has 6 items
  12. Those 6 items auto-unchecked
  13. FASTER than Invoice 1! ✨
```

## Testing Scenarios

1. **First Invoice (No Learning)**
   - venue_ignore is empty
   - All items checked
   - User unchecks 6 items
   - Proceed to Step 3

2. **Second Invoice (With Learning)**
   - venue_ignore has 6 items
   - Those 6 auto-unchecked
   - User reviews, unchecks 1 new item
   - Only 7 items go to Step 3 (faster!)

3. **User Overrides**
   - venue_ignore has 6 items auto-unchecked
   - User wants 1 back
   - User checks it → It becomes selected
   - Unchecked item doesn't go to Step 3

4. **Category Select-All**
   - User unchecks entire CHILLED category
   - All CHILLED items become unchecked
   - Category subtotal becomes £0

5. **Quantity Editing**
   - User increases quantity of item
   - Line total updates
   - Category subtotal updates
   - Grand total updates

## Error Handling

- Network error loading venue_ignore → Treat as empty list, proceed with all checked
- Invalid venue/supplier ID → Treat as empty list, proceed with all checked
- No items selected (all unchecked) → Disable Next button, show message

## Performance Optimization

- Venue_ignore lookup: Indexed on (venue_id, supplier_id) for fast retrieval
- Auto-uncheck: O(n) where n = number of items (acceptable)
- Real-time calculations: Optimized with useMemo to avoid re-renders
- Large invoices: Lazy-load categories that aren't expanded

## Future Enhancements

- [ ] "Select All Items" / "Unselect All Items" global buttons
- [ ] Search/filter items by SKU or name
- [ ] Bulk quantity update
- [ ] Undo changes button
- [ ] Show reason why item is auto-unchecked (from venue_ignore.reason)
- [ ] Quick uncheck buttons for "All CHILLED", "All FROZEN", etc.
- [ ] Export selected items as CSV
- [ ] Compare with previous invoice (show what's new/changed)
