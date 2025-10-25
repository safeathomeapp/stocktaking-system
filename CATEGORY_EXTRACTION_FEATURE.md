# Category Extraction Feature - Implementation Summary

## Overview
This document describes the implementation of hierarchical product category extraction and display for Booker PDF invoices in the stocktaking system. The feature enables users to view and manage products organized by category with collapsible sections and parent/child checkbox selection.

---

## Feature Description

### What It Does
- Automatically extracts product categories from Booker supplier invoices during PDF parsing
- Displays products grouped by category in Step 2 (Supplier Invoice Review)
- Provides hierarchical selection with parent checkboxes to toggle entire categories
- Implements visual partial-state indicators when some products in a category are selected
- Allows category sections to be collapsed/expanded for better UI navigation
- Automatically hides "Select All/Deselect All" buttons when categories are detected

### User Experience
1. User uploads a Booker PDF invoice
2. System detects and extracts product categories (e.g., TOBACCO, RETAIL GROCERY, WINES SPIRITS BEERS)
3. Step 2 displays products organized by category instead of flat list
4. Each category shows:
   - Collapse/expand triangle icon (▼/▶)
   - Category checkbox with partial-state support
   - Item count and subtotal
   - Products in that category (initially expanded)
5. User can click category header to toggle expansion
6. Parent checkbox controls all products in that category
7. Parent checkbox shows partial state (half blue/half white) when some items selected

---

## Technical Implementation

### 1. Backend PDF Parser Enhancement
**File**: `backend/server.js` (Lines 1996-2310)
**Function**: `parseSupplierInvoicePDF()`

#### Changes Made:
- Added `KNOWN_CATEGORIES` array with 19 common Booker categories:
  - TOBACCO, RETAIL GROCERY, CATERING GROCERY, CONFECTIONERY
  - WINES SPIRITS BEERS, FRUIT & VEG, NON-FOOD, FRESH PRODUCE
  - BAKERY, FROZEN, AMBIENT, CHILLED, HEALTH & BEAUTY
  - EQUIPMENT, GLASSWARE, DISPOSABLES, DAIRY, FISH & SHELLFISH, MEAT & POULTRY

- Implemented two-pass category detection algorithm:
  1. **First Pass**: Identify product line indices by finding lines with quantity/price patterns
  2. **Second Pass**: Detect category headers using two strategies:
     - Primary: Regex pattern matching for lines like "CATEGORY SUB-TOTAL : ITEMS X GOODS £Y"
     - Fallback: Match lines starting with known category keywords

- Enhanced product assignment:
  - Each product now includes `category` field with detected category name
  - Default category "UNCATEGORIZED" for products without detected category

- API Response includes:
  ```javascript
  {
    categories: [
      { name: "TOBACCO", itemCount: 5, subtotal: 125.50 },
      { name: "RETAIL GROCERY", itemCount: 10, subtotal: 234.75 },
      ...
    ],
    hasCategories: true,
    products: [...] // with category field
  }
  ```

### 2. Frontend Components

#### A. PartialStateCheckbox Component
**File**: `frontend/src/components/PartialStateCheckbox.js`

A custom checkbox with three states:
- **Unchecked**: White background with gray border
- **Checked**: Blue background with white checkmark (✓)
- **Partial**: Diagonal split visual (blue triangle bottom-left, white top-right)

**Key Features**:
- Uses SVG overlay for the diagonal split partial-state visual
- Smooth transitions between states
- Full keyboard accessibility with hidden input element
- Hover effects for visual feedback

**Props**:
```javascript
<PartialStateCheckbox
  checked={boolean}        // True if all items selected
  partial={boolean}        // True if some but not all items selected
  onChange={function}      // Called when checkbox clicked
/>
```

**Visual States**:
- Unchecked: Empty white box
- Partial: Diagonal blue fill (top-left to bottom-right)
- Checked: Solid blue with checkmark

#### B. CategoryProductsDisplay Component
**File**: `frontend/src/components/CategoryProductsDisplay.js`

Main component for displaying products organized by category.

**Key Features**:
- Maps categories to expandable sections
- Collapse state tracking (stored in local component state)
- Auto-expands all categories on load
- Smooth max-height animation for collapse/expand
- Category headers with:
  - Collapse/expand triangle (▼ when expanded, ▶ when collapsed)
  - Partial-state checkbox for parent selection
  - Category name with item count
  - Subtotal information (£ format)
- Product rows with:
  - Individual checkboxes
  - SKU, name, pack size, unit size, unit price
  - Proper indentation to show hierarchy

**Props**:
```javascript
<CategoryProductsDisplay
  categories={Array}           // [{name, itemCount, subtotal}]
  products={Array}             // [{...product, category, selected}]
  onProductToggle={function}   // (productIndex) => void
  onCategoryToggle={function}  // (categoryName, newState) => void
/>
```

**Styling**:
- Uses styled-components for CSS-in-JS
- Responsive grid layout for product details
- Hover effects on category headers and product rows
- Smooth transitions and animations

#### C. SupplierInvoiceReview Component Modifications
**File**: `frontend/src/components/SupplierInvoiceReview.js`

**State Management** (Lines 400-403):
```javascript
const [categories, setCategories] = useState([]);
const [hasCategories, setHasCategories] = useState(false);
```

**PDF Response Handling** (Lines 628-637):
- Extracts categories from API response
- Sets `hasCategories` flag for conditional rendering
- Updates categories array with parsed metadata

**Toggle Functions** (Lines 649-681):
```javascript
// Toggle individual product
toggleProduct(index) {
  // Updates product.selected state
  // Triggers parent category state update
}

// Toggle all products in a category
toggleCategory(categoryName, newState) {
  // Updates all products matching category
  // Handles parent/child checkbox logic
}

// Select/deselect all (only when no categories detected)
toggleAll(selected) {
  // Selects/deselects all products
  // Only shown when hasCategories is false
}
```

**Conditional Rendering** (Lines 1180-1267):
```javascript
{hasCategories ? (
  <CategoryProductsDisplay
    categories={categories}
    products={products}
    onProductToggle={toggleProduct}
    onCategoryToggle={toggleCategory}
  />
) : (
  // Original flat product table
  <ProductTable ... />
)}

// Select All/Deselect All buttons only shown when !hasCategories
```

---

## How It Works - Flow Diagram

```
User Uploads PDF
    ↓
Backend PDF Parser
    ├─ Detects invoice metadata
    ├─ Extracts products
    └─ Runs category detection:
       ├─ First pass: Find product line indices
       └─ Second pass: Detect categories (pattern or keyword match)
    ↓
API Returns:
    {
      categories: [...],
      hasCategories: true,
      products: [...]
    }
    ↓
Frontend SupplierInvoiceReview
    ├─ Receives API response
    ├─ Extracts categories & sets hasCategories
    └─ Conditional rendering:
       ├─ If hasCategories: Show CategoryProductsDisplay
       └─ If !hasCategories: Show flat ProductTable
    ↓
User Interaction
    ├─ Click category header → Toggle expand/collapse
    ├─ Click category checkbox → Select/deselect all in category
    └─ Click product checkbox → Toggle individual product
    ↓
Parent/Child Logic
    ├─ Child checkbox checked → Parent shows checked state
    ├─ Some children checked → Parent shows partial state
    └─ No children checked → Parent shows unchecked state
    ↓
Product filters to invoice → Step 3 → Step 5 Summary
```

---

## Category Detection Strategy

### Primary Pattern (Booker Invoice Format)
```regex
^([A-Z\s&\-]+?)\s+SUB-TOTAL\s*:\s*ITEMS\s+(\d+)\s+GOODS\s*:\s*([\d.]+)
```

Matches lines like:
```
TOBACCO SUB-TOTAL : ITEMS 5 GOODS : 125.50
RETAIL GROCERY SUB-TOTAL : ITEMS 10 GOODS : 234.75
```

Extracts:
1. Category name: "TOBACCO"
2. Item count: 5
3. Subtotal: 125.50

### Fallback Pattern (Keyword Matching)
If primary pattern doesn't match, checks if line starts with known category keyword:
- TOBACCO, RETAIL GROCERY, CATERING GROCERY, CONFECTIONERY, etc.

### Category Assignment
- Products listed after category header → Assigned to that category
- Products before first category → UNCATEGORIZED
- Uses `currentCategory` variable during parsing to track assignment

---

## State Management

### Product Selection Logic

**Individual Product Toggle**:
1. User clicks product checkbox
2. Toggle product's `selected` state
3. Recalculate category states (for partial-state indicator)
4. Update parent checkbox visual state

**Category Toggle**:
1. User clicks category checkbox
2. Toggle ALL products in category to same state
3. Update parent checkbox visual state
4. Products from other categories unaffected

**Category Collapse/Expand**:
1. User clicks category header or triangle
2. Toggle `expandedCategories[categoryName]` state
3. Animate max-height for smooth effect
4. Independent of selection state (not saved)

### Partial State Detection

```javascript
const selectedInCategory = products
  .filter(p => p.category === categoryName && p.selected)
  .length;

const hasPartialSelection = selectedInCategory > 0 &&
                           selectedInCategory < totalInCategory;
const isFullySelected = selectedInCategory === totalInCategory &&
                       totalInCategory > 0;
```

---

## File Changes Summary

### New Files Created
1. **PartialStateCheckbox.js** (135 lines)
   - Custom checkbox component
   - Three-state visual indicator
   - SVG-based partial state

2. **CategoryProductsDisplay.js** (340 lines)
   - Main category display component
   - Hierarchical product organization
   - Collapse/expand functionality
   - Parent/child checkbox logic

### Modified Files
1. **server.js** (backend/server.js)
   - Enhanced parseSupplierInvoicePDF function
   - Added category detection (2-pass algorithm)
   - Updated API response structure
   - Lines 1996-2310 affected

2. **SupplierInvoiceReview.js** (frontend)
   - Added category state management
   - Extracted categories from API response
   - Implemented toggleCategory function
   - Conditional rendering based on hasCategories
   - Hides Select All/Deselect All buttons when categories exist
   - Integrated CategoryProductsDisplay component

### Git Commits
1. **db5fd5c**: Backend category extraction implementation
2. **8f22e22**: Frontend category components and integration
3. **64c79c9**: Fixed styled-components props access in PartialStateCheckbox

---

## Testing Checklist

- [x] Backend PDF parser extracts categories correctly
- [x] API response includes categories array and hasCategories flag
- [x] Frontend compiles without errors
- [x] CategoryProductsDisplay renders when categories detected
- [x] Flat product table renders when no categories detected
- [x] Category collapse/expand animation works smoothly
- [x] Parent checkbox toggles all products in category
- [x] Child checkboxes update parent state
- [x] Partial-state visual indicator shows correctly
- [x] Select All/Deselect All buttons hidden when hasCategories is true
- [x] Product selection persists through category expand/collapse
- [x] Step 3 and Step 5 receive correctly filtered products

---

## Known Limitations

1. **Collapse State Not Persisted**: Category expand/collapse state resets on page reload (by design, stored in component state only)

2. **Fallback Detection**: If invoice PDF format differs significantly from Booker standard, fallback keyword matching may not detect all categories

3. **Category Name Variations**: If Booker changes category names or adds new ones, KNOWN_CATEGORIES array needs manual update

4. **No Manual Category Assignment**: Current implementation doesn't allow users to reassign products to different categories

---

## Future Enhancements

1. **Persist Collapse State**: Store expanded/collapsed state in localStorage
2. **Manual Category Management**: Allow users to move products between categories
3. **Custom Category Creation**: Let users create custom categories for non-Booker invoices
4. **Category Filtering**: Filter by category in Step 2 display
5. **Batch Category Operations**: Select multiple categories for bulk operations
6. **Category Search**: Search products within specific categories
7. **Improved Category Detection**: ML-based category detection for better accuracy
8. **Multi-language Support**: Category names in different languages

---

## Git Log

```bash
64c79c9 fix: Fix styled-components props access in PartialStateCheckbox
8f22e22 feat: Implement category display with hierarchical selection
db5fd5c feat: Enhance PDF parser to extract categories from Booker invoices
```

---

## Related Documentation

- **Backend Parser**: See `backend/server.js` lines 1996-2310
- **React Components**: See `frontend/src/components/`
- **API Response Format**: `POST /api/invoices/parse-supplier-pdf`
- **State Management**: Props and callbacks in component files

---

## Support & Maintenance

For questions or issues related to the category extraction feature:
1. Check this documentation
2. Review commit messages for implementation decisions
3. Check inline code comments in component files
4. Test with actual Booker PDF invoices from `test-invoices/` directory

---

Generated: 2025-10-25
Version: 1.0
Feature Status: ✅ Complete
