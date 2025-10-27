# 🗄️ Database Documentation - Stock Taking System v2.0.1

**Last Updated**: October 27, 2025
**Database**: PostgreSQL 17
**Version**: 2.0.1
**Location**: Local (localhost:5432)

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Database Architecture](#database-architecture)
3. [Table Definitions](#table-definitions)
4. [Data Relationships](#data-relationships)
5. [Key Design Principles](#key-design-principles)
6. [Database Setup](#database-setup)
7. [Useful Queries](#useful-queries)

---

## System Overview

### Database Purpose

The Stock Taking System uses PostgreSQL to manage:
- **Venue & location data** (venues, areas, users)
- **Product catalog** (master products, supplier mappings)
- **Stock counts** (sessions, entries, historical data)
- **Supplier invoices** (invoices, line items, supplier items)
- **Sales & wastage** (EPOS records, wastage tracking)

### Core Principle: Master Products as Single Source of Truth

**Critical Design**: All product information comes from `master_products` ONLY.

- `master_products` = Single source of truth for ALL product specifications
- `venue_products` = Linkage table ONLY (maps master products to venues)
- `supplier_item_list` = Supplier-specific naming and SKU mapping

**Why This Matters**:
- Ensures consistency across all venues
- Eliminates duplicate/conflicting product data
- Simplifies updates (change once in master, applies everywhere)
- Enables accurate cross-venue reporting

---

## Database Architecture

### 15 Core Tables

```
CORE TABLES (5)
├── venues                 ← Venue locations
├── venue_areas           ← Areas within venues
├── master_products       ← Product catalog (single source of truth)
├── venue_products        ← Linkage: venues ↔ master_products
└── stock_sessions        ← Stocktaking sessions
    └── stock_entries     ← Individual product counts

SUPPLIER/INVOICE TABLES (5)
├── suppliers             ← Supplier details
├── supplier_item_list    ← SKU mapping (supplier → master_product)
├── invoices              ← Invoice headers
├── invoice_line_items    ← Invoice line items
└── wastage_records       ← Product breakage/spillage/expiry

EPOS TABLES (2)
├── epos_imports          ← Import sessions
└── epos_sales_records    ← Sales data

USER TABLES (1)
└── user_profiles         ← User contact information

CONFIGURATION (1)
└── venue_csv_preferences ← EPOS column mappings per venue
```

### Record Count Statistics (Current)

| Table | Records | Purpose |
|-------|---------|---------|
| venues | ~3-5 | Pub/restaurant locations |
| venue_areas | ~15-25 | Areas per venue (bar, cellar, etc.) |
| master_products | 1,379 | All available products |
| venue_products | ~200-500 | Venue-specific product links |
| stock_sessions | ~20-50 | Completed stocktakes |
| stock_entries | ~1000+ | Individual product counts |
| suppliers | ~10-20 | Supplier accounts |
| supplier_item_list | ~2000+ | Supplier SKU mappings |
| invoices | ~50-100 | Historical invoices |
| invoice_line_items | ~1000+ | Line items from invoices |
| epos_sales_records | ~5000+ | Sales transactions |
| wastage_records | ~50-200 | Breakage/spillage records |

---

## Table Definitions

### 1. VENUES

**Purpose**: Store venue (pub/restaurant) locations and contact information

```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    county VARCHAR(100),
    postcode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United Kingdom',
    phone VARCHAR(50),
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    billing_rate NUMERIC(10,2),
    billing_currency VARCHAR(10) DEFAULT 'GBP',
    billing_notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Key Fields**:
- `id`: Unique identifier (UUID)
- `name`: Venue name (e.g., "The Crown & Anchor")
- `address_*`: Full address components
- `contact_*`: Primary contact person
- `billing_*`: Rate and currency for invoicing

**Relationships**:
- 1 venue → Many venue_areas
- 1 venue → Many venue_products
- 1 venue → Many stock_sessions
- 1 venue → Many invoices

---

### 2. VENUE_AREAS

**Purpose**: Divide venue into operational areas (Bar, Cellar, Kitchen, Storage, etc.)

```sql
CREATE TABLE venue_areas (
    id SERIAL PRIMARY KEY,
    venue_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 1,
    description TEXT,
    photo TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Key Fields**:
- `id`: Integer primary key (unique within venue)
- `venue_id`: Foreign key to venues
- `name`: Area name (e.g., "Main Bar", "Back Cellar")
- `display_order`: Sort order for UI display
- `description`: Notes about the area
- `photo`: Path to area photo (optional)

**Relationships**:
- 1 venue_area → Many stock_entries (via venue_area_id)
- 1 venue_area → Many wastage_records

---

### 3. MASTER_PRODUCTS (Single Source of Truth)

**Purpose**: Canonical product database - every product spec stored once here

```sql
CREATE TABLE master_products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    unit_type VARCHAR(50) CHECK (unit_type IN ('bottle', 'can', 'keg',
                                   'case', 'pack', 'cask', 'bag-in-box')),
    unit_size INTEGER,  -- Size in ml
    case_size INTEGER,  -- Number of units per case
    barcode VARCHAR(100),
    ean_code VARCHAR(20),
    upc_code VARCHAR(20),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by_id UUID
);
```

**Key Fields**:
- `id`: Unique product identifier (UUID)
- `name`: Product name (e.g., "Heineken Lager")
- `brand`: Manufacturer/brand
- `category`: Major category (SPIRIT, WINE, BEER, SNACK, SOFT DRINK, etc.)
- `subcategory`: Sub-category (e.g., "Lager" under BEER)
- `unit_type`: Container type (bottle, can, keg, etc.)
- `unit_size`: Size of unit in ml (e.g., 500 for 500ml bottle)
- `case_size`: Number of units in standard case (e.g., 24)
- `barcode`: Product barcode for scanning
- `active`: Whether product is currently used

**Current Stock**: 1,379 products across 20+ categories

**Relationships**:
- 1 master_product → Many venue_products
- 1 master_product → Many invoice_line_items
- 1 master_product → Many supplier_item_list

---

### 4. VENUE_PRODUCTS (Linkage Table)

**Purpose**: Connect venues to master products (many-to-many relationship)

```sql
CREATE TABLE venue_products (
    id UUID PRIMARY KEY,
    venue_id UUID NOT NULL,
    master_product_id UUID NOT NULL,
    area_id INTEGER,
    name VARCHAR(255) NOT NULL,  -- Venue-specific name (e.g., EPOS system naming)
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT unique_venue_master_product UNIQUE(venue_id, master_product_id)
);
```

**Key Fields**:
- `id`: Unique identifier (UUID)
- `venue_id`: Foreign key to venues
- `master_product_id`: Foreign key to master_products
- `area_id`: Optional default area for the product
- `name`: Venue-specific product name (may differ from master name)

**Purpose**:
- Maps master products to specific venues (not all products sold at all venues)
- Allows venue-specific naming (e.g., EPOS system uses different names)
- Does NOT store product specifications (those come from master_products)

**Relationships**:
- 1 venue_product → Many stock_entries
- 1 venue_product → Many wastage_records
- 1 venue_product → Many epos_sales_records

---

### 5. STOCK_SESSIONS

**Purpose**: Track stocktaking sessions (when inventory was counted)

```sql
CREATE TABLE stock_sessions (
    id UUID PRIMARY KEY,
    venue_id UUID NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    stocktaker_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('in_progress', 'completed')),
    notes TEXT,
    created_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Key Fields**:
- `id`: Unique session identifier
- `venue_id`: Which venue was counted
- `session_date`: Date of stocktake
- `stocktaker_name`: Who counted the stock
- `status`: 'in_progress' or 'completed'
- `notes`: Any notes about the session
- `completed_at`: Timestamp when marked complete

**Relationships**:
- 1 session → Many stock_entries
- 1 session → Many wastage_records

---

### 6. STOCK_ENTRIES

**Purpose**: Individual product counts for a stocktaking session

```sql
CREATE TABLE stock_entries (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    product_id UUID NOT NULL,
    venue_area_id INTEGER,
    quantity_units NUMERIC(10,2) CHECK (quantity_units >= 0),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Key Fields**:
- `id`: Unique entry identifier
- `session_id`: Which stocktake session
- `product_id`: Foreign key to venue_products
- `venue_area_id`: Which area (bar, cellar, storage)
- `quantity_units`: Number counted

**Example Data**:
- Session "2025-10-27 Main Bar Count"
- Product "Heineken Lager 500ml"
- Area "Main Bar"
- Quantity: 24 units

**Relationships**:
- Via product_id → venue_products → master_products (to get product specs)

---

### 7. SUPPLIERS

**Purpose**: Store supplier/vendor information

```sql
CREATE TABLE suppliers (
    sup_id UUID PRIMARY KEY,
    sup_name VARCHAR(255) NOT NULL,
    sup_contact_person VARCHAR(255),
    sup_email VARCHAR(255),
    sup_phone VARCHAR(50),
    sup_address TEXT,
    sup_website VARCHAR(255),
    sup_account_number VARCHAR(100),
    sup_payment_terms VARCHAR(100),
    sup_delivery_days VARCHAR(100),
    sup_minimum_order NUMERIC(10,2),
    sup_active BOOLEAN DEFAULT true,
    sup_created_at TIMESTAMP,
    sup_updated_at TIMESTAMP
);
```

**Key Fields**:
- `sup_id`: Unique supplier ID
- `sup_name`: Company name (e.g., "Booker Ltd")
- `sup_contact_*`: Contact information
- `sup_payment_terms`: Payment terms (e.g., "Net 30")
- `sup_delivery_days`: Delivery frequency
- `sup_minimum_order`: Minimum order value

**Relationships**:
- 1 supplier → Many supplier_item_list
- 1 supplier → Many invoices

---

### 8. SUPPLIER_ITEM_LIST (Mapping Table)

**Purpose**: Map supplier SKUs to master products, learn from invoices

```sql
CREATE TABLE supplier_item_list (
    id SERIAL PRIMARY KEY,
    supplier_id UUID NOT NULL,
    master_product_id UUID,
    supplier_sku VARCHAR(100) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_description TEXT,
    auto_matched BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    confidence_score NUMERIC(5,2) DEFAULT 0,
    match_notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    CONSTRAINT unique_supplier_sku UNIQUE(supplier_id, supplier_sku)
);
```

**Key Fields**:
- `id`: Integer primary key
- `supplier_id`: Which supplier
- `master_product_id`: Links to master_products (can be NULL initially)
- `supplier_sku`: Supplier's product code (e.g., "184963" for Booker)
- `supplier_name`: Supplier's product name (may differ from master)
- `auto_matched`: Whether system auto-matched this
- `verified`: Whether user verified the match
- `confidence_score`: Match quality (0-100)

**Purpose**:
- Learning system: builds up knowledge of "Booker SKU 184963 = KP Salted Cashews"
- On next Booker invoice, same SKU auto-matches to known master product
- Speeds up invoice processing over time

**Relationships**:
- 1 supplier_item_list → 1 master_product (can be NULL)
- 1 supplier_item_list → Many invoice_line_items

---

### 9. INVOICES

**Purpose**: Track supplier invoices (what was purchased)

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    venue_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    invoice_date DATE NOT NULL,
    date_ordered DATE,
    date_delivered DATE,
    delivery_number VARCHAR(100),
    customer_ref VARCHAR(100),
    subtotal NUMERIC(10,2),
    vat_total NUMERIC(10,2),
    total_amount NUMERIC(10,2),
    currency VARCHAR(3) DEFAULT 'GBP',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    import_method VARCHAR(50),  -- 'ocr', 'csv', 'manual'
    import_metadata JSONB,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT unique_invoice_number_supplier UNIQUE(supplier_id, invoice_number)
);
```

**Key Fields**:
- `id`: Unique invoice ID
- `invoice_number`: Supplier's invoice number
- `venue_id`: Which venue received the goods
- `supplier_id`: Which supplier
- `invoice_date`: Date of invoice
- `total_amount`: Total purchase amount
- `payment_status`: 'unpaid', 'paid', 'partial'
- `import_method`: How data was imported ('ocr' from PDF, 'csv', 'manual')

**Relationships**:
- 1 invoice → Many invoice_line_items
- 1 invoice → 1 supplier
- 1 invoice → 1 venue

---

### 10. INVOICE_LINE_ITEMS

**Purpose**: Individual line items from invoice (raw supplier data)

```sql
CREATE TABLE invoice_line_items (
    id SERIAL PRIMARY KEY,
    invoice_id UUID NOT NULL,
    master_product_id UUID,
    supplier_item_list_id INTEGER,
    line_number INTEGER,
    product_code VARCHAR(100),  -- Raw supplier code
    product_name VARCHAR(255) NOT NULL,  -- Raw supplier name
    product_description TEXT,
    quantity NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(10,2),
    nett_price NUMERIC(10,2),
    vat_code VARCHAR(10),
    vat_rate NUMERIC(5,2),
    vat_amount NUMERIC(10,2),
    line_total NUMERIC(10,2),
    pack_size INTEGER,
    unit_size INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Key Fields**:
- `id`: Line item ID
- `invoice_id`: Which invoice
- `master_product_id`: Linked master product (nullable initially)
- `supplier_item_list_id`: Linked to supplier SKU mapping
- `product_code`: Raw supplier code (e.g., "184963")
- `product_name`: Raw supplier name (e.g., "KP SALTED CASHEWS CARDED")
- `quantity`: How many ordered
- `unit_price`: Cost per unit
- `line_total`: Total line cost
- `pack_size`: Units per pack (from OCR)
- `unit_size`: Size per unit (from OCR)

**Purpose**:
- Raw transaction record - never changes
- Preserves original supplier data
- Can re-match products later if needed
- Contains pricing information

**Data Flow**:
1. Imported from PDF/CSV with raw supplier data
2. Initially linked to supplier_item_list by SKU
3. Then linked to master_products (initially NULL)
4. User can manually verify/change links in Step 4

**Relationships**:
- Many line items → 1 invoice
- Line item → 1 master_product (via manual review)
- Line item → 1 supplier_item_list (via SKU match)

---

### 11. WASTAGE_RECORDS

**Purpose**: Track product losses (breakage, spillage, expiry, theft)

```sql
CREATE TABLE wastage_records (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    product_id UUID NOT NULL,
    venue_area_id INTEGER,
    quantity NUMERIC(10,2) NOT NULL,
    wastage_type VARCHAR(50) CHECK (wastage_type IN ('breakage', 'spillage', 'expired', 'other')),
    reason VARCHAR(255),
    notes TEXT,
    recorded_by VARCHAR(255),
    recorded_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Key Fields**:
- `id`: Unique record ID
- `session_id`: Which stocktake session
- `product_id`: Foreign key to venue_products
- `quantity`: How many units lost
- `wastage_type`: 'breakage', 'spillage', 'expired', 'other'
- `reason`: Why it was wasted
- `recorded_by`: Staff member who recorded it

**Purpose**:
- Track losses separately from inventory
- Used in variance calculations
- Identifies waste patterns

**Example**:
- Session: 2025-10-27
- Product: Heineken Lager 500ml
- Area: Main Bar
- Type: breakage
- Quantity: 3 bottles
- Reason: "Dropped case on delivery"

---

### 12. EPOS_IMPORTS

**Purpose**: Track EPOS sales data import sessions

```sql
CREATE TABLE epos_imports (
    id UUID PRIMARY KEY,
    venue_id UUID NOT NULL,
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_records INTEGER DEFAULT 0,
    imported_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP
);
```

**Key Fields**:
- `id`: Unique import session ID
- `venue_id`: Which venue
- `period_start` / `period_end`: Date range for sales data
- `total_records`: Number of sales records imported
- `imported_by`: Who did the import

**Relationships**:
- 1 import → Many epos_sales_records

---

### 13. EPOS_SALES_RECORDS

**Purpose**: Individual sales transactions from EPOS system

```sql
CREATE TABLE epos_sales_records (
    id UUID PRIMARY KEY,
    epos_import_id UUID NOT NULL,
    product_id UUID,
    product_name VARCHAR(255) NOT NULL,
    quantity_sold NUMERIC(10,2) NOT NULL,
    revenue NUMERIC(10,2),
    sale_date DATE,
    transaction_details JSONB,
    created_at TIMESTAMP
);
```

**Key Fields**:
- `id`: Unique sale record ID
- `epos_import_id`: Which import session
- `product_id`: Foreign key to venue_products
- `product_name`: Product sold (from EPOS)
- `quantity_sold`: Units sold
- `revenue`: Sales revenue
- `sale_date`: Date of sale
- `transaction_details`: JSON with extra details

**Purpose**:
- Track sales for variance calculation
- Linked to venue_products via product_id
- Used to calculate expected closing stock

---

### 14. VENUE_CSV_PREFERENCES

**Purpose**: Store column mapping preferences for EPOS CSV imports per venue

```sql
CREATE TABLE venue_csv_preferences (
    id SERIAL PRIMARY KEY,
    venue_id UUID NOT NULL,
    column_mappings JSONB NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT unique_venue_csv_prefs UNIQUE(venue_id)
);
```

**Key Fields**:
- `id`: Preference record ID
- `venue_id`: Which venue
- `column_mappings`: JSON object mapping CSV columns to fields
  ```json
  {
    "product_name": "Product",
    "quantity": "Qty",
    "price": "Unit Price",
    "category": "Department"
  }
  ```

**Purpose**:
- Remember user's CSV column choices
- Don't require re-mapping on each import

---

### 15. USER_PROFILES

**Purpose**: Store staff member contact information

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    county VARCHAR(100),
    postcode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United Kingdom',
    mobile_phone VARCHAR(20),
    home_phone VARCHAR(20),
    work_phone VARCHAR(20),
    whatsapp_number VARCHAR(20),
    primary_email VARCHAR(255),
    work_email VARCHAR(255),
    personal_email VARCHAR(255),
    facebook_handle VARCHAR(100),
    instagram_handle VARCHAR(100),
    twitter_handle VARCHAR(100),
    linkedin_handle VARCHAR(100),
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Europe/London',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    currency VARCHAR(3) DEFAULT 'GBP',
    active BOOLEAN DEFAULT true,
    profile_complete BOOLEAN DEFAULT false,
    share_phone BOOLEAN DEFAULT false,
    share_email BOOLEAN DEFAULT false,
    share_social_media BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP,
    notes TEXT
);
```

**Purpose**:
- Store staff contact information
- Support multiple contact methods
- Track preferences and settings

---

## Data Relationships

### Invoice Processing Data Flow

```
┌─────────────────────┐
│ invoice_line_items  │ ← Transaction records (what was purchased)
│  - Raw supplier data│
│  - Pricing data     │
└──────┬──────────────┘
       │ Links to ↓ (supplier_item_list_id)
┌──────▼──────────────┐
│ supplier_item_list  │ ← Mapping table (how to find it)
│  - SKU → Product    │
│  - Naming variations│
└──────┬──────────────┘
       │ Links to ↓ (master_product_id)
┌──────▼──────────────┐
│ master_products     │ ← Product catalog (what it is)
│  - Specifications   │
│  - Case size, brand │
└─────────────────────┘
```

### Stock Counting Data Flow

```
stock_sessions (one stocktake event)
    ├── stock_entries (what was counted)
    │   └── venue_products (which products)
    │       └── master_products (product specs)
    └── wastage_records (what was lost)
        └── venue_products (which products)
            └── master_products (product specs)
```

### Variance Calculation

```
Expected Closing Stock = Opening Stock + Purchases - Sales - Wastage

Where:
- Opening Stock = previous session's stock_entries (by master_product_id)
- Purchases = sum of invoice_line_items quantities (by master_product_id)
- Sales = sum of epos_sales_records quantities (by master_product_id)
- Wastage = sum of wastage_records quantities (by master_product_id)
- Actual = current session's stock_entries (by master_product_id)

Variance = Actual - Expected
```

### Complete Entity Relationships

```
venues (1)
├── (many) venue_areas
├── (many) venue_products
├── (many) stock_sessions
│   ├── (many) stock_entries
│   │   └── venue_products → master_products
│   └── (many) wastage_records
│       └── venue_products → master_products
├── (many) invoices
│   └── (many) invoice_line_items
│       ├── master_products
│       └── supplier_item_list
└── (many) epos_imports
    └── (many) epos_sales_records
        └── venue_products → master_products

suppliers (1)
├── (many) supplier_item_list
│   └── master_products
└── (many) invoices
    └── (many) invoice_line_items

master_products (1)
├── (many) venue_products
├── (many) supplier_item_list
└── (many) invoice_line_items

user_profiles
└── Independent (no foreign keys)
```

---

## Key Design Principles

### 1. Master Products as Single Source of Truth

**Rule**: All product information comes from `master_products` ONLY.

- `master_products` stores: name, brand, category, unit_type, unit_size, case_size, barcode
- `venue_products` stores: ONLY venue-specific name and area preference
- `supplier_item_list` stores: ONLY supplier-specific SKU and naming variations

**Benefit**: Update once in master, applies everywhere across all venues and suppliers

### 2. Separation of Concerns

**Invoices**:
- `invoice_line_items` = Financial/transactional (stores actual purchase with pricing)
- `supplier_item_list` = Operational lookup (maps supplier SKU → master product)
- `master_products` = Product reference (canonical product specifications)

**Advantage**:
- Change product specs without affecting invoice history
- Re-match products later if needed
- Preserve accurate pricing information

### 3. Linkage Tables Only

**Why separate venue_products**?
- Not all products are sold at all venues
- Different venues may have different areas
- Allows venue-specific naming (e.g., EPOS uses different names)

**venue_products does NOT contain**:
- Unit size, case size, brand (use master_products)
- Stock levels (use stock_entries)
- Supplier information (use supplier_item_list)

### 4. Nullable Foreign Keys for Flexibility

- `invoice_line_items.master_product_id` is NULL initially
- Gets populated during Step 4 manual review
- `supplier_item_list.master_product_id` is NULL until matched
- Allows gradual matching without blocking invoice creation

### 5. Unique Constraints for Data Integrity

```sql
venue_products: UNIQUE(venue_id, master_product_id)
    -- One venue can't have same product twice

supplier_item_list: UNIQUE(supplier_id, supplier_sku)
    -- One supplier can't have duplicate SKUs

invoices: UNIQUE(supplier_id, invoice_number)
    -- Each supplier's invoice numbers are unique

venue_csv_preferences: UNIQUE(venue_id)
    -- One preference record per venue
```

### 6. Check Constraints for Valid Values

```sql
unit_type: CHECK (unit_type IN ('bottle', 'can', 'keg', 'case', 'pack', 'cask', 'bag-in-box'))
    -- Only allow valid container types

status: CHECK (status IN ('in_progress', 'completed'))
    -- Only valid session statuses

wastage_type: CHECK (wastage_type IN ('breakage', 'spillage', 'expired', 'other'))
    -- Valid wastage types

quantity_units: CHECK (quantity_units >= 0)
    -- Can't have negative stock
```

---

## Database Setup

### Connection Details

```
Host: localhost
Port: 5432
Database: stocktaking_local
User: postgres
Password: (empty - trust auth)
```

### Environment Configuration

File: `backend/.env`

```
DATABASE_URL=postgresql://postgres:@localhost:5432/stocktaking_local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stocktaking_local
DB_USER=postgres
DB_PASS=
```

### Schema Application

```bash
# Apply schema to existing database
psql -U postgres -d stocktaking_local -f backend/schema.sql

# Or create database first
createdb -U postgres stocktaking_local
psql -U postgres -d stocktaking_local -f backend/schema.sql
```

### Extensions Used

```sql
CREATE EXTENSION "uuid-ossp";           -- UUID generation
CREATE EXTENSION pg_trgm;               -- Fuzzy string matching (similarity)
```

---

## Useful Queries

### 1. Get All Products at a Venue

```sql
SELECT
    mp.name,
    mp.brand,
    mp.category,
    mp.unit_size,
    mp.case_size,
    vp.name as venue_specific_name
FROM venue_products vp
JOIN master_products mp ON vp.master_product_id = mp.id
WHERE vp.venue_id = 'venue-uuid-here'
ORDER BY mp.category, mp.name;
```

### 2. Latest Stock Count for a Venue

```sql
SELECT
    ss.id,
    ss.session_date,
    ss.stocktaker_name,
    COUNT(*) as product_count,
    COUNT(CASE WHEN se.quantity_units > 0 THEN 1 END) as products_counted
FROM stock_sessions ss
LEFT JOIN stock_entries se ON ss.id = se.session_id
WHERE ss.venue_id = 'venue-uuid-here'
GROUP BY ss.id
ORDER BY ss.session_date DESC
LIMIT 1;
```

### 3. Get Invoices by Supplier

```sql
SELECT
    i.invoice_number,
    i.invoice_date,
    i.total_amount,
    i.payment_status,
    COUNT(ili.id) as line_item_count
FROM invoices i
LEFT JOIN invoice_line_items ili ON i.id = ili.invoice_id
WHERE i.supplier_id = 'supplier-uuid-here'
GROUP BY i.id
ORDER BY i.invoice_date DESC;
```

### 4. Find Products Without Master Match (Unmatched Items)

```sql
SELECT DISTINCT
    ili.product_code,
    ili.product_name,
    ili.id,
    COUNT(*) as times_imported
FROM invoice_line_items ili
WHERE ili.master_product_id IS NULL
GROUP BY ili.product_code, ili.product_name, ili.id
ORDER BY times_imported DESC;
```

### 5. Calculate Stock Variance for Latest Session

```sql
WITH latest_session AS (
    SELECT id, session_date
    FROM stock_sessions
    WHERE venue_id = 'venue-uuid-here'
    ORDER BY session_date DESC
    LIMIT 1
),
current_count AS (
    SELECT
        se.product_id,
        mp.name,
        mp.category,
        SUM(se.quantity_units) as actual_quantity
    FROM stock_entries se
    JOIN latest_session ls ON se.session_id = ls.id
    JOIN venue_products vp ON se.product_id = vp.id
    JOIN master_products mp ON vp.master_product_id = mp.id
    GROUP BY se.product_id, mp.name, mp.category
)
SELECT
    name,
    category,
    actual_quantity,
    actual_quantity as current_stock
FROM current_count
ORDER BY category, name;
```

### 6. Sales by Category (Recent)

```sql
SELECT
    mp.category,
    SUM(esr.quantity_sold) as total_sold,
    SUM(esr.revenue) as total_revenue,
    esr.sale_date
FROM epos_sales_records esr
JOIN venue_products vp ON esr.product_id = vp.id
JOIN master_products mp ON vp.master_product_id = mp.id
WHERE esr.sale_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY mp.category, esr.sale_date
ORDER BY esr.sale_date DESC, total_revenue DESC;
```

### 7. Check Database Connectivity

```sql
SELECT
    'Connected' as status,
    NOW() as server_time,
    current_database() as database,
    current_user as user;
```

### 8. Table Record Counts

```sql
SELECT
    'venues' as table_name, COUNT(*) as count FROM venues
UNION ALL
SELECT 'venue_areas', COUNT(*) FROM venue_areas
UNION ALL
SELECT 'master_products', COUNT(*) FROM master_products
UNION ALL
SELECT 'venue_products', COUNT(*) FROM venue_products
UNION ALL
SELECT 'stock_sessions', COUNT(*) FROM stock_sessions
UNION ALL
SELECT 'stock_entries', COUNT(*) FROM stock_entries
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'supplier_item_list', COUNT(*) FROM supplier_item_list
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'invoice_line_items', COUNT(*) FROM invoice_line_items
UNION ALL
SELECT 'wastage_records', COUNT(*) FROM wastage_records
UNION ALL
SELECT 'epos_imports', COUNT(*) FROM epos_imports
UNION ALL
SELECT 'epos_sales_records', COUNT(*) FROM epos_sales_records
UNION ALL
SELECT 'venue_csv_preferences', COUNT(*) FROM venue_csv_preferences
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
ORDER BY table_name;
```

---

## Next Steps

- Use the **Database Inspector** tool at `http://localhost:3000/database` to explore tables
- Refer to README.md for business logic documentation
- Check masterproducts.md for complete product catalog
- Run queries above using PostgreSQL CLI or database client

---

**Version**: 2.0.1
**Last Updated**: October 27, 2025
**Database**: PostgreSQL 17 (localhost)
