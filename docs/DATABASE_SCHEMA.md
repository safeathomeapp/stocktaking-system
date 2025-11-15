# Database Schema Documentation

**Database**: PostgreSQL 17 (local)
**Version**: 2.0.1

---

## Core Tables

### VENUES
Primary table for venue information.

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

---

### VENUE_AREAS
Physical areas/zones within a venue (Bar, Kitchen, Cellar, Storage, etc.).

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

---

### VENUE_PRODUCTS
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

---

### STOCK_SESSIONS
Represents a single stock-taking session at a venue.

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

**Status values**: `in_progress`, `completed`

---

### STOCK_ENTRIES
Individual product counts during a stock session.

```sql
id              uuid           PRIMARY KEY
session_id      uuid          NOT NULL REFERENCES stock_sessions(id)
product_id      uuid          NOT NULL REFERENCES venue_products(id)
venue_area_id   integer       REFERENCES venue_areas(id)
quantity_units  decimal(10,2) DEFAULT 0.00 CHECK (quantity_units >= 0)
created_at      timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at      timestamp     DEFAULT CURRENT_TIMESTAMP
```

---

### MASTER_PRODUCTS
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

**Key Points**:
- `unit_size` is stored as INTEGER in milliliters (ml)
- Display automatically converts: ≤1000ml → "ml", 1001-9999ml → "cl", ≥10000ml → "L"
- Contains 570+ pre-populated products from comprehensive UK drinks catalog
- All venue products MUST link to a master product via `master_product_id`

---

### SUPPLIERS
Supplier company information for invoice tracking.

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

---

### SUPPLIER_ITEM_LIST
**Lean mapping table** - maps supplier SKUs to master products for invoice matching.

**Purpose**: Bridging/lookup table that helps match supplier invoice items to master products.

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

**Key Points**:
- **Minimal data** - only stores SKU and name mapping
- **NO pricing** - stored in `invoice_line_items`
- **NO product specs** - stored in `master_products` (case_size, unit_size, brand, etc.)
- **Purpose**: Fast lookup from "supplier SKU + name" → master_product_id
- Matching metadata (`auto_matched`, `confidence_score`) for quality tracking

---

### INVOICES
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

---

### INVOICE_LINE_ITEMS
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
pack_size               varchar(50)                                       -- Parsed pack size (e.g., "24")
unit_size               varchar(50)                                       -- Parsed unit size (e.g., "500ml")
created_at              timestamp      DEFAULT CURRENT_TIMESTAMP
updated_at              timestamp      DEFAULT CURRENT_TIMESTAMP
```

**Purpose**:
- Stores raw supplier product data (product_code, product_name) for reference
- Links to master_products via master_product_id for normalized reporting
- Links to supplier_item_list for auto-matching on future imports
- All variance calculations use master_product_id for consistency

---

### WASTAGE_RECORDS
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

---

### USER_PROFILES
User account and contact information.

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

---

## Table Relationships

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

---

## Key Constraints

- Foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate
- UUIDs generated using `uuid_generate_v4()` extension
- Decimal quantities rounded to 2 decimal places
- Non-negative quantity constraint on stock_entries

---

## Master Products Catalog

The system includes a comprehensive UK drinks catalog organized by:

### Spirit Categories (269 products)
- Gin, Vodka, Whisky, Rum, Tequila & Mezcal, Brandy & Cognac, Liqueurs

### Wine Categories (124 products)
- Red Wine, White Wine, Sparkling Wine, Fortified Wine

### Beer & Cider (83 products)
- Lager, Pale Ale, IPA, Stout, Cider

### Soft Drinks (67 products)
- Tonic Water, Ginger Beer, Cola, Juices, Energy Drinks, Water

### Snacks (27 products)
- Nuts, Crisps, Olives, Cheese, Charcuterie

**Total**: 570+ pre-populated master products

For complete product list, see `masterproducts.md`.
