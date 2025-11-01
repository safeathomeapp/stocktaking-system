# Stock Taking System v2.0.1

**Modern tablet-optimized stock-taking system for pubs and restaurants**

---

# 💻 LOCAL DEVELOPMENT ARCHITECTURE

**System Architecture:**
- **Fully self-contained localhost application**
- **PostgreSQL 17** - Local database (no cloud dependencies)
- **Node.js Backend** - REST API on port 3005
- **React Frontend** - Development server on port 3000

**API Configuration:**

```javascript
// frontend/src/config/api.js
const API_BASE_URL = 'http://localhost:3005';

// All operations (database + PDF parsing) run locally
```

**Why This Architecture:**
- ✅ **No internet required** - develop completely offline
- ✅ **Fast performance** - no network latency
- ✅ **Safe testing** - experiment without affecting production data
- ✅ **Full control** - own your data, reset anytime
- ✅ **Simple setup** - just PostgreSQL + Node.js

**Getting Started:**
1. **Install PostgreSQL 17** (one-time setup)
2. **Create database**: `stocktaking_local`
3. **Start backend**: `cd backend && npm start` (runs on port 3005)
4. **Start frontend**: `cd frontend && npm start` (runs on port 3000)
5. **Open browser**: http://localhost:3000

**Database Setup:**
- Database automatically created with schema on first run
- No password required (trust authentication for localhost)
- All 15 tables created from `backend/schema.sql`

---

## ⚡ QUICK STARTUP CHECKLIST (Claude Code - Do This First!)

**Expected State:** Both servers running + PostgreSQL connected

### 30-Second Verification
```bash
# Terminal 1: Start Backend Development Server (if not running)
cd backend && npm run dev
# Expected output: "nodemon restarting due to changes" → "Server running on port 3005"

# Terminal 2: Start Frontend (if not running)
cd frontend && npm start
# Expected output: "You can now view frontend in the browser. Local: http://localhost:3000"
```

### ⚠️ IMPORTANT: Development Server Management
- **DO NOT kill Node processes** - Let nodemon handle restarts
- **File changes auto-reload** - Save files to trigger automatic restart
- If backend server appears stuck, modify a backend file to trigger nodemon restart
- Only stop the server if absolutely necessary by pressing `Ctrl+C` in the terminal

### ✅ System Ready When You See:
- **Backend**: `Server running on port 3005` + `Master Products API ready`
- **Frontend**: `Compiled successfully!` + `Local: http://localhost:3000`
- **Database**: PostgreSQL running (automatic - Windows Service)
- **Browser**: Navigate to `http://localhost:3000`

### 🚀 If Something is Missing:

**PostgreSQL not running?**
- Windows Services → search "postgresql-x64-17" → Restart if stopped

**Backend crashed/missing?**
```bash
cd backend && npm start
```

**Frontend crashed/missing?**
```bash
cd frontend && npm start
```

**Database connection error?**
```bash
# Test database connection
"C:/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -d stocktaking_local -c "SELECT COUNT(*) FROM venues;"
```

**Still broken?**
- Check backend `.env` file has: `DB_HOST=localhost`, `DB_PORT=5432`, `DB_NAME=stocktaking_local`
- Check frontend `src/config/api.js` has: `API_BASE_URL = 'http://localhost:3005'`
- Stop the dev server with `Ctrl+C` in the terminal, then run `npm run dev` again
- ⚠️ Do NOT use `taskkill` or `Stop-Process` - these disrupt nodemon's auto-restart behavior

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

## Project Structure & Cleanup

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
└── archive-unused-files.sh      # Cleanup script
└── restore-archived-files.sh    # Restore script (if needed)
└── CLEANUP_REPORT.md            # Detailed cleanup documentation
```

### Recently Archived Files (October 2025)

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

**Why Archive Instead of Delete?**
- Files safely stored in `_archived/` directory
- Can be restored if needed with `./restore-archived-files.sh`
- Verified 0 imports across codebase before archiving
- See `CLEANUP_REPORT.md` for full analysis and methodology

**Impact:**
- ✅ Reduced code complexity and confusion
- ✅ Clearer project structure
- ✅ No breaking changes (verified compilation success)
- ✅ All routes and features still work

---

## Quick Start

### Prerequisites
- **Node.js 16+** - [Download here](https://nodejs.org/)
- **PostgreSQL 17** - [Download for Windows](https://www.postgresql.org/download/windows/)

### First-Time Setup

**1. Install PostgreSQL 17:**
```bash
# Download and run the PostgreSQL 17 installer
# During installation, remember your postgres password (or use trust auth for localhost)
```

**2. Configure PostgreSQL for Localhost (Optional - Passwordless):**
```bash
# Edit: C:/Program Files/PostgreSQL/17/data/pg_hba.conf
# Change all "scram-sha-256" to "trust" for localhost connections
# Restart PostgreSQL service via Windows Services (services.msc)
```

**3. Create Database:**
```bash
# Using psql (no password needed if trust auth configured)
"C:/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -c "CREATE DATABASE stocktaking_local;"
```

**4. Apply Database Schema:**
```bash
# Run the schema SQL file
"C:/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -d stocktaking_local -f backend/schema.sql
```

**5. Configure Backend:**
```bash
# Edit backend/.env (already configured for localhost)
DATABASE_URL=postgresql://postgres:@localhost:5432/stocktaking_local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stocktaking_local
DB_USER=postgres
DB_PASS=
```

**6. Install Dependencies:**
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Running the Application

**Start Backend (Development):**
```bash
cd backend
npm run dev
# Uses nodemon to auto-restart on file changes
# Server runs on http://localhost:3005
# Watch for: "nodemon restarting due to changes"
```

**Start Frontend (in a new terminal):**
```bash
cd frontend
npm start
# App opens at http://localhost:3000
# Auto-refreshes on file changes
```

**Verify Everything Works:**
```bash
# Test backend health
curl http://localhost:3005/api/health
# Should return: {"status":"healthy","database":"connected",...}

# Test frontend
# Open browser: http://localhost:3000
```

---

## Development Workflow

### Daily Development
```bash
# 1. Start PostgreSQL (if not running)
# Check Windows Services - postgresql-x64-17 should be "Running"

# 2. Start backend with nodemon (auto-restart on changes)
cd backend && npm run dev
# Nodemon monitors backend files and auto-restarts on save

# 3. Start frontend (new terminal)
cd frontend && npm start
# React dev server auto-refreshes on save

# 4. Develop! Changes auto-reload via nodemon and React
# DO NOT kill Node processes - let nodemon handle restarts
# File changes = automatic restart (no manual intervention needed)
```

### Database Management
```bash
# View all databases
psql -U postgres -l

# Connect to stocktaking database
psql -U postgres -d stocktaking_local

# View all tables
\dt

# View venues
SELECT * FROM venues;

# Reset database (careful!)
DROP DATABASE stocktaking_local;
CREATE DATABASE stocktaking_local;
psql -U postgres -d stocktaking_local -f backend/schema.sql
```

---

## API Endpoints

**Base URL:**
- All environments: `http://localhost:3005`

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

## PDF Invoice Parsers

The system can automatically extract invoice data from supplier PDFs. Each supplier has a dedicated parser that understands their specific invoice format.

### Implemented Parsers

| Supplier | Format | Status | Details |
|---|---|---|---|
| **Booker Limited** | Table-based (TAB-separated) | ✅ Production | Handles SUBSTITUTION DETAILS sections |
| **Tolchards Ltd** | Wine & spirits (space-separated) | ✅ Production | Proper quantity format (cases.units), wine/spirit unit sizes |

### Quick Parser Facts

- **Two-Layer Detection**: Fast keyword scanning → Detailed parser validation
- **Automatic**: PDF uploaded → Supplier detected → Data extracted
- **Extensible**: Add new suppliers easily (5 methods to implement)
- **Scalable**: Constant performance with 1 or 100+ suppliers

### For Detailed Parser Information

See **[docs/PARSERS.md](docs/PARSERS.md)** for:
- Complete parser architecture documentation
- Detailed field mappings for each supplier
- Step-by-step guide for adding new suppliers
- Output format specification
- Testing checklist and troubleshooting guide

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
unit_type        varchar(50)   CHECK (unit_type IN ('bottle', 'can', 'keg', 'case', 'pack', 'cask', 'bag-in-box'))
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

---

## 🚧 Known Issues - Product Matching Logic (In Review)

**Status**: Product matching system has conflicting logics that need clarification. Owner to redesign vision and provide answers in next session.

### Current Implementation

**Fuzzy Matching Algorithm** (PostgreSQL `pg_trgm` extension):
- Uses similarity score (0-1 scale) + custom tiered scoring
- 4-tier ranking system:
  - TIER 1: Exact prefix match (score 100+)
  - TIER 2: Word boundary match (score 80+)
  - TIER 3: High similarity >50% (score 60+)
  - TIER 4: Moderate similarity >35% (score 40+)

**Statistics Calculation** (InvoiceImportSummary.js):
- `supplierMatched`: From Step 3 (supplier_item_list matching)
- `masterProductMatched`: Items with `action === 'matched'`
- Success criteria: All items matched

### Issues Requiring Clarification

**Before next session, owner should document:**

1. **Matching Accuracy**
   - [ ] Are items not matching that should match? Which examples?
   - [ ] Are items matching incorrectly? Which examples?
   - [ ] What confidence threshold should be required? (currently >35%)
   - [ ] Should fuzzy matching be disabled/replaced with exact matching?

2. **Statistics & Success Criteria**
   - [ ] What counts as "success"? (auto-match only? include manual?)
   - [ ] Are summary stats showing wrong counts?
   - [ ] Which statistics are misleading or incorrect?
   - [ ] Should "matched" include both auto-matched AND manually-matched items?

3. **System Flow**
   - [ ] Step 3 (Supplier matching): Should this be automatic or manual?
   - [ ] Step 4 (Master product matching): Current role? What should change?
   - [ ] Should confidence scores affect next steps?
   - [ ] When should user see "failed" status vs "unmatched"?

4. **Data Processing**
   - [ ] How should similarity thresholds be tuned?
   - [ ] Should matching rules differ by product category?
   - [ ] How to handle partial matches (brand match but not size)?
   - [ ] Should unit_size/case_size affect match quality?

5. **User Experience**
   - [ ] Should auto-matching be hidden or transparent?
   - [ ] Should users always see suggestions even for perfect matches?
   - [ ] How many suggestions should display? (currently 5)
   - [ ] Should there be a "confidence bar" showing match quality?

### Next Steps

**Session Start Procedure:**
1. Owner provides written redesign of desired matching behavior
2. Owner answers clarification questions above
3. Claude Code implements based on new vision
4. Test with real supplier invoices
5. Iterate on scoring/thresholds as needed

### Files Involved

- **Backend**: `backend/server.js` (lines 616-670, 2438+) - Fuzzy matching queries
- **Frontend**: `frontend/src/components/MasterProductMatcher.js` - Match suggestion UI
- **Frontend**: `frontend/src/components/InvoiceImportSummary.js` - Statistics display
- **Reference**: `masterproducts.md` - Product database documentation

---

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

### October 21, 2025 - **IMPORTANT: Development Workflow Update - Use `npm run dev` with Nodemon**
- ✅ **Switched backend development command** from `npm start` to `npm run dev`
- ✅ **Nodemon auto-restart** - Backend now auto-restarts when files change
- ✅ **No process killing** - Removed requirement to manually kill `node.exe` processes
- ✅ **Updated README** - Clarified development workflow and server management
- ⚠️ **Critical**: Do NOT use `taskkill` or `Stop-Process` during development
- 💡 **Why**: Killing processes disrupts nodemon's file watchers and auto-restart mechanism
- 📝 **Better approach**: Let nodemon handle restarts, use `Ctrl+C` in terminal if manual stop needed

**Development Workflow:**
1. Run `npm run dev` in backend terminal (stays running)
2. Run `npm start` in frontend terminal (stays running)
3. Edit files - changes auto-reload via nodemon and React dev server
4. No process management needed - just code and save

### October 21, 2025 - **Critical: Master Products Database Import & Schema Fix**
- ✅ **Imported 570 master products** from `master_products_comprehensive.csv` to local database
- ✅ **Fixed schema constraint** - Added 'cask' and 'bag-in-box' to unit_type CHECK constraint
- ✅ **Products breakdown**: Spirits (269), Wines (124), Beers & Ales (83), Soft Drinks (67), Cider & Perry (27)
- ✅ **Updated schema.sql** with corrected unit_type values
- ⚠️ **Issue identified**: Previous migration from Railway didn't include master products data
- ✅ **Solution**: Used PostgreSQL COPY command to import CSV directly
- ✅ **Database verified**: All 570 products successfully imported and accessible

**Why This Matters:**
- Master products are the single source of truth for all product specifications
- Without this data, the system cannot function (product search, stock-taking, etc.)
- Now fully operational with complete UK drinks catalog

### October 20, 2025 (Later) - **Quick Startup Checklist for Claude Code**
- ✅ **Added quick startup guide** to reduce token waste on setup verification
- ✅ **30-second verification procedure** - check expected outputs from backend/frontend
- ✅ **Troubleshooting section** - quick fixes for common issues
- ✅ **No more full diagnostics** - just verify servers are running next time
- ✅ **PostgreSQL automatic** - Windows Service runs on startup

### October 20, 2025 - **MAJOR: Full Migration to Localhost Architecture**
- ✅ **Removed Railway dependency** - system now fully self-contained
- ✅ **Local PostgreSQL 17 setup** - complete database schema installed locally
- ✅ **Trust authentication configured** - no password required for localhost
- ✅ **Frontend API updated** - all requests now go to localhost:3005
- ✅ **Backend configured** - uses local PostgreSQL via explicit connection params
- ✅ **Complete README rewrite** - updated for localhost-only architecture
- ✅ **Database schema file created** - `backend/schema.sql` with all 15 tables
- ✅ **Development workflow simplified** - no cloud dependencies, fully offline capable
- ✅ **Environment files updated** - Railway configs archived/commented out

**Benefits of This Migration:**
- ⚡ Faster development (no network latency)
- 🔒 Complete data ownership and privacy
- 💰 Zero cloud hosting costs
- 🌐 Offline development capability
- 🛡️ Safe experimentation without production risks

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

### 🚨 CRITICAL - TEST THIS FIRST (Session 2025-10-21)
**Step 3 Fuzzy Matching Implementation - NEEDS TESTING**
- [ ] **PRIORITY: Test fuzzy matching on new invoice (not seen before)**
  - Upload new Booker Limited PDF at http://localhost:3000/invoice-review
  - Expected: Items NOT in supplier_item_list should get Tier 2 fuzzy matched
  - Verify: Some items in "created" category (not all in "matched")
  - Check: supplier_item_list shows auto_matched=true, confidence_score > 0
- [ ] Test with different supplier (not Booker)
- [ ] Verify confidence score cutoff (60%) works correctly
- [ ] Test items below 60% confidence go to "failed" (needs manual Step 4)
- [ ] Check response wrapping - confirm UI dashboard displays stats correctly
- **Documentation:** See `FUZZY_MATCHING_IMPLEMENTATION.md` for implementation details

### 🧪 Beta Testing Required (Stock-Taking Workflow)
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
- [x] Add invoice metadata fields (invoice_number, invoice_date, venue selection)

**Step 2: Create Invoice & Line Items**
- [x] API: POST /api/invoices - create invoice header (DONE - with force_create override)
- [x] API: Create line items from reviewed data (DONE)
- [x] Store raw supplier data (product_code, product_name, pricing) (DONE)
- [x] Duplicate invoice detection with warning (DONE)
- [x] Testing mode toggle for ignoring duplicate check (DONE)

**Step 3: Match to Supplier Items (IMPLEMENTED - NEEDS TESTING)**
- [x] API: Tier 1 - Find existing supplier items by SKU (DONE)
- [x] API: Tier 2 - Fuzzy match against master_products (DONE - NEW)
- [x] Auto-create new supplier_item_list entries (DONE)
- [x] Update invoice_line_items with supplier_item_list_id (DONE)
- [x] Update invoice_line_items with master_product_id if fuzzy matched (DONE)
- [x] Track auto_matched flag and confidence_score (DONE)
- [x] UI: Show matched vs created vs needs manual items (ALREADY WORKS)
- [ ] **USER TESTING REQUIRED** - See "CRITICAL - TEST THIS FIRST" above

**Step 4: Match to Master Products (Manual Review) - NOT YET STARTED**
- [ ] UI: Show items that need manual matching (from failed category)
- [ ] UI: Fuzzy search suggestions with confidence scores
- [ ] UI: Allow user to select match or create new master product
- [ ] API: PUT /api/invoice-line-items/:id/link-master-product
- [ ] Update supplier_item_list.master_product_id
- [ ] Update invoice_line_items.master_product_id
- [ ] Update supplier_item_list.verified = true

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

## Master Products Catalog Structure

**Comprehensive product database organized by category and subcategory. Each product includes multiple sizes and variants.**

### Spirit Categories

#### 1. **GIN** (London Dry, Botanical, Flavored)
- London Dry Gin (Bombay Sapphire, Beefeater, Tanqueray, Gordon's)
- Premium/Craft Gin (Monkey 47, Hendrick's, Roku, Opihr)
- Flavored Gin (Tanqueray Rangpur, Bombay Sapphire Distilled Lime, Whitley Neill)
- Botanical Gin (Sipsmith, Tarquin's)

#### 2. **VODKA** (Standard, Premium, Flavored)
- Standard Vodka (Smirnoff, Absolut, Ketel One, Cîroc, Grey Goose)
- Premium Vodka (Belvedere, Żubrówka, Nemiroff)
- Flavored Vodka (Vanilla, Raspberry, Lemon, Cranberry variants)

#### 3. **WHISKY** (Single Malt Scotch, Blended, Bourbon, Irish, Japanese)
- Single Malt Scotch - Speyside (Glenfiddich 12/15/18, Balvenie 12/15, Glenlivet 12/18)
- Single Malt Scotch - Islay (Laphroaig 10/15/18, Ardbeg, Talisker 10)
- Single Malt Scotch - Highland (Dalmore 12/15/18, Oban, Ben Nevis)
- Blended Scotch (Johnnie Walker Red/Black/Gold/Blue, Chivas Regal 12)
- Bourbon (Jack Daniel's, Woodford Reserve, Maker's Mark, Buffalo Trace)
- Irish Whiskey (Jameson, Bushmills, Tullamore Dew, Powers)
- Japanese Whisky (Yamazaki, Hibiki, Hakushu)

#### 4. **RUM** (White, Dark, Spiced, Aged)
- White Rum (Bacardi, Captain Morgan White, Havana Club)
- Dark/Navy Rum (Captain Morgan Spiced, Appleton Estate Signature, Myers's)
- Premium Aged Rum (Appleton Estate 12/21 Year, El Dorado 12/15/21)
- Rhum Agricole (Rhum Clément, Rhum J.M.)

#### 5. **TEQUILA & MEZCAL**
- Tequila Blanco (Jose Cuervo, Don Julio, Patron, Casamigos)
- Tequila Reposado (Don Julio Reposado, Patron Reposado)
- Tequila Anejo (Don Julio Anejo, Patron Anejo)
- Mezcal (Del Maguey, Vida, Crema de Mezcal)

#### 6. **BRANDY & COGNAC**
- Cognac VSOP (Hennessy, Remy Martin, Courvoisier, Martell)
- Cognac XO (Hennessy XO, Remy Martin XO)
- Brandy (Metaxa, Armagnac, Calvados)

#### 7. **LIQUEURS** (Cream, Herbal, Fruit, Coffee, Nut)
- Cream Liqueurs (Baileys Irish Cream, Amaretto, Frangelico, Kahlúa)
- Herbal Liqueurs (Drambuie, Benedictine, Chartreuse, Jägermeister)
- Fruit Liqueurs (Chambord, Cointreau, Grand Marnier, Midori, Peach Schnapps)
- Coffee Liqueurs (Kahlúa, Tia Maria)

### Wine Categories

#### 8. **RED WINE** (Pinot Noir, Merlot, Cabernet Sauvignon, etc.)
- Pinot Noir (Burgundy, New Zealand, California, Australian variants)
- Merlot (Bordeaux, California, Chilean variants)
- Cabernet Sauvignon (Bordeaux, California Napa, Australian variants)
- Shiraz/Syrah (Australian, French Rhône variants)
- Rioja (Spanish - Tempranillo blends)
- Super Tuscan (Italian - Cabernet/Merlot blends)
- Other Red (Barolo, Barbaresco, Grenache)

#### 9. **WHITE WINE** (Sauvignon Blanc, Chardonnay, Riesling, etc.)
- Sauvignon Blanc (Loire, New Zealand, Chilean variants)
- Chardonnay (Burgundy, Chablis, California variants)
- Riesling (Alsace, German, Australian variants)
- Pinot Grigio (Italian, European variants)
- Albariño (Spanish variants)
- Grüner Veltliner (Austrian variants)

#### 10. **SPARKLING WINE** (Champagne, Prosecco, Cava, etc.)
- Champagne (Non-Vintage, Vintage, Prestige Cuvée)
- Prosecco (Italian - DOC, DOCG variants)
- Cava (Spanish - Brut, Extra Dry)
- English Sparkling (Nyetimber, Ridgeview)
- Champagne/Prosecco Multiple Bottle Sizes (75cl, 150cl Magnum, 20cl splits)

#### 11. **FORTIFIED WINE** (Port, Sherry, Vermouth, Madeira)
- Port (Tawny, Vintage, Ruby, LBV)
- Sherry (Fino, Amontillado, Oloroso, Cream)
- Vermouth (Dry, Sweet, Italian, French)
- Madeira (Sercial, Verdelho, Bual, Malmsey)

### Beer & Cider

#### 12. **BEER** (Lager, Ale, Stout, IPA, Cider)
- Lager (Stella Artois, Heineken, Budweiser, Corona, San Miguel)
- Pale Ale (Kronenbourg 1664, Foster's, Carlsberg)
- IPA (Timothy Taylor, Brooklyn Brewery, Fuller's London Pride)
- Stout (Guinness, Murphy's Irish Stout)
- Cider (Magners, Strongbow, Kopparberg, Bulmers)
- Multiple Sizes: 330ml can/bottle, 500ml can/bottle, 1L bottle

#### 13. **SOFT DRINKS & MIXERS**
- Tonic Water (Fever-Tree, Schweppes, Q Tonic, Fentimans)
- Ginger Beer (Fever-Tree, Crabbie's, Old Jamaica)
- Cola (Coca-Cola, Diet Coke, Pepsi, Sprite, 7UP, San Pellegrino)
- Juices (Orange, Cranberry, Pineapple, Apple, Tomato)
- Energy Drinks (Red Bull, Monster, Lucozade)
- Still Water/Sparkling (Perrier, San Pellegrino, Voss)

### Food & Bar Snacks

#### 14. **BAR SNACKS & FOOD** (Nuts, Crisps, Olives, Cheese, Charcuterie)
- Nuts (Salted Peanuts, Cashews, Almonds, Mixed Nuts - KP, Planters, Blue Diamond)
- Crisps (Lay's, Walker's, Pringles - multiple flavors)
- Olives & Pickles (Mixed Olives, Marinated Vegetables)
- Cheese & Charcuterie (Cheddar, Brie, Prosciutto, Salami)
- Dried Fruit & Seeds
- Gourmet Items (Nuts with flavoring, Roasted Chickpeas, Mixed Snack Plates)

---

## 📚 Important Documentation Files

- **[masterproducts.md](./masterproducts.md)** ⭐ **Product Inventory & Expansion Reference**
  - Complete dump of all 1,159 master products
  - Organized by category and subcategory
  - Expansion recommendations and notes
  - Use this when adding new products to avoid duplicates
  - Updated after each bulk product addition

---

## Development Notes

### Working with Claude Code
When providing prompts for new features:
1. **Be specific** about data sources (e.g., "use master_products, not venue_products")
2. **Specify simplicity** when desired (e.g., "just delete from stock_entries")
3. **Clarify persistence** requirements (e.g., "session-only" vs "permanent")
4. **Reference this README** for architectural principles before implementing
5. **Development server**: Always use `npm run dev` for backend (NOT `npm start`)
6. **Server management**: Let nodemon handle restarts - never kill Node processes
7. **File changes**: Save files to trigger automatic backend restart via nodemon

### Temporary SQL Files - Cleanup Standard

When creating SQL migration or expansion scripts that will only be used once and then discarded, **mark them clearly for safe deletion**:

```sql
-- ============================================
-- TEMPORARY SQL FILE - SAFE TO DELETE
-- ============================================
-- Created: [Date]
-- Purpose: [Brief description]
-- Description: [What it does]
-- Status: ✅ Applied to Database / ❌ Abandoned / 🚀 Pending
-- Cleanup: This file can be safely deleted after [condition]
-- ============================================
```

**Examples of temporary SQL files:**
- Product expansion/bulk inserts (e.g., `add_snacks_softdrinks_v2.sql`)
- Schema migrations (e.g., `migrate_old_schema_to_new.sql`)
- Data cleanup scripts (e.g., `fix_duplicate_products.sql`)
- One-time test data loads

**Files to keep permanently:**
- `backend/schema.sql` - Core database schema
- Any migration files referenced in version control
- Backup/restore scripts

### Development Checklist
1. **Start PostgreSQL** - Ensure service is running (check Windows Services)
2. **Start Backend** - `cd backend && npm run dev` (port 3005, auto-restart on changes)
3. **Start Frontend** - `cd frontend && npm start` (port 3000)
4. **Test locally** - Verify both frontend and backend are working
5. **Make changes** - Code changes auto-reload via nodemon and React dev server
6. **Test database** - Use psql to inspect data if needed
7. **Commit changes** - `git add . && git commit -m "description"`
8. **Push to GitHub** - `git push` (for version control and backup)

### Optional: Backup Your Database
```bash
# Export database to SQL file
pg_dump -U postgres stocktaking_local > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres stocktaking_local < backup_20251020.sql
```

---

## 📋 Latest Session Summary (October 22, 2025 - Part 2)

### Completed Tasks:

**1. Step 4 Form Improvements** ✅
- Category field: Changed from text input to dropdown (18 active categories)
- Unit size label: Updated from "(ml)" to "(ml or g)" for beverages and snacks
- Form pre-fill: unit_type, unit_size, case_size auto-populated from parsed invoice data

**2. Dashboard Redirect Fixed** ✅
- Fixed navigation route from `/dashboard` → `/` (correct home route)
- Modal completion now properly redirects to dashboard

**3. Pack & Size Data Flow** ✅
- Added `pack_size` and `unit_size` columns to `invoice_line_items` table
- Backend now stores parsed pack and size data from PDF invoices
- Frontend displays Pack and Size fields in Step 4 matcher
- Modal receives pack_size and unit_size directly (no more regex parsing)
- Example: "KP Salted Cashews Carded | SKU: 184963 | Pack: 12 | Size: 30g"

**4. Documentation** ✅
- Updated README with fuzzy matching issues section
- Added 20+ clarification questions for next session on matching logic
- Referenced affected files and configuration

### Known Issues Requiring Next Session:

**Fuzzy Matching Logic Review** (documented in README)
- Conflicting logics in how products are matched to master database
- Questions raised about accuracy, statistics, and success criteria
- Owner to provide redesign vision and answers before implementation

---

## 📋 Session Summary - October 22, 2025 (Second Session)

### Completed Tasks:

#### 1. **System Verification & Startup** ✅
- Read comprehensive README documentation
- Started backend server with `npm run dev` (nodemon auto-restart enabled)
- Started frontend server with `npm start`
- Verified PostgreSQL database connectivity
- Database health check passed: 1,159 active products
- All 15 database tables present and functional

#### 2. **Master Products Expansion** ✅
- **Added 220 new products** to master database
  - 100 SNACK products with multiple sizes
  - 120 SOFT DRINK products with multiple sizes
- Database growth: **1,159 → 1,379 products (+19%)**
- Created SQL expansion script with validation for unit_type constraints
- Verified no duplicates introduced

**Products Added by Category:**
- **Snacks (100 products)**:
  - 25 Nuts (Almonds, Cashews, Pistachios, Macadamia, Pecans, Wasabi Peas, etc.)
  - 30 Crisps/Chips (Lay's, Doritos, Pringles, Walkers, Kettle, Stacy's, etc.)
  - 10 Cheese Snacks (Cheetos, Goldfish, Whisps Crisps, etc.)
  - 10 Crackers (Jacob's, Ritz, Wheat Thins, Triscuits, Saltines, etc.)
  - 8 Pretzels (multiple flavors)
  - 12 Chocolate bars (Cadbury, Mars, Nestlé, Lindt, etc.)
  - 5 Dips (Hummus, Guacamole, Salsa, Tapenade)

- **Soft Drinks (120 products)**:
  - 20 Tonic waters (Fever-Tree, Fentimans, Q Tonic, Schweppes)
  - 25 Juices (Orange, Cranberry, Mango, Pineapple, Apple, Guava, Passion Fruit)
  - 18 Sparkling waters (San Pellegrino, Perrier, Voss, Topo Chico, AHA, LaCroix)
  - 12 Lemonades (Fever-Tree, Fentimans, Simply, Britvic)
  - 15 Cola & Sodas (Coca-Cola, Diet Coke, Sprite, Fanta, 7UP, Pepsi, Mountain Dew)
  - 12 Sports drinks (Gatorade, Powerade, Lucozade, BodyArmor)
  - 10 Iced Tea (Lipton, Snapple, Nestea, Ginger Beers)
  - 8 Energy drinks (Red Bull, Monster, Burn, XS, Celsius)

#### 3. **SQL File Management Standards Established** ✅
- Created comprehensive header template for temporary SQL files
- Marked all migration/expansion SQL files for safe deletion
- Updated README.md with "Temporary SQL Files - Cleanup Standard" section
- Documented when to keep vs. delete SQL files

**Files Marked:**
- ✅ `add_snacks_softdrinks_v2.sql` - Marked as APPLIED (safe to delete)
- ❌ `add_snacks_softdrinks.sql` - Marked as ABANDONED (had errors)

#### 4. **Documentation Updates** ✅

**masterproducts.md** Updated:
- Updated product count: 1,159 → 1,379 (+220)
- Added detailed expansion notes for SNACK and SOFT DRINK categories
- Created comprehensive 3-part expansion summary with specific products added
- Documented all expansion files and format standards

**README.md** Updated:
- Added "Temporary SQL Files - Cleanup Standard" section
- Documented SQL file naming conventions
- Provided template header for future SQL migrations
- Explained which files are permanent vs. temporary

#### 5. **Product Catalog Organization System** ✅

**Created 18 Individual Category Files in `/docs/products/`:**
- `products-beer.md` (39 products)
- `products-beers-ales.md` (80 products)
- `products-brandy.md` (22 products)
- `products-cider-perry.md` (27 products)
- `products-gin.md` (43 products)
- `products-liqueur.md` (36 products)
- `products-mezcal.md` (5 products)
- `products-rum.md` (35 products)
- `products-snack.md` (100 NEW products)
- `products-snacks.md` (56 products)
- `products-soft-drink.md` (120 NEW products)
- `products-soft-drinks.md` (93 products)
- `products-spirits.md` (269 products)
- `products-tequila.md` (24 products)
- `products-vodka.md` (41 products)
- `products-whisky.md` (70 products)
- `products-wine.md` (106 products)
- `products-wines.md` (124 products)

**Index File:**
- `docs/products/INDEX.md` - Master index linking all category files

**Each file includes:**
- Product name, brand, unit type, size, case size
- Organized by subcategory
- Link back to master products index
- Ready for duplicate checking before adding new products

**Generator Script:**
- Created `backend/generate_category_files.js` (Node.js script)
- Marked as TEMPORARY - can be deleted after files generated
- Pulls all products from PostgreSQL dynamically
- Can be re-run if database changes

#### 6. **Process & Best Practices Clarifications** ✅
- Confirmed pre-approved operations in CLAUDE.md
- Clarified that all PostgreSQL commands require no confirmation
- Established autonomous approach to development tasks
- All file operations can be done proactively without asking

### Files Created/Modified This Session:

**SQL Migration Scripts:**
- `backend/add_snacks_softdrinks.sql` (erroneous version)
- `backend/add_snacks_softdrinks_v2.sql` (final working version)

**Generator Scripts:**
- `backend/generate_category_files.js` (temporary, can delete)

**Documentation Files:**
- `masterproducts.md` (updated with new products & expansion notes)
- `README.md` (updated with SQL cleanup standards & session summary)
- `docs/products/products-*.md` (18 category listing files)
- `docs/products/INDEX.md` (master index of all categories)

**Exported Data:**
- `all_products_export.txt` (temporary - can delete)

### Key Standards Established:

1. **SQL Temporary Files**: All one-time migration scripts marked with:
   ```sql
   -- ============================================
   -- TEMPORARY SQL FILE - SAFE TO DELETE
   -- Created: [Date]
   -- Purpose: [Description]
   -- Status: [Applied/Abandoned/Pending]
   -- ============================================
   ```

2. **Product Catalog References**: Every category file links to:
   - Master products index
   - Organized by subcategory
   - Complete product details for duplicate checking

3. **Autonomous Operations**: All pre-approved in CLAUDE.md:
   - PostgreSQL queries (no confirmation needed)
   - npm commands (run directly)
   - File operations (read/write/edit proactively)
   - Development server management

### Summary Statistics:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total Products | 1,159 | 1,379 | +220 (+19%) |
| SNACK Products | 45 | 145 | +100 |
| SOFT DRINK Products | 44 | 164 | +120 |
| Category Files | 0 | 18 | +18 |
| Documentation Pages | 1 | 20 | +19 |
| Total Categories | 14 | 20 | +6 |

### Ready For:

✅ Adding new products without duplicates (reference files available)
✅ Managing temporary SQL files (cleanup standards documented)
✅ Proactive development work (permissions clarified)
✅ Future product expansions (catalog org system in place)
✅ Invoice importing (220 new products searchable)

---

**Version**: 2.0.1 (Localhost Edition)
**Last Updated**: October 22, 2025
**Architecture**: Fully self-contained localhost application (no cloud dependencies)
**Session Notes**: Comprehensive product catalog expansion with organized reference system

---

# 📄 Invoice PDF Parsing & Supplier Detection System

## Current Status: Steps 1-5 Complete ✅

The invoice PDF parsing and supplier item matching system is **fully functional** and has been comprehensively documented. The system has been tested with real Booker invoices and successfully handles the complete workflow from PDF upload through final database storage.

**Complete 5-Step Workflow:**
- ✅ **Step 1**: Upload & Supplier Detection
- ✅ **Step 2**: Review Items & Select with Progressive Learning
- ✅ **Step 3**: Confirm Ignored Items + Smart Matching (Tier 1, 2, 3)
- ✅ **Step 4**: Manual Master Product Matching (with fuzzy search)
- ✅ **Step 5**: Final Summary & Confirmation (with database save)

### What's Working

✅ **Step 1: Upload & Supplier Detection**
- PDF file upload (drag-drop or file picker)
- PDF text extraction using PDFParse library
- Two-layer supplier detection system
- Booker supplier fully configured and working
- Error handling for unknown suppliers

✅ **Step 2: Review Items & Select**
- Parses invoice items from PDF into structured data
- Groups items by supplier-defined categories
- Displays category header with: collapse/expand, select-all checkbox, category name, item count, subtotal
- Checkbox selection for individual items
- Quantity editor (±/- buttons) with real-time subtotal updates
- Custom checkbox styling (blue when checked, gray when unchecked)
- Real-time calculation of:
  - Items selected per category
  - Category subtotals
  - Grand total of selected items
- Clean, consolidated header bar eliminates redundant UI
- Navigation: Back button and Next button (disabled if no items selected)
- Progressive learning: Auto-unchecks items from venue_ignore on subsequent imports

✅ **Step 3: Confirm Ignored Items & Smart Matching**
- Three-tier matching system for supplier items:
  - **Tier 1 (MATCHED)**: Items found in supplier_item_list → Auto-linked
  - **Tier 2 (CREATED)**: Fuzzy-matched to master_products with ≥60% confidence → Auto-linked
  - **Tier 2 Failed (NEEDS_MANUAL)**: Items with <60% confidence → Require Step 4
- Optional reason tracking for ignored items
- Saves to venue_ignore table for progressive learning
- Fuzzy matching using PostgreSQL pg_trgm with confidence scoring
- Comprehensive matching logic and learning system documentation in `docs/INVOICE_MATCHING_LOGIC.md`

✅ **Step 4: Manual Master Product Matching**
- Search and select master products for unmatched items
- Fuzzy search with confidence scoring from `/api/master-products/search`
- Display matching suggestions with confidence scores
- Create new master product fallback (if no match found)
- Updates supplier_item_list with verified=true for learning system
- Item-by-item review with navigation controls
- See `docs/STEP4_DESIGN.md` for comprehensive specification

✅ **Step 5: Final Summary & Confirmation**
- Complete summary of invoice with metadata, items, and category breakdown
- Review all 4 types of data before final save:
  - invoices (header record)
  - invoice_line_items (selected items)
  - supplier_item_list (learning system)
  - venue_ignored_items (ignored items with reasons)
- Validation warnings for data quality
- One-click database save with transaction support
- Success redirect to dashboard
- See `docs/STEP5_DESIGN.md` for comprehensive specification

### Access the Feature

Navigate to: **`http://localhost:3000/invoice-input`**

You can upload any Booker invoice from: `C:/Users/kevth/Desktop/Stocktake/stocktaking-system/invoices/`

---

## Step 2: Review Items & Select - Implementation Details

### Component Architecture

**File**: `frontend/src/components/InvoiceWorkflow/Step2_ReviewItems.js`

**Purpose**: Allows users to review parsed invoice items, select which items to import, and adjust quantities before proceeding to the next step.

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Review Invoice Items                               │
│                                                     │
│  Invoice #3596857 | Date: 2024-10-15 | Booker Ltd. │
├─────────────────────────────────────────────────────┤
│  ▼  ☑  RETAIL GROCERY  (15/20 items, £234.50)     │
│     ├─ [☑] 063724 Coke Zero...  [−] 2 [+]  £8.50 │
│     ├─ [☑] 064156 Sprite 1.5L...  [−] 5 [+]  £12.00│
│     └─ [☐] 071234 Apple Juice...  [−] 1 [+]  £3.20 │
│                                                     │
│  ▼  ☑  CHILLED  (8/10 items, £156.75)              │
│     ├─ [☑] 045632 Butter 500g...  [−] 1 [+]  £4.50│
│     └─ [☑] 058234 Milk Semi...  [−] 2 [+]  £6.00  │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Items Selected: 23 of 30  | Subtotal: £391.25    │
├─────────────────────────────────────────────────────┤
│  [← Back]                          [Next: Confirm →]│
└─────────────────────────────────────────────────────┘
```

### Key Features

**1. Category-Based Organization**
- Items grouped by supplier-defined categories (e.g., "RETAIL GROCERY", "CHILLED")
- Categories collapsible/expandable (chevron icon)
- Blue highlight when expanded
- All items visible by default

**2. Consolidated Category Header**
- Shows: Chevron, Select-All Checkbox, Category Name, Item Count, Subtotal
- Single select-all checkbox per category
- Eliminates redundant UI sections
- Dynamic subtotals update in real-time

**3. Item Selection & Editing**
```
[Checkbox]  SKU  Name  Pack Size  [Qty Controls]  Price
```
- Individual item checkboxes
- Quantity editor: decrease (−), input field, increase (+)
- Quantity disabled if item unchecked
- Real-time price calculation: `price × qty`
- Unselected items appear grayed out

**4. Dynamic Calculations**
- Category subtotal: Sum of selected items in category
- Grand total: Sum across all categories
- Item count: X selected / Y total items

### State Management

**Component State** (managed by parent InvoiceWorkflow):
- `itemCheckboxes`: { [index]: boolean } - Tracks which items are selected
- `detectedSupplier`: Supplier name and ID
- `invoiceMetadata`: Invoice number, date, totals
- `quantities`: { "CATEGORY-SKU": number } - Modified quantities

**Callbacks to Parent**:
- `onItemCheckboxChange(index, checked)` - Update item selection
- `onComplete(itemCheckboxes)` - Proceed to next step
- `onBack()` - Return to previous step

### Props Interface

```javascript
{
  parsedItems: [
    {
      supplierSku: "063724",
      supplierName: "Coke Zero",
      categoryHeader: "RETAIL GROCERY",
      packSize: "24x330ml",
      unitSize: "330",
      quantity: 2,
      unitPrice: 4.25,
      rrp: 5.99,
      vatCode: "B",
      vatRate: 20
    },
    // ... more items
  ],
  itemCheckboxes: { 0: true, 1: true, 2: false, ... },
  detectedSupplier: { id: "UUID", name: "Booker Limited" },
  invoiceMetadata: { invoiceNumber: "3596857", invoiceDate: "2024-10-15", ... },
  onItemCheckboxChange: (index, checked) => void,
  onComplete: (checkboxState) => void,
  onBack: () => void
}
```

### Styling

**Custom Checkbox Style**:
- Unchecked: Light gray background (#dee2e6), gray border
- Checked: Blue background (#007bff), white border
- Checkmark icon displayed when checked
- Responsive to hover states

**Category Header Styling**:
- Normal: Light gray background (#f8f9fa)
- Expanded: Blue background (#007bff), white text
- Smooth color transitions on state change

**Item Row Styling**:
- Normal: White background
- Hover: Light gray background (#f8f9fa)
- Unselected: 70% opacity
- Gap spacing for consistent alignment

### Workflow Integration

```
Step 1: Upload & Parse PDF
    ↓ (parsedItems, metadata, detectedSupplier)
Step 2: Review Items & Select
    ↓ (itemCheckboxes - selected vs ignored items)
Step 3: Confirm Ignored Items & Smart Matching
    ↓ (Step 3 matches Tier 1 & 2, extracts items needing manual matching)
Step 4: Manual Master Product Matching
    ↓ (matchedItems - user selects master products for unmatched items)
Step 5: Final Summary & Confirmation
    ↓ (onSubmit - saves to database)
✅ INVOICE SAVED TO DATABASE
```

**Data Flow Between Steps:**
- Step 1 → Step 2: Parsed items, invoice metadata, detected supplier
- Step 2 → Step 3: Item selection state (checkbox state)
- Step 3 → Step 4: Unmatched items requiring manual master product selection
- Step 4 → Step 5: Complete matched items dictionary
- Step 5 → Database: All invoice data (invoices, line_items, ignored_items, supplier_item_list)

### Data Flow

```javascript
// When user checks/unchecks item:
handleToggleItem(key) {
  const itemIndex = parsedItems.findIndex(item =>
    `${item.categoryHeader}-${item.supplierSku}` === key
  );
  onItemCheckboxChange(itemIndex, !itemCheckboxes[itemIndex]);
}

// When user clicks "Select All" on category:
handleToggleAll(category, selectAll) {
  parsedItems.forEach((item, idx) => {
    if (item.categoryHeader === category) {
      onItemCheckboxChange(idx, selectAll);
    }
  });
}

// When user changes quantity:
handleQuantityChange(key, newQuantity) {
  setQuantities(prev => ({
    ...prev,
    [key]: newQuantity
  }));
}

// When user proceeds to next step:
handleProceed() {
  onComplete(itemCheckboxes);
}
```

### Testing with Booker Invoice

**Test File**: `Booker-Invoice-3596857.pdf`

**Expected Results**:
- ✅ 22 items parsed across 4 categories
- ✅ Categories: RETAIL GROCERY, CHILLED, FROZEN, BEVERAGES
- ✅ All items visible and selectable
- ✅ Subtotals calculate correctly
- ✅ Select-all checkbox works per category
- ✅ Quantities can be edited
- ✅ Next button disabled when no items selected
- ✅ Back button navigates to Step 1

### Known Limitations

None currently. Step 2 is fully functional and tested.

Example files:
- Booker-Invoice-3504502.pdf ✅ (Detected successfully)
- Booker-Invoice-3505174.pdf ✅ (Detected successfully)
- Booker-Invoice-3505586.pdf ✅ (Detected successfully)
- TSIM2074.pdf (Tolchards - Unknown, returns error)

### How It Works: Two-Layer Detection

**Layer 1: MainSupplierMatcher** (Fast - ~50ms)
- Scans all suppliers in database by keywords
- Returns top 5 candidates by confidence score
- Scales to 100+ suppliers with constant performance

**Layer 2: Parser Validation** (Selective - ~100ms)
- Only validates top 3 candidates (not all)
- Each parser performs detailed checks
- Picks best match by confidence score
- Total process: ~250ms per invoice

### API Endpoint

```
POST http://localhost:3005/api/invoices/parse
Content-Type: multipart/form-data

Body:
  file: [PDF file, 5MB max]
  venueId: [optional UUID]
```

**Success (Booker)**:
```json
{
  "success": true,
  "supplier": {
    "id": "74f1b14b-6020-4575-a23c-2ff7a4a6f7d2",
    "name": "Booker Limited",
    "confidence": 70,
    "detectionMethod": "two-layer"
  },
  "parsedItems": [],
  "metadata": {...},
  "rawText": "...",
  "parserUsed": "booker"
}
```

**Error (Unknown Supplier)**:
```json
{
  "success": false,
  "error": "Could not detect supplier from PDF. No matching keywords found.",
  "suggestion": "Ensure the PDF is a valid supplier invoice..."
}
```

---

## 🚧 TODO: Future Implementation

### Task 1: Add New Supplier Support (PENDING)
**When**: After Step 2 is complete
**Priority**: High
**Complexity**: Medium

Currently, when an unknown supplier is uploaded (e.g., Tolchards), the system returns an error. 

**Desired Flow**:
1. User uploads invoice from unknown supplier
2. System detects it's not recognized
3. Redirect to "Add New Supplier" screen
4. Pre-fill with extracted PDF text
5. User provides:
   - Supplier name
   - Keywords that identify invoices (e.g., "tolchards", "tolchard", "torquay")
   - Expected structure notes
6. System creates parser entry
7. User tests parser with multiple invoices
8. Once working, parser added to production

**Example: Tolchards**
```
Company: Tolchards Ltd (Wine Merchant)
Location: Woodland Road, Torquay, Devon
Contact: creditcontrol@tolchards.com
Keywords to add: tolchards, tolchard, woodland, torquay, wine
PDF Format: Category-based with wine products
```

The Tolchards TSIM2074.pdf is in the invoices folder for testing once this feature is implemented.

### Task 2: Implement Booker Parser (PENDING)
**When**: After "Add New Supplier" UI is working
**Status**: Currently a stub - returns empty items
**Next Step**: Extract structured data from Booker invoices

The Booker parser currently:
- ✅ Detects Booker invoices correctly (70% confidence)
- ❌ Does not extract item details
- ❌ Does not parse categories
- ❌ Does not extract invoice metadata

**What needs to be extracted**:
- Invoice metadata: number, date, totals, VAT
- Items grouped by category:
  - RETAIL GROCERY
  - CHILLED
  - CATERING GROCERY
  - CONFECTIONERY
  - WINES SPIRITS BEERS
  - FRUIT & VEG
  - NON-FOOD
- Item fields: SKU, description, pack size, unit size, qty, price, line total

### Steps 2-5 UI Components (COMPLETE ✅)

**Step 2: Review Parsed Items** ✅ COMPLETE
- See comprehensive documentation in **`docs/STEP3_DESIGN.md`** (Step 3 design that includes Step 2 integration)
- Category grouping with collapse/expand
- Select-all checkboxes per category
- Quantity editing with ±/- controls
- Real-time subtotal calculations

**Step 3: Confirm Ignored Items** ✅ COMPLETE
- See comprehensive documentation in **`docs/STEP3_DESIGN.md`**
- Three-tier smart matching (Tier 1, 2, 3)
- Optional reason tracking
- Progressive learning integration
- Fuzzy matching with confidence scoring
- Full implementation details and API endpoints

**Step 4: Manual Master Product Matching** ✅ COMPLETE
- See comprehensive documentation in **`docs/STEP4_DESIGN.md`**
- Item-by-item matching interface
- Fuzzy search with confidence scoring
- Create new master product fallback
- Learning system integration with verified=true flag
- Complete API endpoint specifications

**Step 5: Final Summary & Confirmation** ✅ COMPLETE
- See comprehensive documentation in **`docs/STEP5_DESIGN.md`**
- Complete invoice summary with all metrics
- Category breakdown visualization
- Validation warnings for data quality
- One-click database save with transaction support
- Saves to: invoices, invoice_line_items, supplier_item_list, venue_ignored_items

---

## System Architecture

```
Frontend (React, port 3000)
    ↓
Step1_Upload.js
    ↓
POST /api/invoices/parse (CORS enabled)
    ↓
Backend (Express, port 3005)
    ↓
PDFParse: Extract text from PDF
    ↓
MainSupplierMatcher: Layer 1 - Keyword scan
    ↓
ParserRegistry: Layer 2 - Selective validation
    ↓
SupplierParser: Individual parser (e.g., BookerParser)
    ↓
Return standardized result
```

## File Structure

```
backend/
├── parsers/
│   ├── supplierParser.js        # Base class
│   ├── parserRegistry.js        # Parser factory + orchestration
│   ├── mainSupplierMatcher.js   # Layer 1: Fast keyword detection
│   └── bookerParser.js          # Booker-specific parser (stub)
├── routes/
│   └── invoices.js              # PDF upload endpoint
└── server.js                    # Registered at /api/invoices

frontend/
└── src/components/InvoiceWorkflow/
    ├── InvoiceWorkflow.js       # Container
    ├── Step1_Upload.js          # ✅ Complete
    ├── Step2_ReviewItems.js     # ⏳ Stub
    ├── Step3_IgnoreItems.js     # ⏳ Stub
    ├── Step4_MasterMatch.js     # ⏳ Stub
    └── Step5_Summary.js         # ⏳ Stub
```

## Testing

### Test Booker Detection
```bash
curl -X POST -F "file=@Booker-Invoice-3504502.pdf" \
  http://localhost:3005/api/invoices/parse | python -m json.tool
```
Expected: `"success": true, "name": "Booker Limited", "confidence": 70`

### Test Unknown Supplier Detection
```bash
curl -X POST -F "file=@TSIM2074.pdf" \
  http://localhost:3005/api/invoices/parse | python -m json.tool
```
Expected: `"success": false, "error": "Could not detect supplier from PDF"`

### Test via Frontend
1. Open http://localhost:3000/invoice-input
2. Drag-drop Booker invoice
3. Watch real-time detection
4. See supplier name and confidence

---

## How to Add a New Supplier (Manual - For Now)

1. **Create Parser Class**
   ```javascript
   // backend/parsers/supplierNameParser.js
   const SupplierParser = require('./supplierParser');
   
   class SupplierNameParser extends SupplierParser {
     constructor() {
       super({
         supplierId: 'UUID-from-database',
         name: 'Supplier Name',
         parserType: 'supplier-name',
         detectionKeywords: ['keyword1', 'keyword2'],
         detectionConfidenceThreshold: 70
       });
     }
     
     static detectSupplier(pdfText) {
       // Return { isMatch, confidence, notes }
     }
     
     async parse(pdfText) {
       // Return this.buildResult(true, {...})
     }
   }
   ```

2. **Register in ParserRegistry**
   ```javascript
   // backend/parsers/parserRegistry.js
   const SupplierNameParser = require('./supplierNameParser');
   
   constructor() {
     this.register('supplier-name', SupplierNameParser);
   }
   
   getParserKeyForSupplier(supplierName) {
     const nameToParserKey = {
       'Booker Limited': 'booker',
       'Supplier Name': 'supplier-name',  // Add this
     };
     return nameToParserKey[supplierName] || null;
   }
   ```

3. **Add to Database**
   ```sql
   INSERT INTO suppliers (sup_name, keywords, ...)
   VALUES ('Supplier Name', 'keyword1,keyword2,keyword3', ...);
   ```

4. **Restart Backend** - Changes auto-load via nodemon

---

## Known Issues & Limitations

1. **Booker Parser is a Stub**: Returns empty items (awaiting full implementation)
2. **Only Booker Configured**: No other suppliers in system yet
3. **No Recovery UI**: Unknown suppliers don't show helpful guidance
4. **Manual Setup**: Adding suppliers requires code changes (UI coming in Task 1)

---

**Last Updated**: October 26, 2025
**System Status**: Production-ready for Step 1 (Upload & Detection)
