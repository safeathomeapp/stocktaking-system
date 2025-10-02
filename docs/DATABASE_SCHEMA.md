# Database Schema Reference

**Version**: 2.0.1
**Database**: PostgreSQL
**Host**: Railway

---

## Core Tables

### VENUES
Stores venue information with structured addresses and billing details.

```sql
id                 uuid           PRIMARY KEY DEFAULT uuid_generate_v4()
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

### VENUE_AREAS
Defines areas within each venue (Bar, Kitchen, Storage, etc.).

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

**Indexes:**
- `idx_venue_areas_venue_id` ON venue_areas(venue_id)

### PRODUCTS
Product catalog with optional master product linking.

```sql
id                 uuid           PRIMARY KEY DEFAULT uuid_generate_v4()
venue_id           uuid          NOT NULL REFERENCES venues(id)
master_product_id  uuid          REFERENCES master_products(id)
name               varchar(255)  NOT NULL
category           varchar(100)
brand              varchar(100)
size               varchar(50)
unit_type          varchar(50)
barcode            varchar(100)
area_id            integer       REFERENCES venue_areas(id)
expected_count     integer       DEFAULT 0
local_name         varchar(255)
supplier           varchar(100)
cost_price         numeric
selling_price      numeric
local_notes        text
auto_matched       boolean       DEFAULT false
created_at         timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at         timestamp     DEFAULT CURRENT_TIMESTAMP
```

**Indexes:**
- `idx_products_venue_id` ON products(venue_id)
- `idx_products_master_product_id` ON products(master_product_id)
- `idx_products_area_id` ON products(area_id)

### STOCK_SESSIONS
Individual stock-taking sessions.

```sql
id               uuid           PRIMARY KEY DEFAULT uuid_generate_v4()
venue_id         uuid          NOT NULL REFERENCES venues(id)
session_date     date          NOT NULL DEFAULT CURRENT_DATE
stocktaker_name  varchar(255)  NOT NULL
status           varchar(50)   DEFAULT 'in_progress'
notes            text
created_at       timestamp     DEFAULT CURRENT_TIMESTAMP
completed_at     timestamp
updated_at       timestamp     DEFAULT CURRENT_TIMESTAMP
```

**Status Values:**
- `in_progress` - Session is active
- `completed` - Session is finalized

**Indexes:**
- `idx_stock_sessions_venue_id` ON stock_sessions(venue_id)
- `idx_stock_sessions_status` ON stock_sessions(status)

### STOCK_ENTRIES
Individual product counts within a session.

```sql
id              uuid           PRIMARY KEY DEFAULT uuid_generate_v4()
session_id      uuid          NOT NULL REFERENCES stock_sessions(id)
product_id      uuid          NOT NULL REFERENCES products(id)
venue_area_id   integer       REFERENCES venue_areas(id)
quantity_units  decimal(10,2) DEFAULT 0.00
created_at      timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at      timestamp     DEFAULT CURRENT_TIMESTAMP

CONSTRAINT chk_quantity_units_non_negative CHECK (quantity_units >= 0.00)
```

**Indexes:**
- `idx_stock_entries_session_id` ON stock_entries(session_id)
- `idx_stock_entries_product_id` ON stock_entries(product_id)
- `idx_stock_entries_venue_area_id` ON stock_entries(venue_area_id)

---

## Master Product System

### MASTER_PRODUCTS
Global product catalog for matching across venues.

```sql
id                     uuid           PRIMARY KEY DEFAULT uuid_generate_v4()
name                   varchar(255)  NOT NULL
brand                  varchar(100)
category               varchar(100)
subcategory            varchar(100)
master_category        varchar(50)
size                   varchar(50)
unit_type              varchar(50)
unit_size              varchar(100)
container_type         varchar(50)
container_size         varchar(50)
case_size              integer
alcohol_percentage     numeric
barcode                varchar(100)
ean_code               varchar(20)
upc_code               varchar(20)
sku                    varchar(100)
description            text
search_terms           text[]
phonetic_key           varchar(100)
normalized_name        varchar(255)
usage_count            integer       DEFAULT 0
success_rate           numeric       DEFAULT 0.0
last_used              timestamp
venues_seen            uuid[]
first_seen_venue       uuid
total_venues_count     integer       DEFAULT 1
verification_status    varchar(20)   DEFAULT 'unverified'
confidence_score       numeric       DEFAULT 50.0
suggested_retail_price numeric
currency               varchar(3)    DEFAULT 'GBP'
active                 boolean       DEFAULT true
created_at             timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at             timestamp     DEFAULT CURRENT_TIMESTAMP
created_by             varchar(100)
```

**Indexes:**
- `idx_master_products_name` ON master_products(name)
- `idx_master_products_barcode` ON master_products(barcode)
- `idx_master_products_category` ON master_products(category)

### PRODUCT_ALIASES
Alternative names for master products.

```sql
id                 integer        PRIMARY KEY AUTO_INCREMENT
master_product_id  uuid          NOT NULL REFERENCES master_products(id)
venue_id           uuid          REFERENCES venues(id)
alias_name         varchar(255)  NOT NULL
alias_type         varchar(50)
usage_frequency    integer       DEFAULT 1
created_at         timestamp     DEFAULT CURRENT_TIMESTAMP
created_by         varchar(100)
```

**Indexes:**
- `idx_product_aliases_master_product_id` ON product_aliases(master_product_id)
- `idx_product_aliases_alias_name` ON product_aliases(alias_name)

---

## Supporting Tables

### SUPPLIERS
Supplier information for products.

```sql
sup_id                uuid           PRIMARY KEY DEFAULT gen_random_uuid()
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

### USER_PROFILES
User information and preferences.

```sql
id                  uuid           PRIMARY KEY DEFAULT uuid_generate_v4()
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

### VOICE_RECOGNITION_LOG
Tracks voice recognition usage and accuracy (planned feature).

```sql
id                        integer        PRIMARY KEY AUTO_INCREMENT
session_id                uuid          REFERENCES stock_sessions(id)
user_identifier           varchar(100)
raw_audio_text            text          NOT NULL
processed_query           text
confidence_score          numeric
audio_quality             varchar(20)
search_strategy           varchar(50)
suggestions_returned      jsonb
total_suggestions         integer       DEFAULT 0
selected_product_id       uuid          REFERENCES products(id)
selection_rank            integer
user_selected             boolean       DEFAULT false
manual_entry              boolean       DEFAULT false
user_feedback             varchar(20)
processing_time_ms        integer
suggestion_accuracy       numeric
api_response_time_ms      integer
venue_id                  uuid          REFERENCES venues(id)
area_id                   integer       REFERENCES venue_areas(id)
time_of_day               time
background_noise_level    varchar(20)
created_at                timestamp     DEFAULT CURRENT_TIMESTAMP
```

---

## Relationships

### Primary Relationships
```
venues (1) --> (many) venue_areas
venues (1) --> (many) products
venues (1) --> (many) stock_sessions

venue_areas (1) --> (many) products
venue_areas (1) --> (many) stock_entries

stock_sessions (1) --> (many) stock_entries

products (1) --> (many) stock_entries
master_products (1) --> (many) products
master_products (1) --> (many) product_aliases
```

### Key Constraints
- All foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` appropriately
- UUIDs are generated using `uuid_generate_v4()` extension
- Timestamps auto-update on modifications where configured
- Decimal quantities rounded to 2 decimal places
- Non-negative quantity constraint on stock_entries

---

**Last Updated**: October 2, 2025
**Schema Version**: 2.0.1
