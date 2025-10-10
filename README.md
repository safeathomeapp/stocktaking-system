# Stock Taking System v2.0.1

**Modern tablet-optimized stock-taking system for pubs and restaurants**

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
Maps supplier-specific product names and SKUs to master products for invoice OCR matching.

```sql
id                     serial         PRIMARY KEY
supplier_id            uuid          NOT NULL REFERENCES suppliers(sup_id)
master_product_id      uuid          REFERENCES master_products(id)
supplier_sku           varchar(100)  NOT NULL
supplier_name          varchar(255)  NOT NULL
supplier_description   text
supplier_brand         varchar(100)
supplier_category      varchar(100)
supplier_size          varchar(50)
supplier_barcode       varchar(100)
unit_cost              numeric(10,2)
case_cost              numeric(10,2)
pack_size              integer       DEFAULT 1
case_size              integer
minimum_order          integer       DEFAULT 1
auto_matched           boolean       DEFAULT false
verified               boolean       DEFAULT false
confidence_score       numeric(5,2)  DEFAULT 0
match_notes            text
last_cost_update       timestamp
last_ordered           timestamp
order_frequency_days   integer
active                 boolean       DEFAULT true
created_at             timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at             timestamp     DEFAULT CURRENT_TIMESTAMP
created_by             varchar(100)

CONSTRAINT unique_supplier_sku UNIQUE(supplier_id, supplier_sku)
```

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

venue_areas (1) --> (many) stock_entries

stock_sessions (1) --> (many) stock_entries

venue_products (1) --> (many) stock_entries
master_products (1) --> (many) venue_products
master_products (1) --> (many) supplier_item_list

suppliers (1) --> (many) supplier_item_list
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

## Stocktaking Workflow

### 1. Setup (One-Time)
1. Create venue with contact details and billing info
2. Add venue areas (Bar, Kitchen, Cellar, etc.) with drag-and-drop ordering
3. Products auto-populate when you start counting (linked from master_products)

### 2. Start New Session
1. Dashboard → "New Stock Take"
2. Select venue
3. Enter stocktaker name
4. Select area to count
5. Click "Start"

### 3. Count Products
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

### 4. Switch Areas
1. Click "Edit Products" to enable drag-and-drop reordering
2. Click "Select Area" dropdown
3. Choose next area
4. Repeat counting process

### 5. Complete Session
1. Review all counts
2. Click "Complete Session"
3. Session saved with timestamp
4. Appears in session history

### 6. Reopen Session (if needed)
1. Dashboard → Session History
2. Find session → Click "Reopen"
3. All products and areas load with previous counts
4. Can modify counts and save again

### 7. Key Behaviors
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

### October 10, 2025 - Product Management Enhancements
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

### 🎯 Future Enhancements
- [ ] Photo upload for products
- [ ] Advanced reporting and analytics
- [ ] Invoice processing (OCR)
- [ ] EPOS sales analysis and variance reporting
- [ ] Product usage tracking and alerts
- [ ] Multi-venue comparison reports

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
**Last Updated**: October 10, 2025
