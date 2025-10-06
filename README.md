# Stock Taking System v2.0.1

**Modern tablet-optimized stock-taking system for pubs and restaurants**

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
```sql
id                 uuid           PRIMARY KEY
venue_id           uuid          NOT NULL REFERENCES venues(id)
master_product_id  uuid          REFERENCES master_products(id)
name               varchar(255)  NOT NULL
created_at         timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at         timestamp     DEFAULT CURRENT_TIMESTAMP

UNIQUE(venue_id, master_product_id)
```

**Purpose**: Stores venue-specific product names (e.g., what a venue calls a product in their EPOS system).
All product specifications (brand, size, category, barcode) come from `master_products` via join.

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
Global product catalog for matching across venues.

```sql
id                     uuid           PRIMARY KEY
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

#### VOICE_RECOGNITION_LOG
Tracks voice recognition usage (planned feature).

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
selected_product_id       uuid          REFERENCES venue_products(id)
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

### Implemented
- Venue Management with structured addresses
- Venue Areas (Bar, Kitchen, Storage, etc.)
- Product catalog with master product linking
- Stock-taking sessions with status tracking
- Stock entries with decimal quantity support
- Responsive tablet-optimized UI
- Professional styled-components design

### In Development
- Voice recognition for stock counting
- Photo upload for products
- Advanced reporting and analytics
- Invoice processing (AWS Textract)

---

**Version**: 2.0.1
**Last Updated**: October 2, 2025
