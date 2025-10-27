# Step 4: Master Product Matching - Design Document

## Overview

Step 4 handles manual matching of supplier items to master products. This step is triggered when Step 3 (Smart Matching) has items that could not be automatically matched with high confidence.

In Step 3, the system performs a three-tier matching process:
1. **Tier 1 (MATCHED)**: Items found in supplier_item_list → Automatically linked
2. **Tier 2 (CREATED)**: Items fuzzy-matched to master_products with ≥60% confidence → Automatically linked
3. **Tier 2 Failed (NEEDS_MASTER_MATCH)**: Items with <60% confidence → Flagged for manual Step 4

Step 4 allows users to manually resolve these unmatched items by searching and selecting the correct master product.

## Three-Tier Matching System Context

```
Step 3 Output:
├── MATCHED Items (Tier 1)
│   └── Found in supplier_item_list
│       └── Status: ✅ Complete - Skip Step 4
├── CREATED Items (Tier 2 - Good Match)
│   └── Fuzzy matched with ≥60% confidence
│       └── Status: ✅ Complete - Skip Step 4
└── NEEDS_MASTER_MATCH Items (Tier 2 - Poor Match)
    └── Fuzzy matched with <60% confidence OR no match found
        └── Status: ⏳ Requires Step 4 Manual Matching
```

## Progressive Learning System

Step 4 is part of a continuous improvement cycle:

```
Invoice 1: New Supplier
  ├─ Parse items → Step 3 attempts fuzzy match → Some fail
  ├─ Step 4: User manually selects master product
  └─ Result saved to supplier_item_list with verified=true

Invoice 2: Same Supplier (Next Week)
  ├─ Parse items → Step 3: Tier 1 finds items in supplier_item_list (INSTANT!)
  ├─ Result: MATCHED status
  └─ Benefit: No manual Step 4 intervention needed!
```

Each manually verified match becomes part of the learning system (supplier_item_list), speeding up future processing.

## Architecture

### Database Context

#### supplier_item_list Table
The table records the relationship between a supplier's SKU and a master product:

```sql
CREATE TABLE supplier_item_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL,
  supplier_sku VARCHAR(100) NOT NULL,
  supplier_name VARCHAR(255),
  master_product_id UUID,

  -- Fuzzy matching metadata
  auto_matched BOOLEAN DEFAULT false,
  confidence_score NUMERIC(5,2),
  verified BOOLEAN DEFAULT false,  -- Set to TRUE after user confirmation

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(supplier_id, supplier_sku),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (master_product_id) REFERENCES master_products(id),
  CHECK (master_product_id IS NOT NULL OR auto_matched = false)
);
```

**Key Fields for Step 4:**
- `master_product_id` (NULL when arriving in Step 4)
- `verified` (FALSE → Set to TRUE when user confirms)
- `confidence_score` (Already populated from Step 3)
- `auto_matched` (Already FALSE since these items failed auto-matching)

#### master_products Table
The single source of truth for all products:

```sql
CREATE TABLE master_products (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(100),
  unit_type VARCHAR(50),           -- "CAN", "BOX", "BOTTLE", etc.
  unit_size VARCHAR(50),           -- "330ml", "2kg", etc.
  case_size INT,                    -- Items per case
  barcode VARCHAR(50) UNIQUE,
  rrp DECIMAL(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fuzzy Matching Scoring on this table:**

```sql
SELECT id, name,
       CASE
         WHEN LOWER(name) = LOWER($1) THEN 100                           -- Exact match
         WHEN name ~* $1 THEN 80                                         -- Regex/word match
         WHEN similarity(name, $1) > 0.6 THEN similarity(name, $1)*100   -- ≥60% similarity
         ELSE similarity(name, $1) * 100                                 -- Lower similarity
       END as match_score
FROM master_products
WHERE active = true
ORDER BY match_score DESC
LIMIT 10;
```

### Component Props Interface

**Step4_MasterMatch receives:**

```javascript
{
  // Unmatched items from Step 3
  unmatchedItems: [
    {
      originalIndex: 0,
      supplierSku: "BK-OJ-2L",
      supplierName: "Orange Juice 2 Litre",
      categoryHeader: "SOFT DRINK",
      quantity: 5,
      unitPrice: 2.50,
      lineTotal: 12.50,
      // ... other line item data
    },
    // ... more unmatched items
  ],

  // Supplier context (for learning system)
  detectedSupplier: {
    id: "74f1b14b-6020-4575-a23c-2ff7a4a6f7d2",
    name: "Booker Limited"
  },

  // Callbacks
  onComplete: (matches) => void,     // { itemIndex: { masterProductId, notes } }
  onBack: () => void
}
```

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Master Product Matching                                        │
│  Invoice #3596857 | Booker Limited                             │
│                                                                 │
│  Items requiring manual matching: 3 of 58                      │
├─────────────────────────────────────────────────────────────────┤
│  Item 1 of 3: Orange Juice 2 Litre (SKU: BK-OJ-2L)            │
│  Quantity: 5 | Unit Price: £2.50 | Total: £12.50              │
│                                                                 │
│  Search Master Product:                                         │
│  [Search input field                                      ] 🔍   │
│                                                                 │
│  Suggested Matches:                                             │
│  ┌───────────────────────────────────────────────────────────┐│
│  │ ✓ Orange Juice 2L - Tropicana       [Score: 92%]         ││
│  │ ○ Orange Juice Fresh               [Score: 85%]          ││
│  │ ○ Orange Beverage 2L Mix            [Score: 72%]         ││
│  ├───────────────────────────────────────────────────────────┤│
│  │ [+ Create New Master Product]                            ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                 │
│  [← Back]  [Skip This Item]  [Next Item →]  [Confirm All →]   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Item-by-Item Matching

- **Display current item** with:
  - Supplier product name
  - SKU
  - Category (if available)
  - Quantity and pricing
  - Progress indicator (Item X of Y)

- **Display previously matched items** (summary):
  - Shows items already matched in this Step 4 session
  - Allows navigation back to change previous selections

### 2. Fuzzy Search with Suggestions

- **Search input** for master product names
- **Real-time suggestion dropdown** using `/api/master-products/search` endpoint
- **Confidence scores** displayed for each suggestion:
  - 100%: Exact match
  - 80%+: Word/prefix match
  - 60-79%: Good similarity
  - <60%: Weak match

**API Call:**
```javascript
GET /api/master-products/search?query=orange+juice&limit=10

Response:
{
  success: true,
  results: [
    {
      id: "UUID",
      name: "Orange Juice 2L - Tropicana",
      brand: "Tropicana",
      category: "SOFT DRINK",
      unitSize: "2L",
      matchScore: 92,
      rrp: 2.50
    },
    // ... more results
  ]
}
```

### 3. Select from Suggestions

- **Click to select** from dropdown suggestions
- **Visual confirmation** showing selected product details
- **Review button** to see full product details if needed

### 4. Create New Master Product (Fallback)

If no suitable master product exists:

- **Button:** "Create New Master Product"
- **Form** for quick master product creation:
  - Product name (pre-filled from supplier name)
  - Brand (optional)
  - Category (dropdown from existing categories)
  - Unit type (CAN, BOTTLE, BOX, etc.)
  - Unit size (330ml, 2L, 50g, etc.)
  - Case size (optional)

**API Call:**
```javascript
POST /api/master-products/create

{
  name: "Orange Juice 2L - New Supplier Brand",
  brand: "New Supplier Brand",
  category: "SOFT DRINK",
  unitType: "BOTTLE",
  unitSize: "2L",
  caseSize: 6,
  barcode: null
}

Response:
{
  success: true,
  masterProductId: "UUID",
  message: "Master product created"
}
```

### 5. Navigation Options

- **Back**: Return to Step 3 (loses all Step 4 progress)
- **Skip This Item**: Mark item as unable to match, defer decision
- **Next Item**: Move to next unmatched item
- **Confirm All**: Final confirmation before Step 5

## Workflow Integration

### InvoiceWorkflow State Management

```javascript
// State for Step 4
const [matchedItems, setMatchedItems] = useState({});
const [unmatchedItems, setUnmatchedItems] = useState([]);

// When Step 3 completes:
const handleIgnoreConfirmed = (reasons) => {
  // Filter items: keep only those that were selected in Step 2
  const checkedIndices = Object.entries(itemCheckboxes)
    .filter(([_, isChecked]) => isChecked)
    .map(([idx, _]) => parseInt(idx));

  const itemsToMatch = checkedIndices.map(idx => parsedItems[idx]);

  // Call Step 3 matching endpoint
  const matchResults = await matchSupplierItems(invoiceId);

  // Extract items needing manual matching
  const needsManual = matchResults.failed.map(item => ({
    ...item,
    originalIndex: parsedItems.findIndex(p => p.sku === item.supplierSku)
  }));

  setUnmatchedItems(needsManual);
  setMatchedItems({});  // Will be filled in Step 4
  setCurrentStep(4);
};

// When Step 4 completes:
const handleMatchingComplete = (matches) => {
  setMatchedItems(matches);
  // matches = { itemIndex: { masterProductId, notes } }
  setCurrentStep(5);
};
```

## API Endpoints

### GET /api/master-products/search

**Purpose:** Fuzzy search master products with confidence scoring

**Request:**
```javascript
GET /api/master-products/search?query=orange+juice&limit=10&category=SOFT_DRINK
```

**Parameters:**
- `query` (required): Search term
- `limit` (optional): Max results (default: 10)
- `category` (optional): Filter by category

**Response:**
```javascript
{
  success: true,
  results: [
    {
      id: "UUID",
      name: "Orange Juice 2L",
      brand: "Tropicana",
      category: "SOFT DRINK",
      unitType: "BOTTLE",
      unitSize: "2L",
      caseSize: 6,
      barcode: "123456789",
      rrp: 2.50,
      matchScore: 92,
      active: true
    },
    // ... more results ordered by match_score DESC
  ],
  count: 5
}
```

### PUT /api/invoice-line-items/:id/link-master-product

**Purpose:** Link an invoice line item to a master product (UPDATE supplier_item_list too)

**Existing Endpoint** (Line 2438 in server.js - currently unused)

**Request:**
```javascript
PUT /api/invoice-line-items/:invoiceLineItemId/link-master-product

{
  masterProductId: "UUID",
  notes: "User manually selected this product"
}
```

**Response:**
```javascript
{
  success: true,
  lineItemId: "UUID",
  linkedAt: "2025-10-27T14:30:00Z",
  message: "Line item linked to master product"
}
```

**Backend Logic:**
1. Update `invoice_line_items.master_product_id = $masterProductId`
2. Find corresponding `supplier_item_list` record
3. Update `supplier_item_list.master_product_id = $masterProductId`
4. Set `supplier_item_list.verified = true` (manually verified)
5. Return success

### POST /api/master-products/create

**Purpose:** Create a new master product (for items that don't match anything)

**Request:**
```javascript
POST /api/master-products/create

{
  name: "Orange Juice 2L - Brand X",
  brand: "Brand X",
  category: "SOFT DRINK",
  unitType: "BOTTLE",
  unitSize: "2L",
  caseSize: 6,
  barcode: null,
  rrp: 2.50
}
```

**Response:**
```javascript
{
  success: true,
  masterProductId: "UUID",
  message: "Master product created successfully"
}
```

## Error Handling

### Scenarios

1. **No search results found**
   - Display: "No master products found for 'xyz'"
   - Action: Offer "Create New Master Product" button
   - Allow: Skip this item for manual review later

2. **Network/API error during search**
   - Display: "Error searching products. Please try again."
   - Allow: Offline mode with cached suggestions (if available)

3. **Cannot create new product**
   - Required fields missing (name, category)
   - Display validation errors
   - Allow: Retry or skip item

4. **Cannot link to master product**
   - Master product not found
   - Database constraint error
   - Display: "Failed to link product. Try again or create new."

5. **Duplicate supplier_item_list entries**
   - User tries to match same SKU to different master product
   - System should warn: "This SKU is already linked to [existing product]"
   - Options: Confirm override or cancel

## Data Flow Summary

```
Step 4 Input (from Step 3):
├── unmatchedItems: [{ supplierSku, supplierName, ... }]
├── invoiceId
└── detectedSupplier: { id, name }

User Actions:
├── Search master product
├── Select from suggestions OR create new
├── Confirm selection → Update supplier_item_list
└── Move to next item OR confirm all

Step 4 Output (to Step 5):
├── matchedItems: {
│   itemIndex: { masterProductId, notes },
│   ...
│ }
├── newMasterProducts: [{ id, name, ... }]  (if created)
└── unresolved: [{ itemIndex, reason }]     (if skipped)
```

## Learning System Integration

After Step 4, all matched items create/update `supplier_item_list`:

**For existing supplier_item_list entry (Tier 2 failed):**
```sql
UPDATE supplier_item_list
SET master_product_id = $masterProductId,
    verified = true,
    auto_matched = false,  -- User manually verified
    updated_at = NOW()
WHERE id = $supplierItemListId;
```

**For new entries (created items from Step 3):**
```sql
INSERT INTO supplier_item_list (
  supplier_id, supplier_sku, supplier_name,
  master_product_id, verified, auto_matched
)
VALUES (
  $supplierId, $sku, $name,
  $masterProductId, true, false  -- true because user manually verified
);
```

**Result:** Next invoice from same supplier uses Tier 1 exact match → No Step 4 needed!

## Testing Scenarios

1. **Basic Flow**: 3 unmatched items, user manually selects master products, all matched
2. **Search Results**: Search returns multiple suggestions, user selects correct one
3. **Create New Product**: No good match found, user creates new master product
4. **Skip Item**: User defers decision on one item, completes others
5. **Back Navigation**: User goes back to Step 3, loses Step 4 progress
6. **Learning System**: Next invoice from same supplier shows faster matching
7. **Duplicate SKU**: System warns when matching same SKU to different master product
8. **Fuzzy Search**: Verify confidence scores displayed correctly

## Future Enhancements

- [ ] Barcode scanner integration for faster product selection
- [ ] Product image display for visual confirmation
- [ ] Batch operations (match multiple items to same master product)
- [ ] Machine learning confidence scoring improvements
- [ ] Supplier product catalog sync (automated updates from supplier)
- [ ] Analytics dashboard for most commonly matched items
- [ ] Undo functionality to change previous Step 4 selections
