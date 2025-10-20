# Stock Taking System v2.0.1

**Modern tablet-optimized stock-taking system for pubs and restaurants**

---

# ⚠️ CRITICAL: HYBRID ARCHITECTURE ⚠️

**System Architecture:**
- **Railway Backend**: Database operations (invoices, venues, sessions, etc.)
- **Localhost Backend**: PDF parsing ONLY (has pdf-parse library installed)

**API Configuration:**

```javascript
// frontend/src/config/api.js - Database operations
const API_BASE_URL = 'https://stocktaking-api-production.up.railway.app';

// frontend/src/components/SupplierInvoiceReview.js - PDF parsing only
const PDF_PARSE_URL = 'http://localhost:3005/api/invoices/parse-supplier-pdf';
```

**Why This Architecture:**
- Railway has the PostgreSQL database with live data
- Localhost has pdf-parse library for invoice PDF processing
- Frontend sends PDF parsing to localhost, everything else to Railway

**Required for Invoice Imports:**
1. **Start local backend**: `cd backend && npm start` (runs on port 3005)
2. **Frontend auto-connects**: PDF parsing → localhost, database → Railway

**When Deploying Backend Changes:**
1. Edit backend code locally
2. Test PDF parsing locally (localhost:3005)
3. Commit to GitHub
4. Deploy to Railway: `railway up --service stocktaking-api --detach`
5. Railway deployment handles database operations only

**DO NOT change API_BASE_URL to localhost - it will break database access!**

---

## System Architecture & Design Principles

### Master Products - Single Source of Truth

**Critical Design Principle:** All product information comes from `master_products` ONLY.

- `master_products` = Single source of truth for ALL product specifications
  - name, brand, category, subcategory, unit_type, unit_size, case_size, barcode

- `venue_products` = Linkage table ONLY
  - Stores: `master_product_id`, `area_id`, `venue_id`
  - Purpose: Maps master products to specific venues
  - Does NOT store product specifications

- `supplier_item_list` = Supplier-specific naming
  - Maps supplier SKUs and names to `master_product_id`
  - Used for invoice OCR matching only

**Why This Matters:**
- Ensures consistency across all venues
- Eliminates duplicate/conflicting product data
- Simplifies updates (change once in master, applies everywhere)
- Enables accurate cross-venue reporting

### Data Flow

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

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL (Railway-hosted)

### Local Development

```bash
# Frontend (port 3000)
cd frontend && npm install && npm start

# Backend (port 3005)
cd backend && npm install && npm start
```

---

## Railway Deployment

### Deployment Process

After committing changes to git:

```bash
# 1. Commit and push to GitHub
git add .
git commit -m "your message"
git push

# 2. Force Railway deployment
railway up --service stocktaking-api --detach

# 3. Wait for deployment (approx 60 seconds)
sleep 60

# 4. Verify deployment
curl -s "https://stocktaking-api-production.up.railway.app/api/health"
```

**Important Notes:**
- Railway deployments **must be forced manually** using `railway up --service stocktaking-api --detach`
- Deployment takes approximately 60 seconds
- Always verify the health endpoint shows the correct version after deployment

### Environment Variables (Railway)
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `PORT` - Application port (auto-configured)

---

## API Endpoints

**Base URLs:**
- Production: `https://stocktaking-api-production.up.railway.app`
- Local: `http://localhost:3005`

### Health Check
- `GET /api/health` - Check API health and version

### Venues
- `GET /api/venues` - List all venues
- `POST /api/venues` - Create venue
- `PUT /api/venues/:id` - Update venue
- `DELETE /api/venues/:id` - Delete venue
- `GET /api/venues/:id/products` - List venue products
- `GET /api/venues/:id/areas` - List venue areas

### Venue Areas
- `POST /api/venues/:id/areas` - Create area
- `PUT /api/areas/:id` - Update area
- `DELETE /api/areas/:id` - Delete area

### Stock Sessions
- `GET /api/sessions` - List sessions (query: `status=in_progress|completed`)
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session (e.g., mark completed)

### Stock Entries
- `GET /api/sessions/:id/entries` - Get entries (query: `completed_only=true|false`)
- `POST /api/sessions/:id/entries` - Create entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/sessions/:sessionId/entries/product/:productId` - Remove product from session

### Example Requests

**Create Venue:**
```json
POST /api/venues
{
  "name": "The Red Lion",
  "address_line_1": "123 High Street",
  "city": "London",
  "postcode": "SW1A 1AA",
  "country": "United Kingdom",
  "phone": "+44 20 1234 5678",
  "contact_person": "John Doe",
  "billing_rate": 50.00
}
```

**Create Stock Entry:**
```json
POST /api/sessions/:id/entries
{
  "product_id": "uuid",
  "venue_area_id": 1,
  "quantity_units": 5.50
}
```

---

## Database Schema

**Database**: PostgreSQL on Railway
**Version**: 2.0.1

### Core Tables

#### VENUES
```sql
id                 uuid           PRIMARY KEY
name               varchar(255)   NOT NULL
address_line_1     varchar(255)
address_line_2     varchar(255)
city               varchar(100)
county             varchar(100)
postcode           varchar(20)
country            varchar(100)   DEFAULT 'United Kingdom'
phone              varchar(50)
contact_person     varchar(255)
contact_email      varchar(255)
billing_rate       numeric        DEFAULT 0.00
billing_currency   varchar(10)    DEFAULT 'GBP'
billing_notes      text
created_at         timestamp      DEFAULT CURRENT_TIMESTAMP
updated_at         timestamp      DEFAULT CURRENT_TIMESTAMP
```

#### VENUE_AREAS
```sql
id             integer        PRIMARY KEY AUTO_INCREMENT
venue_id       uuid          NOT NULL REFERENCES venues(id)
name           varchar(255)  NOT NULL
display_order  integer       DEFAULT 1
description    text
photo          text
created_at     timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at     timestamp     DEFAULT CURRENT_TIMESTAMP
```

#### VENUE_PRODUCTS
**Linkage table only** - connects venues to master products.

```sql
id                 uuid           PRIMARY KEY
venue_id           uuid          NOT NULL REFERENCES venues(id)
master_product_id  uuid          NOT NULL REFERENCES master_products(id)
area_id            integer       REFERENCES venue_areas(id)
name               varchar(255)  NOT NULL
created_at         timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at         timestamp     DEFAULT CURRENT_TIMESTAMP

UNIQUE(venue_id, master_product_id)
```

**Purpose**:
- Links master products to specific venues
- Stores venue-specific product names (e.g., EPOS system naming)
- **DOES NOT** store product specifications (brand, size, category, barcode)
- All specifications come from `master_products` via JOIN

**Critical**: When querying venue products, ALWAYS join to master_products:
```sql
SELECT vp.id, vp.venue_id, vp.area_id,
       mp.name, mp.brand, mp.unit_size, mp.unit_type, mp.case_size, mp.category
FROM venue_products vp
LEFT JOIN master_products mp ON vp.master_product_id = mp.id
WHERE vp.venue_id = $1
```

#### STOCK_SESSIONS
```sql
id               uuid           PRIMARY KEY
venue_id         uuid          NOT NULL REFERENCES venues(id)
session_date     date          NOT NULL DEFAULT CURRENT_DATE
stocktaker_name  varchar(255)  NOT NULL
status           varchar(50)   DEFAULT 'in_progress'
notes            text
created_at       timestamp     DEFAULT CURRENT_TIMESTAMP
completed_at     timestamp
updated_at       timestamp     DEFAULT CURRENT_TIMESTAMP
```

**Status values:** `in_progress`, `completed`

#### STOCK_ENTRIES
```sql
id              uuid           PRIMARY KEY
session_id      uuid          NOT NULL REFERENCES stock_sessions(id)
product_id      uuid          NOT NULL REFERENCES venue_products(id)
venue_area_id   integer       REFERENCES venue_areas(id)
quantity_units  decimal(10,2) DEFAULT 0.00 CHECK (quantity_units >= 0)
created_at      timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at      timestamp     DEFAULT CURRENT_TIMESTAMP
```

#### MASTER_PRODUCTS
**Single source of truth** for all product specifications across the system.

```sql
id               uuid           PRIMARY KEY
name             varchar(255)  NOT NULL
brand            varchar(100)
category         varchar(100)
subcategory      varchar(100)
unit_type        varchar(50)   CHECK (unit_type IN ('bottle', 'can', 'keg', 'case', 'pack'))
unit_size        integer                       -- Size in ml (e.g., 750 for 750ml bottle)
case_size        integer                       -- Number of units per case
barcode          varchar(100)
ean_code         varchar(20)
upc_code         varchar(20)
active           boolean       DEFAULT true
created_at       timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at       timestamp     DEFAULT CURRENT_TIMESTAMP
created_by_id    uuid
```

**Key Points:**
- `unit_size` is stored as INTEGER in milliliters (ml)
- Display automatically converts: ≤1000ml → "ml", 1001-9999ml → "cl", ≥10000ml → "L"
- Contains 570+ pre-populated products from comprehensive UK drinks catalog
- All venue products MUST link to a master product via `master_product_id`


#### SUPPLIERS
```sql
sup_id                uuid           PRIMARY KEY
sup_name              varchar(255)  NOT NULL
sup_contact_person    varchar(255)
sup_email             varchar(255)
sup_phone             varchar(50)
sup_address           text
sup_website           varchar(255)
sup_account_number    varchar(100)
sup_payment_terms     varchar(100)
sup_delivery_days     varchar(100)
sup_minimum_order     numeric
sup_active            boolean       DEFAULT true
sup_created_at        timestamp     DEFAULT CURRENT_TIMESTAMP
sup_updated_at        timestamp     DEFAULT CURRENT_TIMESTAMP
```

#### SUPPLIER_ITEM_LIST
**Lean mapping table** - maps supplier SKUs to master products for invoice matching.

**Purpose**: This is a bridging/lookup table that helps match supplier invoice items to master products.

```sql
id                     serial         PRIMARY KEY
supplier_id            uuid          NOT NULL REFERENCES suppliers(sup_id)
master_product_id      uuid          REFERENCES master_products(id)
supplier_sku           varchar(100)  NOT NULL
supplier_name          varchar(255)  NOT NULL
supplier_description   text          -- Optional, helps with fuzzy matching
auto_matched           boolean       DEFAULT false
verified               boolean       DEFAULT false
confidence_score       numeric(5,2)  DEFAULT 0
match_notes            text
active                 boolean       DEFAULT true
created_at             timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at             timestamp     DEFAULT CURRENT_TIMESTAMP
created_by             varchar(100)

CONSTRAINT unique_supplier_sku UNIQUE(supplier_id, supplier_sku)
```

**Key Points:**
- **Minimal data** - only stores SKU and name mapping
- **NO pricing** - stored in `invoice_line_items`
- **NO product specs** - stored in `master_products` (case_size, unit_size, brand, etc.)
- **Purpose**: Fast lookup from "supplier SKU + name" → master_product_id
- Matching metadata (`auto_matched`, `confidence_score`) for quality tracking

#### INVOICES
Tracks supplier invoices with import method (OCR/CSV/Manual).

```sql
id                uuid           PRIMARY KEY DEFAULT uuid_generate_v4()
invoice_number    varchar(100)   NOT NULL
venue_id          uuid           NOT NULL REFERENCES venues(id) ON DELETE CASCADE
supplier_id       uuid           NOT NULL REFERENCES suppliers(sup_id) ON DELETE RESTRICT
invoice_date      date           NOT NULL
date_ordered      date
date_delivered    date
delivery_number   varchar(100)
customer_ref      varchar(100)
subtotal          numeric(10,2)
vat_total         numeric(10,2)
total_amount      numeric(10,2)
currency          varchar(3)     DEFAULT 'GBP'
payment_status    varchar(50)    DEFAULT 'unpaid'
import_method     varchar(50)                      -- 'ocr', 'csv', 'manual'
import_metadata   jsonb                            -- OCR confidence, CSV mappings, etc.
notes             text
created_at        timestamp      DEFAULT CURRENT_TIMESTAMP
updated_at        timestamp      DEFAULT CURRENT_TIMESTAMP

CONSTRAINT unique_invoice_number_supplier UNIQUE(supplier_id, invoice_number)
```

**Purpose**: Track all supplier invoices for purchase data and variance reporting.

#### INVOICE_LINE_ITEMS
Individual line items from supplier invoices, linked to master products.

```sql
id                      serial         PRIMARY KEY
invoice_id              uuid           NOT NULL REFERENCES invoices(id) ON DELETE CASCADE
master_product_id       uuid           REFERENCES master_products(id)
supplier_item_list_id   integer        REFERENCES supplier_item_list(id)
line_number             integer
product_code            varchar(100)                                      -- Raw supplier code
product_name            varchar(255)   NOT NULL                           -- Raw supplier name
product_description     text
quantity                numeric(10,2)  NOT NULL
unit_price              numeric(10,2)
nett_price              numeric(10,2)
vat_code                varchar(10)
vat_rate                numeric(5,2)
vat_amount              numeric(10,2)
line_total              numeric(10,2)
created_at              timestamp      DEFAULT CURRENT_TIMESTAMP
updated_at              timestamp      DEFAULT CURRENT_TIMESTAMP
```

**Purpose**:
- Stores raw supplier product data (product_code, product_name) for reference
- Links to master_products via master_product_id for normalized reporting
- Links to supplier_item_list for auto-matching on future imports
- All variance calculations use master_product_id for consistency

#### WASTAGE_RECORDS
Tracks product wastage, breakages, and losses during stock periods.

```sql
id              uuid           PRIMARY KEY DEFAULT uuid_generate_v4()
session_id      uuid           NOT NULL REFERENCES stock_sessions(id) ON DELETE CASCADE
product_id      uuid           NOT NULL REFERENCES venue_products(id) ON DELETE RESTRICT
venue_area_id   integer        REFERENCES venue_areas(id)
quantity        numeric(10,2)  NOT NULL CHECK (quantity > 0)
wastage_type    varchar(50)    NOT NULL  -- 'breakage', 'spillage', 'expired', 'other'
reason          varchar(255)
notes           text
recorded_by     varchar(255)
recorded_at     timestamp      DEFAULT CURRENT_TIMESTAMP
created_at      timestamp      DEFAULT CURRENT_TIMESTAMP
updated_at      timestamp      DEFAULT CURRENT_TIMESTAMP
```

**Purpose**:
- Tracked separately from stock counts
- Used in variance calculation: Opening + Purchases - Wastage - Sales = Expected Stock
- Links to master_products via venue_products for reporting

#### USER_PROFILES
```sql
id                  uuid           PRIMARY KEY
first_name          varchar(100)  NOT NULL
last_name           varchar(100)  NOT NULL
address_line_1      varchar(255)
address_line_2      varchar(255)
city                varchar(100)
county              varchar(100)
postcode            varchar(20)
country             varchar(100)  DEFAULT 'United Kingdom'
mobile_phone        varchar(20)
home_phone          varchar(20)
work_phone          varchar(20)
whatsapp_number     varchar(20)
primary_email       varchar(255)
work_email          varchar(255)
personal_email      varchar(255)
facebook_handle     varchar(100)
instagram_handle    varchar(100)
twitter_handle      varchar(100)
linkedin_handle     varchar(100)
company_name        varchar(255)
job_title           varchar(255)
preferred_language  varchar(10)   DEFAULT 'en'
timezone            varchar(50)   DEFAULT 'Europe/London'
date_format         varchar(20)   DEFAULT 'DD/MM/YYYY'
currency            varchar(3)    DEFAULT 'GBP'
active              boolean       DEFAULT true
profile_complete    boolean       DEFAULT false
share_phone         boolean       DEFAULT false
share_email         boolean       DEFAULT false
share_social_media  boolean       DEFAULT false
created_at          timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at          timestamp     DEFAULT CURRENT_TIMESTAMP
last_login          timestamp
notes               text
```


### Table Relationships
```
venues (1) --> (many) venue_areas
venues (1) --> (many) venue_products
venues (1) --> (many) stock_sessions
venues (1) --> (many) invoices

venue_areas (1) --> (many) stock_entries
venue_areas (1) --> (many) wastage_records

stock_sessions (1) --> (many) stock_entries
stock_sessions (1) --> (many) wastage_records

venue_products (1) --> (many) stock_entries
venue_products (1) --> (many) wastage_records

master_products (1) --> (many) venue_products
master_products (1) --> (many) supplier_item_list
master_products (1) --> (many) invoice_line_items

suppliers (1) --> (many) supplier_item_list
suppliers (1) --> (many) invoices

invoices (1) --> (many) invoice_line_items

supplier_item_list (1) --> (many) invoice_line_items
```

### Key Constraints
- Foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate
- UUIDs generated using `uuid_generate_v4()` extension
- Decimal quantities rounded to 2 decimal places
- Non-negative quantity constraint on stock_entries

---

## Features

### ✅ Implemented (v2.0.1)
- **Venue Management** with structured addresses (multi-line, city, postcode, country)
- **Venue Areas** (Bar, Kitchen, Storage, etc.) with drag-and-drop ordering
- **Master Products Database** (570+ UK drinks products) with fuzzy search
- **Product Catalog** with automatic master product linking
- **Stock-taking Sessions** with status tracking (in_progress, completed)
- **Stock Entries** with decimal quantity support and area assignment
- **Smart Product Display**:
  - Auto-converts units: ml → cl → L based on size
  - Shows: unit_type • unit_size • case_size
  - All data sourced from master_products only
- **Product Management During Stocktake**:
  - Add new products with fuzzy search autocomplete
  - Remove products from current session (✕ button)
  - Drag-and-drop product reordering
  - Auto-populate all fields from master products
- **EPOS CSV Import System**:
  - Flexible column mapping for different EPOS formats
  - Auto-saves column preferences per venue
  - Auto-populates dates (last stocktake → today)
  - Automatically filters empty CSV columns
  - Auto-creates venue_products for unmatched items
  - Supports N/A for optional fields (unit price, quantity, etc.)
- **Session History** with filtering and reopening capability
- **Cases & Units** input with automatic total calculation
- **Responsive Tablet-Optimized UI** with professional design

### 🚧 In Development
- Photo upload for products
- Advanced reporting and analytics
- Invoice processing (OCR)
- EPOS sales analysis and variance reporting

---

## Complete Stocktaking & Variance Workflow

### Overview
The system tracks opening stock, purchases, sales, wastage, and closing stock to calculate variance and generate financial reports.

**Variance Formula**: Opening Stock + Purchases - Wastage - Sales = Expected Stock
**Actual Variance**: Expected Stock - Actual Counted Stock

### First-Time Venue Setup

#### 1. User Profile Setup (One-Time)
1. Open program
2. Navigate to User Profile Settings
3. Enter personal details (name, contact info, etc.)
4. Save profile

#### 2. Create Venue (One-Time)
1. Dashboard → "Add New Venue"
2. Enter venue details (name, address, contact, billing rate)
3. Add venue areas (Bar, Kitchen, Cellar, Storage, etc.)
4. Use drag-and-drop to set area display order

#### 3. Import Opening Stock (First Stocktake Only)
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

#### 4. Match Products to Master Database
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

### Recurring Workflow (Every Stock Period)

#### 5. Import Supplier Invoices
**Purpose**: Track purchases for variance calculation

**Import Methods**: PDF OCR, CSV, or Manual input

---

### Invoice Processing Architecture

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

---

### Invoice Processing Workflow (Multi-Step Wizard)

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

### Key Benefits

**Separation of Concerns:**
- `invoice_line_items` = What was purchased (never changes)
- `supplier_item_list` = How to find it (improves over time)
- `master_products` = What it is (single source of truth)

**Historical Accuracy:**
- Invoices preserve raw supplier data
- Can re-match later if needed
- Pricing history maintained

**Matching Quality:**
- Manual review ensures accuracy
- System learns from user decisions
- Confidence scores track match quality

**Database Efficiency:**
- No redundant product specs in supplier_item_list
- Pricing only in invoice_line_items (changes with each invoice)
- Product specs only in master_products (change rarely)

#### 6. Conduct New Stocktake

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

#### 7. Import EPOS Sales Data
**Purpose**: Track sales for variance calculation

**Process**:
1. Export sales data from EPOS system (CSV format)
2. Import to `epos_sales_records` table
3. System matches products by name to venue_products
4. Links to master_products via venue_products.master_product_id

**Data Stored**: product_id, quantity_sold, revenue, sale_date, transaction details

#### 8. Record Wastage & Breakages
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

#### 9. Generate Variance Report
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

### Subsequent Stock Periods

For returning stocktakes, steps 1-4 are skipped (already in system):
- Step 3/4 data already exists (previous closing stock becomes opening stock)
- Steps 5-9 are repeated for each new stock period

### Session Management

**Reopen Session** (if needed):
1. Dashboard → Session History
2. Find session → Click "Reopen"
3. All products and areas load with previous counts
4. Can modify counts and save again
5. Click "Complete Session" again to update

**Key Behaviors**:
- **Product Removal**: Only removes from current session's stock_entries, not from venue_products
- **Product Re-addition**: Removed products won't reappear unless manually added again
- **Session Reopen**: Shows all products that were in stock_entries when completed
- **Area Assignment**: Products remember which area they were counted in
- **Master Product Link**: All product details come from master_products (brand, size, category)

---

## Common Pitfalls & Anti-Patterns

### ❌ DON'T: Pull product data from venue_products
```javascript
// WRONG - venue_products doesn't have brand, unit_size, etc.
SELECT vp.name, vp.brand, vp.unit_size  -- ❌ brand/unit_size don't exist here
FROM venue_products vp
```

### ✅ DO: Always JOIN to master_products
```javascript
// CORRECT - all product data from master_products
SELECT vp.id, mp.name, mp.brand, mp.unit_size, mp.unit_type, mp.case_size
FROM venue_products vp
LEFT JOIN master_products mp ON vp.master_product_id = mp.id
```

### ❌ DON'T: Create complex tracking systems for simple operations
Example: User wants to remove a product from a session.
- **Wrong approach**: Create session_excluded_products table, track exclusions, filter on load
- **Right approach**: Just `DELETE FROM stock_entries WHERE session_id = X AND product_id = Y`

### ✅ DO: Keep solutions simple and direct
- If something can be accomplished with a single DELETE/UPDATE/INSERT, do that
- Avoid creating new tables unless absolutely necessary for data persistence
- Session-specific operations should modify session-specific data (stock_entries), not create parallel tracking systems

### ❌ DON'T: Store duplicate product information
```javascript
// WRONG - duplicating master product data in venue_products
await pool.query(
  'INSERT INTO venue_products (name, brand, unit_size, category) VALUES ($1, $2, $3, $4)',
  [name, brand, unitSize, category]  // ❌ These belong in master_products only
);
```

### ✅ DO: Link to master products, never duplicate
```javascript
// CORRECT - just link to master product
await pool.query(
  'INSERT INTO venue_products (venue_id, master_product_id, name) VALUES ($1, $2, $3)',
  [venueId, masterProductId, venueName]  // ✅ venueName is venue-specific, rest comes from master
);
```

### ❌ DON'T: Assume persistence requirements without asking
- User says "remove product from counting" → Ask: "Should this persist across sessions?"
- Don't automatically build complex solutions for implied requirements

### ✅ DO: Implement exactly what was requested
- "Remove from counting" → Delete from stock_entries (simple, direct)
- If persistence is needed later, user will specify it explicitly

---

## EPOS CSV Import

### New Tables
- **`epos_imports`** - Tracks each CSV upload with metadata
- **`epos_sales_records`** - Individual sales line items from EPOS
- **`venue_csv_preferences`** - Stores column mapping preferences per venue

### API Endpoints
- `POST /api/epos-imports` - Upload EPOS CSV data
- `GET /api/epos-imports?venue_id=X` - List imports for venue
- `GET /api/epos-imports/:id/records` - View sales records
- `GET /api/venues/:venueId/csv-preferences` - Get saved column mappings
- `PUT /api/venues/:venueId/csv-preferences` - Save column mappings
- `GET /api/venues/:venueId/last-session-date` - Get last stocktake date

### How It Works
1. **First Import**: User manually maps CSV columns to fields
2. **Auto-Save**: Column mappings saved after successful upload
3. **Next Import**: Mappings pre-filled, dates auto-populated (last stocktake → today)
4. **Auto-Match**: Products matched by name; unmatched items auto-created as venue_products
5. **Flexible**: Supports different EPOS systems (Lightspeed, Square, Bookers, etc.)

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

Example: "5 bottles of Beck's in the Main Bar" creates a stock_entry with:
- `product_id` = Beck's
- `venue_area_id` = Main Bar
- `quantity_units` = 5

---

## Recent Updates

### October 19, 2025 - Invoice Processing Architecture Documentation
- ✅ Documented complete 3-table invoice architecture (invoice_line_items → supplier_item_list → master_products)
- ✅ Cleaned up supplier_item_list schema (removed redundant fields)
- ✅ Documented 5-step invoice processing workflow (multi-step wizard approach)
- ✅ Clarified data separation: pricing in invoice_line_items, specs in master_products, mapping in supplier_item_list
- ✅ Added invoice learning system documentation (auto-matching via supplier_item_list)
- ✅ Created migration script to cleanup supplier_item_list table
- ✅ Implemented Step 1: PDF parsing UI with editable fields and checkboxes
- ✅ Updated README with architectural diagrams and detailed workflow

### October 10, 2025 - Invoice & Wastage Tracking + Workflow Documentation
- ✅ Created `invoices` table for supplier invoice tracking
- ✅ Created `invoice_line_items` table with master_product_id linking
- ✅ Created `wastage_records` table for breakage/spillage tracking
- ✅ Added import_method and import_metadata to invoices (OCR/CSV/Manual)
- ✅ Documented complete variance calculation workflow (9 steps)
- ✅ Updated table relationships with new tables
- ✅ Expanded README with detailed first-time setup and recurring workflow

### October 10, 2025 (Earlier) - Product Management Enhancements
- ✅ Fixed product details display (unit_size, unit_type, case_size)
- ✅ Added smart unit conversion (ml → cl → L)
- ✅ Implemented product removal from sessions (✕ button)
- ✅ Simplified delete functionality (direct stock_entries deletion)
- ✅ Enforced master_products as single source of truth
- ✅ Updated all queries to JOIN master_products correctly
- ✅ Dropped session_excluded_products table (overcomplicated solution)
- ✅ Enhanced README with architecture principles and workflow

### Known Issues
- None currently reported

## TODO: Next Session

### 🧪 Beta Testing Required
- [ ] Test product removal and re-addition workflow
- [ ] Verify smart unit display (ml/cl/L) for all product types
- [ ] Test EPOS CSV import with real CSV files from different systems
- [ ] Verify column mapping saves and loads correctly
- [ ] Test auto-date population from last stocktake
- [ ] Verify empty column filtering works
- [ ] Test auto-creation of venue_products for unmatched items
- [ ] Check Cases + Units input functionality
- [ ] Test reopening completed stocktakes

### 🎯 Next Development Phase - Invoice & Variance System

#### Opening Stock Import (Steps 3-4)
- [ ] Opening stock import UI with CSV/Manual/PDF input
- [ ] Handle Stockcheck report format (DZ decimal notation: 2.05 = 2 dozen + 5 units)
- [ ] Dozen decimal converter: (dozens × 12) + units
- [ ] Product matching UI for opening stock
- [ ] Fuzzy match to master_products
- [ ] Create opening stock session (status=completed, historical date)

#### Invoice Processing (Step 5) - Multi-Step Wizard
**Step 1: PDF Upload & Review**
- [x] PDF parsing endpoint (no timeout issues!)
- [x] Extract supplier name and product details
- [x] React UI with editable table (checkboxes, pack_size, unit_size)
- [x] Drag & drop file upload
- [ ] Add invoice metadata fields (invoice_number, invoice_date, venue selection)

**Step 2: Create Invoice & Line Items**
- [ ] API: POST /api/invoices - create invoice header
- [ ] API: POST /api/invoices/:id/line-items - create line items from reviewed data
- [ ] Store raw supplier data (product_code, product_name, pricing)
- [ ] Set supplier_item_list_id and master_product_id to NULL initially

**Step 3: Match to Supplier Items**
- [ ] API: GET /api/supplier-items/match - find existing supplier items by SKU
- [ ] Auto-create new supplier_item_list entries for unmatched items
- [ ] Update invoice_line_items with supplier_item_list_id
- [ ] UI: Show matched vs new supplier items

**Step 4: Match to Master Products (Manual Review)**
- [ ] API: POST /api/master-products/fuzzy-search - find similar master products
- [ ] UI: Show suggested matches with confidence scores
- [ ] UI: Allow user to select match or create new master product
- [ ] Update supplier_item_list.master_product_id
- [ ] Update invoice_line_items.master_product_id
- [ ] Track matching metadata (auto_matched, verified, confidence_score)

**Step 5: Complete Import**
- [ ] Summary screen showing import results
- [ ] Confirmation and navigation back to dashboard

#### Wastage & Variance (Steps 8-9)
- [ ] Wastage recording UI
- [ ] API endpoints for wastage records
- [ ] Variance report generation engine
- [ ] Variance report UI (per-product, by category, by area)
- [ ] **Days Stock calculation**: (closing × period) ÷ usage
- [ ] Dead stock alerts (>180 days stock)
- [ ] Reorder suggestions (0-30 days stock)

### 🎯 Future Enhancements
- [ ] Photo upload for products
- [ ] Advanced reporting and analytics
- [ ] Invoice OCR training and improvement
- [ ] Product usage tracking and alerts
- [ ] Multi-venue comparison reports
- [ ] Data archiving strategy (after 4 months)

### 🚀 After Beta Testing
- [ ] Update version numbers in all files to v2.1.0
- [ ] Update README.md with beta test results
- [ ] Commit to GitHub as "Working Prototype v2.1.0"
- [ ] Tag release in GitHub

---

## Development Notes

### Working with Claude Code
When providing prompts for new features:
1. **Be specific** about data sources (e.g., "use master_products, not venue_products")
2. **Specify simplicity** when desired (e.g., "just delete from stock_entries")
3. **Clarify persistence** requirements (e.g., "session-only" vs "permanent")
4. **Reference this README** for architectural principles before implementing

### Deployment Checklist
1. Test locally (frontend on :3000, backend on :3005)
2. Commit changes to git with descriptive message
3. Push to GitHub
4. Force Railway deployment: `railway up --service stocktaking-api --detach`
5. Wait 60 seconds for deployment
6. Verify: `curl -s "https://stocktaking-api-production.up.railway.app/api/health"`

---

**Version**: 2.0.1
**Last Updated**: October 19, 2025
