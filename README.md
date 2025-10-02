# Stock Taking System v2.0.1

**Modern tablet-optimized stock-taking system for pubs and restaurants**

A comprehensive React-based system for managing venue inventory with voice recognition, tablet optimization, and professional styled-components UI.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL (Railway-hosted)

### Frontend Setup
```bash
cd frontend
npm install
npm start
# Opens on http://localhost:3000
```

### Backend Setup
```bash
cd backend
npm install
npm start
# API runs on http://localhost:3005
```

## 🗄️ Database Schema

### Core Tables

#### VENUES
```
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
```
id             integer        PRIMARY KEY AUTO_INCREMENT
venue_id       uuid          NOT NULL REFERENCES venues(id)
name           varchar(255)  NOT NULL
display_order  integer       DEFAULT 1
description    text
photo          text
created_at     timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at     timestamp     DEFAULT CURRENT_TIMESTAMP
```

#### PRODUCTS
```
id                 uuid           PRIMARY KEY
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

#### STOCK_SESSIONS
```
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

#### STOCK_ENTRIES
```
id              uuid           PRIMARY KEY
session_id      uuid          NOT NULL REFERENCES stock_sessions(id)
product_id      uuid          NOT NULL REFERENCES products(id)
venue_area_id   integer       REFERENCES venue_areas(id)
quantity_units  decimal(10,2) DEFAULT 0.00 CHECK (quantity_units >= 0)
created_at      timestamp     DEFAULT CURRENT_TIMESTAMP
updated_at      timestamp     DEFAULT CURRENT_TIMESTAMP
```

#### MASTER_PRODUCTS
```
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

#### PRODUCT_ALIASES
```
id                 integer        PRIMARY KEY AUTO_INCREMENT
master_product_id  uuid          NOT NULL REFERENCES master_products(id)
venue_id           uuid          REFERENCES venues(id)
alias_name         varchar(255)  NOT NULL
alias_type         varchar(50)
usage_frequency    integer       DEFAULT 1
created_at         timestamp     DEFAULT CURRENT_TIMESTAMP
created_by         varchar(100)
```

## 🚀 Railway Deployment

### Deployment Workflow

After committing changes to git, deploy to Railway:

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

**Note**: Railway deployments must be forced manually using `railway up --service stocktaking-api --detach` after pushing to GitHub.

### Local Development

```bash
# Frontend (port 3000)
cd frontend && npm start

# Backend (port 3005)
cd backend && npm start
```

## 🌐 API Endpoints

**Core API** (Railway-hosted):
```
GET    /api/health                     # System health
GET    /api/venues                     # List venues
POST   /api/venues                     # Create venue
PUT    /api/venues/:id                 # Update venue
DELETE /api/venues/:id                 # Delete venue
GET    /api/venues/:id/products        # Venue products
GET    /api/venues/:id/areas           # Venue areas
POST   /api/venues/:id/areas           # Create area
PUT    /api/areas/:id                  # Update area
DELETE /api/areas/:id                  # Delete area
GET    /api/sessions                   # List sessions
POST   /api/sessions                   # Create session
GET    /api/sessions/:id               # Get session
PUT    /api/sessions/:id               # Update session
GET    /api/sessions/:id/entries       # Session entries
POST   /api/sessions/:id/entries       # Create entry
PUT    /api/entries/:id                # Update entry
```

## 📱 Features

### Implemented
- Venue Management with structured addresses
- Venue Areas (Bar, Kitchen, Storage, etc.)
- Product catalog with master product linking
- Stock-taking sessions
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
