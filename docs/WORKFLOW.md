# Stock Taking Workflow & Processes

## Complete Stocktaking & Variance Workflow

### Overview
The system tracks opening stock, purchases, sales, wastage, and closing stock to calculate variance and generate financial reports.

**Variance Formula**: Opening Stock + Purchases - Wastage - Sales = Expected Stock
**Actual Variance**: Expected Stock - Actual Counted Stock

---

## First-Time Venue Setup

### 1. User Profile Setup (One-Time)
1. Open program
2. Navigate to User Profile Settings
3. Enter personal details (name, contact info, etc.)
4. Save profile

### 2. Create Venue (One-Time)
1. Dashboard → "Add New Venue"
2. Enter venue details (name, address, contact, billing rate)
3. Add venue areas (Bar, Kitchen, Cellar, Storage, etc.)
4. Use drag-and-drop to set area display order

### 3. Import Opening Stock (First Stocktake Only)
**Purpose**: Establish baseline for first variance report

**Data Sources**:
- EPOS system export
- Previous stocktaking software export
- Manual input from paper stocktake

**Process**:
1. System prompts: "Enter details of your last stocktake"
2. User provides date of last stocktake
3. System creates stock_session with:
   - `status = 'completed'`
   - `created_at = last_stocktake_date`
   - `completed_at = last_stocktake_date`
   - `updated_at = last_stocktake_date`
   - `notes = 'First system count - Opening stock imported from [source]'`
4. User imports product names + quantities (CSV/Manual)
5. System creates stock_entries for each product with opening stock date

### 4. Match Products to Master Database
**For each imported product**:

1. **Fuzzy Match**: System searches master_products by name
2. **If Match Found**:
   - Create venue_products entry with master_product_id
   - Link stock_entry to venue_products
3. **If No Match**:
   - Prompt user for manual confirmation
   - User enters: brand, unit_size, unit_type, case_size, category
   - System checks for duplicates in master_products
   - If confirmed new: Create master_product
   - Create venue_products entry with master_product_id
   - Link stock_entry to venue_products

**Result**: All opening stock linked to master_products via venue_products

---

## Recurring Workflow (Every Stock Period)

### 5. Import Supplier Invoices
**Purpose**: Track purchases for variance calculation

**Import Methods**: PDF OCR, CSV, or Manual input

#### Invoice Processing Architecture

**3-Table Design:**

```
┌─────────────────────┐
│ invoice_line_items  │ ← Transaction records (what was purchased)
│  - Raw supplier data│
│  - Pricing data     │
└──────┬──────────────┘
       │ Links to ↓
┌──────▼──────────────┐
│ supplier_item_list  │ ← Mapping table (how to find it)
│  - SKU → Product    │
│  - Naming variations│
└──────┬──────────────┘
       │ Links to ↓
┌──────▼──────────────┐
│ master_products     │ ← Product catalog (what it is)
│  - Specifications   │
│  - Case size, brand │
└─────────────────────┘
```

**Data Flow:**
1. **invoice_line_items** = Financial/transactional (stores actual purchase with pricing)
2. **supplier_item_list** = Operational lookup (maps supplier SKU → master product)
3. **master_products** = Product reference (canonical product specifications)

#### Invoice Processing Workflow (Multi-Step Wizard)

**Step 1: Upload & Parse PDF**
1. User uploads supplier invoice PDF
2. System parses PDF locally (using pdf-parse):
   - Extract supplier name
   - Extract line items (SKU, product name, pack size, unit size, quantity, price)
3. Display review table with:
   - ☑ Checkbox for each line (include/exclude)
   - 📝 Editable pack_size field
   - 📝 Editable unit_size field
   - Product name, SKU, unit cost, case size (from PDF)
4. User reviews/edits/selects items
5. User clicks "Continue to Invoice Entry" →

**Step 2: Create Invoice & Line Items**
1. System creates record in `invoices` table:
   ```sql
   INSERT INTO invoices (
     invoice_number, supplier_id, venue_id, invoice_date,
     total_amount, import_method
   ) VALUES (...)
   ```
2. For each selected line item from Step 1:
   ```sql
   INSERT INTO invoice_line_items (
     invoice_id,
     product_code,      -- Raw SKU from PDF
     product_name,      -- Raw name from PDF
     quantity,
     unit_price,
     line_total,
     supplier_item_list_id,  -- NULL initially
     master_product_id       -- NULL initially
   ) VALUES (...)
   ```
3. Invoice and line items saved (transaction complete) →

**Step 3: Match to Supplier Items**
For each `invoice_line_items` record:

1. **Search supplier_item_list**:
   ```sql
   SELECT id, master_product_id
   FROM supplier_item_list
   WHERE supplier_id = ? AND supplier_sku = ?
   ```

2. **If Match Found**:
   ```sql
   UPDATE invoice_line_items
   SET supplier_item_list_id = ?
   WHERE id = ?
   ```
   - Display: ✓ "Matched to existing supplier item"
   - Status: 🟢 Ready for master product matching

3. **If No Match**:
   - Auto-create new supplier_item_list entry:
   ```sql
   INSERT INTO supplier_item_list (
     supplier_id,
     supplier_sku,
     supplier_name,
     master_product_id  -- NULL (to be matched in Step 4)
   ) VALUES (?, ?, ?, NULL)
   RETURNING id
   ```
   - Update invoice line item with new supplier_item_list_id
   - Display: ⚠️ "New supplier item created"
   - Status: 🟡 Needs master product matching →

**Step 4: Match to Master Products (Manual Review)**
For each line item that needs master product linking:

1. **Fuzzy Search master_products**:
   ```sql
   SELECT id, name, brand, unit_size, case_size, category,
          similarity(name, ?) as score
   FROM master_products
   WHERE similarity(name, ?) > 0.3
   ORDER BY score DESC
   LIMIT 5
   ```

2. **Display Suggestions**:
   ```
   Product from Invoice: "Heineken Lager 24x500ml"

   Suggested Matches:
   ○ Heineken Lager • Bottle • 500ml • Case of 24    [85% match]
   ○ Heineken Premium • Bottle • 500ml • Case of 12   [72% match]
   ○ [Create New Master Product]
   ```

3. **User Selects Match**:
   - **Option A**: Select existing master product →
     ```sql
     UPDATE supplier_item_list
     SET master_product_id = ?,
         auto_matched = false,
         verified = true,
         confidence_score = ?
     WHERE id = ?

     UPDATE invoice_line_items
     SET master_product_id = ?
     WHERE id = ?
     ```

   - **Option B**: Create new master product →
     - User provides: name, brand, category, unit_size, unit_type, case_size
     - System validates no duplicates exist
     - Creates new `master_products` entry
     - Links supplier_item_list and invoice_line_items to new master product

4. **Result**:
   - `invoice_line_items.supplier_item_list_id` → linked
   - `invoice_line_items.master_product_id` → linked
   - `supplier_item_list.master_product_id` → linked
   - Status: 🟢 Fully linked

**Step 5: Complete Import**
1. Show summary:
   - Invoice total
   - X line items processed
   - Y matched automatically
   - Z created as new products
2. User confirms
3. Invoice processing complete! →

---

### Future Invoice Learning

**Next invoice from same supplier:**
1. Upload PDF (Step 1)
2. Create invoice & line items (Step 2)
3. **Auto-match via supplier_item_list** (Step 3):
   - System finds existing supplier_item_list entries by SKU
   - Auto-populates `supplier_item_list_id` AND `master_product_id`
   - Status: 🟢 Automatically matched
4. Only show manual review (Step 4) for **new products**
5. Faster processing each time!

---

### 6. Conduct New Stocktake

**Count Products in Each Area**:

**For each product in the selected area:**

1. **Find Product**:
   - Type product name in search box
   - Fuzzy search shows suggestions from master_products
   - Shows: brand, unit_size, case_size in dropdown

2. **Add to Count**:
   - Select from suggestions (auto-fills all fields)
   - OR manually enter brand, unit_size, case_size if new
   - System checks master_products for duplicates
   - Creates new master product if confirmed by user

3. **Enter Quantity**:
   - **Cases**: Number of full cases
   - **Units**: Individual bottles/cans
   - **Total**: Auto-calculated (cases × case_size + units)

4. **Product Display**:
   ```
   Product Name                                              ✕
   Bottle • 75cl • Case of 12
   [Cases: __] [Units: __] Total: 0
   ```

5. **Remove Product** (if added by mistake):
   - Click ✕ button next to product name
   - Deletes from current session only
   - Product stays in venue_products for future sessions

**Switch Between Areas**:
1. Click "Edit Products" to enable drag-and-drop reordering
2. Click "Select Area" dropdown
3. Choose next area
4. Repeat counting process for each area

**Complete Stocktake**:
1. Review all counts across all areas
2. Click "Complete Session"
3. Session saved with status = 'completed' and timestamp
4. Appears in session history

---

### 7. Import EPOS Sales Data
**Purpose**: Track sales for variance calculation

**Process**:
1. Export sales data from EPOS system (CSV format)
2. Import to `epos_sales_records` table
3. System matches products by name to venue_products
4. Links to master_products via venue_products.master_product_id

**Data Stored**: product_id, quantity_sold, revenue, sale_date, transaction details

---

### 8. Record Wastage & Breakages
**Purpose**: Track losses separately from counted stock

**Process**:
1. During or after stocktake, user records wastage
2. For each wastage event:
   - Select product (links to venue_products → master_products)
   - Select area where wastage occurred
   - Enter quantity
   - Select wastage_type: 'breakage', 'spillage', 'expired', 'other'
   - Enter reason and notes
   - Enter recorded_by name
3. Saved to `wastage_records` table linked to current session

**Note**: Wastage tracked separately, not included in stock_entries

---

### 9. Generate Variance Report
**Purpose**: Calculate expected vs actual stock and identify discrepancies

**Calculation Process**:
1. **Opening Stock**: Query previous session's stock_entries (grouped by master_product_id)
2. **Purchases**: Query invoice_line_items for period (grouped by master_product_id)
3. **Wastage**: Query wastage_records for period (grouped by master_product_id via venue_products)
4. **Sales**: Query epos_sales_records for period (grouped by master_product_id via venue_products)
5. **Expected Stock** = Opening + Purchases - Wastage - Sales
6. **Actual Stock**: Current session's stock_entries (grouped by master_product_id)
7. **Variance** = Expected - Actual

**Report Output**:
- Per-product variance (quantity and value)
- Total variance for venue
- Variance by category
- Variance by area
- Products with significant discrepancies flagged
- **Days Stock**: How long current stock will last at current usage rate

**Days Stock Calculation**:
```
Days Stock = (Closing Stock × Period Days) ÷ Usage
```

**Example**: If you have 8.6 litres of Smirnoff and used 13.4 litres over 35 days:
```
Days Stock = (8.6 × 35) ÷ 13.4 = 22 days until reorder needed
```

**Usage Insights**:
- **0-30 days**: Fast-moving - reorder soon
- **30-90 days**: Normal stock levels
- **90+ days**: Slow-moving or overstocked
- **High values (500+ days)**: Dead stock - consider discontinuing

**Data Storage**: Generated on-demand from live data (no separate variance table yet)

---

## Subsequent Stock Periods

For returning stocktakes, steps 1-4 are skipped (already in system):
- Step 3/4 data already exists (previous closing stock becomes opening stock)
- Steps 5-9 are repeated for each new stock period

---

## Session Management

### Reopen Session (if needed)
1. Dashboard → Session History
2. Find session → Click "Reopen"
3. All products and areas load with previous counts
4. Can modify counts and save again
5. Click "Complete Session" again to update

### Key Behaviors
- **Product Removal**: Only removes from current session's stock_entries, not from venue_products
- **Product Re-addition**: Removed products won't reappear unless manually added again
- **Session Reopen**: Shows all products that were in stock_entries when completed
- **Area Assignment**: Products remember which area they were counted in
- **Master Product Link**: All product details come from master_products (brand, size, category)

---

## EPOS CSV Import

### New Tables
- **`epos_imports`** - Tracks each CSV upload with metadata
- **`epos_sales_records`** - Individual sales line items from EPOS
- **`venue_csv_preferences`** - Stores column mapping preferences per venue

### How It Works
1. **First Import**: User manually maps CSV columns to fields
2. **Auto-Save**: Column mappings saved after successful upload
3. **Next Import**: Mappings pre-filled, dates auto-populated (last stocktake → today)
4. **Auto-Match**: Products matched by name; unmatched items auto-created as venue_products
5. **Flexible**: Supports different EPOS systems (Lightspeed, Square, Bookers, etc.)

### Features
- Flexible column mapping for different EPOS formats
- Auto-saves column preferences per venue
- Auto-populates dates (last stocktake → today)
- Automatically filters empty CSV columns
- Auto-creates venue_products for unmatched items
- Supports N/A for optional fields (unit price, quantity, etc.)
