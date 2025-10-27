# Step 3: Confirm Ignored Items - Design Document

## Overview

Step 3 is where users **finalize the ignore list** and record reasons for why items are being ignored. Items that users choose to ignore are saved to the `venue_ignore` table, creating **new learning data** for future invoices from this supplier.

**Critical distinction:**
- **Checked items** (in Step 3) → Save to venue_ignore (learning for next time)
- **Unchecked items** → User reconsidered, will import with invoice instead

## Workflow Position

```
Step 1: Upload & Supplier Detection
    ↓
Step 2: Review & Select Items
    └─ Auto-unchecks items from venue_ignore (learning feedback)
    └─ User selects items to import
    ↓
Step 3: Confirm Ignored Items & Record Reasons ← YOU ARE HERE
    ├─ Shows all UNCHECKED items from Step 2
    ├─ User can un-ignore items (checkbox) or record reason
    ├─ Checked items → Save to venue_ignore (NEW LEARNING)
    └─ Unchecked items → Add back to import list
    ↓
Step 4: Match to Master Products
    ↓
Step 5: Final Summary & Save to Database
```

## Learning System Integration

Step 3 creates **new learning data** for future invoices:

```
INVOICE 1:
  Step 2: All items checked (first time, no learning yet)
  Step 3: User checks 6 items as ignored, records reasons
         → These 6 are saved to venue_ignore

INVOICE 2 (FEEDBACK LOOP):
  Step 2: venue_ignore loads → Auto-unchecks same 6 items ✨
         → User sees they're already in ignore list
         → Can accept or override
  Step 3: If user adds 1 more ignored item
         → venue_ignore now has 7 items for next time
```

## Architecture

### Database Table: `venue_ignore`

This table is the **learning database** for ignored items:

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

**Key fields:**
- `supplier_sku`: Used to match items in future invoices (for auto-unchecking in Step 2)
- `reason`: Optional explanation for why item is ignored
- `UNIQUE constraint`: Ensures one entry per SKU per supplier per venue

### Component Props Interface

**Step3_IgnoreItems receives:**

```javascript
{
  // Data from Step 2 (the unchecked items)
  ignoredItems: [
    {
      supplierSku: "045632",
      supplierName: "Butter 500g",
      categoryHeader: "CHILLED",
      packSize: "1x500g",
      unitSize: "500g",
      quantity: 1,
      unitPrice: 4.50,
      rrp: 5.99,
      vatCode: "A",
      vatRate: 0,
      lineTotal: 4.50
    },
    {
      supplierSku: "058234",
      supplierName: "Milk Semi-Skimmed 1L",
      categoryHeader: "CHILLED",
      // ... other fields
    },
    // ... 6 items total (all unchecked from Step 2)
  ],

  // User & venue context
  venueId: "UUID",
  userId: "UUID",
  detectedSupplier: {
    id: "74f1b14b-6020-4575-a23c-2ff7a4a6f7d2",
    name: "Booker Limited"
  },

  invoiceMetadata: {
    invoiceNumber: "3596857",
    invoiceDate: "2025-05-01"
  },

  // Checkbox state for ignored items (all start as TRUE = checked)
  ignoreCheckboxes: {
    0: true,   // Item 0 (Butter) - IGNORE this item
    1: true,   // Item 1 (Milk) - IGNORE this item
    2: false,  // Item 2 - User unchecked, reconsidering
    3: true,
    // ... etc
  },

  // Reason text for each item
  ignoreReasons: {
    0: "We don't stock butter",
    1: "",
    2: "",
    3: "Customer requested no alcohol",
    // ... etc
  },

  // Callbacks
  onCheckboxChange: (itemIndex, checked) => void,
  onReasonChange: (itemIndex, reason) => void,
  onComplete: () => void,
  onBack: () => void
}
```

## UI Layout

### Main Layout

```
┌────────────────────────────────────────────────────────────────┐
│  Confirm Ignored Items                                         │
│                                                                │
│  Items your venue doesn't stock (from Step 2 unselected)     │
│  Review and confirm or uncheck to add back to invoice        │
├────────────────────────────────────────────────────────────────┤
│  Invoice #3596857 | Booker Limited | 01/05/2025             │
│  Items to confirm: 6 of 58 total items                       │
├────────────────────────────────────────────────────────────────┤

[Item Card 1]
[Item Card 2]
[Item Card 3]
... more items ...

├────────────────────────────────────────────────────────────────┤
│  Summary:                                                      │
│  - Will be ignored (checked): 5 items                         │
│  - Being reconsidered (unchecked): 1 item                     │
│  - These will be saved to your ignore list for future invoices│
├────────────────────────────────────────────────────────────────┤
│  [← Back]  [Save & Continue →]                                │
└────────────────────────────────────────────────────────────────┘
```

### Item Card Layout (Repeated for each ignored item)

```
┌────────────────────────────────────────────────────────────────┐
│  [☑]  045632 | Butter 500g | CHILLED | £4.50 x1 = £4.50     │
│  └─────────────────────────────────────────────────────────────┤
│     Reason: [We don't stock butter            ______________]  │
│             (Optional - helps you remember why next time)      │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  [☑]  058234 | Milk Semi-Skimmed 1L | CHILLED | £3.00 x2 = £6│
│  └─────────────────────────────────────────────────────────────┤
│     Reason: [                                 ______________]  │
│             (Optional - no reason recorded)                    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  [☐]  089115 | Sambuca Liqueur | ALCOHOLIC | £12.00 x1 = £12  │
│  └─────────────────────────────────────────────────────────────┤
│     (Unchecked - will be imported with invoice instead)        │
│     Reason: [                                 ______________]  │
└────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Item Checkbox (Same Styling as Step 2)

**Visual appearance:**
- **Checked** (✓): Blue background (#007bff), white checkmark
  - Meaning: "Ignore this item, save to venue_ignore"
- **Unchecked** (□): Light gray background (#dee2e6), gray border
  - Meaning: "Don't ignore this, add back to invoice"

**Default state:**
- All items start as CHECKED (they were unchecked in Step 2, so assuming they should be ignored)
- User can uncheck any item to reconsider

**Behavior:**
- Click checkbox to toggle
- Updates counts in real-time
- Visual feedback on state change

### 2. Item Details Display

For each ignored item, display:

```
[Checkbox]  SKU | Product Name | Category | Unit Price x Qty = Total
```

**Example:**
```
[☑]  045632 | Butter 500g | CHILLED | £4.50 x1 = £4.50
```

**Fields shown:**
- **SKU**: `supplier_sku` (used for matching in future invoices)
- **Product Name**: `supplierName`
- **Category**: `categoryHeader`
- **Unit Price**: `unitPrice`
- **Quantity**: `quantity`
- **Line Total**: `lineTotal` (price × qty)

### 3. Reason Input Box (Below Each Item)

```
Reason: [_____________________________________]
        (Optional - helps you remember why next time)
```

**Features:**
- **Optional text input** for each item
- **Placeholder text**: "Optional - helps you remember..."
- **Max length**: 500 characters (matches database)
- **Pre-populated**: From Step 3 state if user edited it
- **Real-time updates**: onChange triggers `onReasonChange`
- **Visual style**: Matches Step 2 input styling

**When saved to database:** Stored in `venue_ignore.reason` column

**Example reasons:**
- "We don't stock dairy"
- "Out of stock regularly"
- "Customer requested no alcohol"
- "Insufficient storage space"
- "Product discontinued"
- "Too expensive, use alternative"

### 4. Dynamic Summary Section

Shows real-time counts:

```
Summary:
- Will be ignored (checked): 5 items
  └─ These 5 will be saved to your venue ignore list
- Being reconsidered (unchecked): 1 item
  └─ This 1 will be imported with the invoice instead
```

**Updates when:**
- User toggles a checkbox
- Helps user see the impact of their choices

### 5. Item Grouping (Optional Visual Enhancement)

Items could be grouped by category:

```
┌─────── CHILLED ITEMS ───────────────────┐
│ [☑] 045632 | Butter 500g | £4.50 x1    │
│ [☑] 058234 | Milk 1L | £3.00 x2        │
└─────────────────────────────────────────┘

┌─────── ALCOHOLIC ITEMS ─────────────────┐
│ [☐] 089115 | Sambuca | £12.00 x1       │
└─────────────────────────────────────────┘
```

(Implementation detail - can be added later if desired)

### 6. Action Buttons

- **← Back**: Return to Step 2 to change selections
- **Save & Continue →**: Save checked items to venue_ignore, proceed to Step 4
  - Disabled if no items to process

## Workflow Integration

### From InvoiceWorkflow Perspective

```javascript
// When Step 2 completes:
const handleReviewComplete = (itemCheckboxes) => {
  // Calculate which items were NOT selected (unchecked in Step 2)
  const uncheckedIndices = Object.entries(itemCheckboxes)
    .filter(([_, isChecked]) => !isChecked)
    .map(([idx, _]) => parseInt(idx));

  const itemsToIgnore = uncheckedIndices.map(idx => ({
    ...parsedItems[idx],
    originalIndex: idx
  }));

  setIgnoredItems(itemsToIgnore);

  // Initialize all as checked (they will be ignored by default)
  const ignoreCheckboxes = {};
  itemsToIgnore.forEach((_, idx) => {
    ignoreCheckboxes[idx] = true; // TRUE = ignore this item
  });
  setIgnoreCheckboxes(ignoreCheckboxes);

  // Initialize reasons as empty
  const reasons = {};
  itemsToIgnore.forEach((_, idx) => {
    reasons[idx] = '';
  });
  setIgnoreReasons(reasons);

  setCurrentStep(3);
};

// When item checkbox changes in Step 3:
const handleIgnoreCheckboxChange = (index, checked) => {
  setIgnoreCheckboxes(prev => ({
    ...prev,
    [index]: checked
  }));
};

// When reason changes in Step 3:
const handleIgnoreReasonChange = (index, reason) => {
  setIgnoreReasons(prev => ({
    ...prev,
    [index]: reason
  }));
};

// When Step 3 completes:
const handleIgnoreConfirmed = async () => {
  try {
    // Filter to CHECKED items only (items to ignore)
    const itemsToSave = ignoredItems.filter((_, idx) =>
      ignoreCheckboxes[idx]
    );

    // Save to venue_ignore table
    const response = await fetch('/api/venue-ignore/save', {
      method: 'POST',
      body: JSON.stringify({
        venueId,
        supplierId: detectedSupplier.id,
        items: itemsToSave.map((item, idx) => ({
          supplierSku: item.supplierSku,
          productName: item.supplierName,
          reason: ignoreReasons[idx] || null
        }))
      })
    });

    if (response.ok) {
      // Now we need to add UNCHECKED items back to the import list
      const uncheckedIndices = ignoredItems
        .map((item, idx) => ignoreCheckboxes[idx] ? null : item.originalIndex)
        .filter(idx => idx !== null);

      // Update parent state: add unchecked items back to selected items
      const updatedCheckboxes = { ...itemCheckboxes };
      uncheckedIndices.forEach(idx => {
        updatedCheckboxes[idx] = true; // Re-check these items
      });

      // Proceed to Step 4
      setCurrentStep(4);
    }
  } catch (error) {
    setError(`Failed to save ignored items: ${error.message}`);
  }
};
```

## API Endpoints

### POST /api/venue-ignore/save

**Purpose**: Save items to the venue_ignore table (NEW LEARNING DATA)

**Request:**
```javascript
POST /api/venue-ignore/save

{
  venueId: "UUID",
  supplierId: "UUID",
  items: [
    {
      supplierSku: "045632",
      productName: "Butter 500g",
      reason: "We don't stock dairy"
    },
    {
      supplierSku: "058234",
      productName: "Milk Semi-Skimmed 1L",
      reason: null  // No reason provided
    },
    // ... only CHECKED items from Step 3
  ]
}
```

**Response:**
```javascript
{
  success: true,
  savedCount: 5,
  skippedCount: 0,  // Items with UNIQUE constraint conflicts
  message: "5 items saved to venue ignore list"
}
```

**Error handling:**
- UNIQUE constraint violation (same SKU already in venue_ignore)
  - Skip that item (don't error out)
  - User can manually manage venue_ignore later if needed
  - Report how many skipped in response

## Progressive Learning Feedback Loop

```
STEP 3 BEHAVIOR:

Item is CHECKED:
  ├─ Display checkbox as [☑] (blue, checked)
  ├─ Display reason input (filled or empty)
  └─ ON SAVE: Send to /api/venue-ignore/save
     └─ Added to venue_ignore table
     └─ Next invoice: Step 2 will auto-uncheck it ✨

Item is UNCHECKED:
  ├─ Display checkbox as [☐] (gray, unchecked)
  ├─ Display note: "(Unchecked - will be imported with invoice)"
  └─ ON SAVE: Don't send to API
     └─ Not added to venue_ignore
     └─ Item goes back to import list
     └─ Item continues to Step 4 for master product matching
```

## Error Handling

### Validation

1. **At least one item to process**
   - Can proceed even if all items unchecked (user reconsidering everything)
   - Can proceed even if all items checked (ignoring everything)

2. **Network error during save**
   - Display: "Failed to save ignored items. Please try again."
   - Allow retry

3. **Database constraint error (UNIQUE violation)**
   - Item already in venue_ignore (added in previous invoice)
   - Don't error - just skip it and report
   - User can manually manage if needed

## Testing Scenarios

1. **Basic Flow**: 6 items to ignore, all checked, save successfully
2. **With Reasons**: User provides reasons for 3 items
3. **Reconsidering**: User unchecks 1 item (wants to import it after all)
4. **No Ignores**: User unchecks all items (changes mind)
5. **All Ignore**: User confirms all as ignored
6. **Duplicate SKU**: Same item being ignored again (UNIQUE constraint)
7. **Progressive Learning**: Next invoice from same supplier shows auto-unchecked items

## Success Criteria

After Step 3 submission:

1. **Database**: venue_ignore table updated with checked items
2. **State**: Unchecked items added back to import list
3. **Counts**: Updated (X items will be ignored, Y will be imported)
4. **Next Step**: Proceed to Step 4 with correct item list
5. **Learning**: Future invoices show auto-unchecked items in Step 2

## Visual Mockup - Full Example

```
┌────────────────────────────────────────────────────────────────┐
│ ✅ Confirm Ignored Items                                       │
│                                                                │
│ Items your venue doesn't stock (from Step 2 unselected)       │
│ Review and confirm, or uncheck to add back to invoice         │
├────────────────────────────────────────────────────────────────┤
│ Invoice #3596857 | Booker Limited | 01/05/2025              │
│ Items to review: 6 of 58 total                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ [☑] 045632 | Butter 500g | CHILLED | £4.50 x1 = £4.50 ││
│ │ Reason: [We don't stock dairy           _______________]││
│ └──────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ [☑] 058234 | Milk 1L | CHILLED | £3.00 x2 = £6.00     ││
│ │ Reason: [                               _______________]││
│ └──────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ [☐] 089115 | Sambuca Liqueur | ALC | £12.00 x1        ││
│ │ (Unchecked - will be imported with invoice)              ││
│ │ Reason: [                               _______________]││
│ └──────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ [☑] 045389 | Fanta Orange 330ml | SOFT DRINK | £0.50   ││
│ │ Reason: [Customer doesnt like             _______________]││
│ └──────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ [☑] 071234 | Apple Juice 2L | SOFT DRINK | £2.50 x1   ││
│ │ Reason: [                               _______________]││
│ └──────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ [☐] 063456 | Orange Juice 1L | SOFT DRINK | £1.80 x3  ││
│ │ (Unchecked - will be imported with invoice)              ││
│ │ Reason: [                               _______________]││
│ └──────────────────────────────────────────────────────────┘│
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ Summary:                                                       │
│ ✓ Will be ignored (checked): 4 items                         │
│   → Saved to your venue ignore list                          │
│ ✗ Being reconsidered (unchecked): 2 items                    │
│   → Will be imported with invoice                            │
├────────────────────────────────────────────────────────────────┤
│ [← Back]                              [Save & Continue →]     │
└────────────────────────────────────────────────────────────────┘
```

## Future Enhancements

- [ ] Group items by category (visual organization)
- [ ] Reason templates/suggestions ("We don't stock...", "Out of stock...", etc.)
- [ ] Bulk operations (check all CHILLED, check all items without reason, etc.)
- [ ] Show why item was auto-unchecked in Step 2 (reason from previous venue_ignore)
- [ ] Analytics: Most commonly ignored items per venue
- [ ] Manual venue-ignore management UI (view/edit/delete entries)
- [ ] Bulk import of ignore lists from other venues
- [ ] Export/share ignore lists between similar venues
