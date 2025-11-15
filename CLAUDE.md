# CLAUDE.md - AI Assistant Guide

**Version**: 2.0.1
**Last Updated**: November 15, 2025
**Purpose**: Comprehensive guide for AI assistants working with this codebase

---

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Directory Structure](#directory-structure)
5. [Database Schema & Conventions](#database-schema--conventions)
6. [Development Workflow](#development-workflow)
7. [Key Design Principles](#key-design-principles)
8. [Common Tasks for AI Assistants](#common-tasks-for-ai-assistants)
9. [Code Conventions](#code-conventions)
10. [Testing & Debugging](#testing--debugging)
11. [Important Files to Reference](#important-files-to-reference)
12. [Gotchas & Anti-patterns](#gotchas--anti-patterns)

---

## Repository Overview

### What is This System?

A modern, tablet-optimized stock-taking system designed for pubs and restaurants. It provides:

- **Stock Management**: Track inventory across multiple venue areas
- **Invoice Processing**: Auto-parse supplier PDFs (Booker, Tolchards) with OCR
- **Variance Reporting**: Calculate expected vs. actual stock
- **EPOS Integration**: Import sales data from point-of-sale systems
- **Master Product Catalog**: 570+ pre-populated UK drinks products
- **Session Management**: Track stock-taking sessions with history

### Current State (November 2025)

- ✅ Fully operational localhost application (no cloud dependencies)
- ✅ PostgreSQL 17 local database
- ✅ Node.js/Express backend (port 3005)
- ✅ React frontend (port 3000)
- ✅ 1,379+ active products in master catalog
- ✅ 2 supplier PDF parsers (Booker, Tolchards)
- ✅ Comprehensive documentation structure

---

## System Architecture

### Architecture Overview

```
┌─────────────────────────────────────────┐
│  Frontend (React)                       │
│  Port: 3000                             │
│  - Tablet-optimized UI                  │
│  - Real-time stock entry                │
│  - Invoice import wizard                │
└──────────────┬──────────────────────────┘
               │ HTTP REST API
┌──────────────▼──────────────────────────┐
│  Backend (Node.js/Express)              │
│  Port: 3005                             │
│  - REST API endpoints                   │
│  - PDF parsing (pdf-parse)              │
│  - Business logic                       │
└──────────────┬──────────────────────────┘
               │ PostgreSQL Driver
┌──────────────▼──────────────────────────┐
│  Database (PostgreSQL 17)               │
│  - 15 core tables                       │
│  - Master products catalog              │
│  - Transaction history                  │
└─────────────────────────────────────────┘
```

### Key Architecture Principles

1. **Fully Self-Contained**: No internet required, runs 100% on localhost
2. **Single Source of Truth**: Master products catalog drives all product data
3. **3-Table Invoice Design**: Separates transactions, mappings, and product specs
4. **Lean Data Model**: No duplication, efficient joins
5. **Extensible Parsers**: Plugin architecture for adding new suppliers

---

## Technology Stack

### Backend

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database Client**: pg (node-postgres)
- **PDF Parsing**: pdf-parse
- **File Upload**: multer
- **Security**: helmet, cors
- **Logging**: morgan
- **Environment**: dotenv

### Frontend

- **Framework**: React 18
- **Styling**: styled-components
- **HTTP Client**: fetch (native)
- **Build Tool**: Create React App
- **Hot Reload**: Webpack Dev Server

### Database

- **RDBMS**: PostgreSQL 17
- **ORM**: None (raw SQL queries)
- **Migration Strategy**: SQL migration files in `backend/migrations/`
- **Schema File**: `backend/schema.sql` (single source of truth)

### Development Tools

- **Backend Auto-Restart**: nodemon (`npm run dev`)
- **Frontend Hot Reload**: React Dev Server (`npm start`)
- **Version Control**: Git
- **Package Manager**: npm

---

## Directory Structure

```
stocktaking-system/
│
├── backend/                      # Node.js/Express backend
│   ├── server.js                 # Main server (4,716 lines) - ALL routes
│   ├── schema.sql                # Database schema (15 tables)
│   ├── .env                      # Local database config
│   │
│   ├── src/
│   │   └── database.js           # PostgreSQL connection pool
│   │
│   ├── config/
│   │   └── database.js           # Database configuration
│   │
│   ├── parsers/                  # Invoice PDF parsers
│   │   ├── supplierParser.js     # Base class (abstract)
│   │   ├── bookerParser.js       # Booker Limited parser
│   │   ├── tolchardsParser.js    # Tolchards Ltd parser
│   │   ├── parserRegistry.js     # Parser factory & registry
│   │   └── mainSupplierMatcher.js # Fast keyword detection
│   │
│   ├── routes/
│   │   └── invoices.js           # Invoice-specific routes
│   │
│   ├── utils/
│   │   ├── pdfParser.js          # PDF text extraction
│   │   └── ocrParser.js          # OCR utilities
│   │
│   └── migrations/               # Database migration scripts
│       ├── create-*.js           # Table creation scripts
│       ├── add-*.js              # Column addition scripts
│       └── *.sql                 # SQL migration files
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── App.js                # Main app (routing)
│   │   │
│   │   ├── components/           # ALL active React components
│   │   │   ├── Dashboard.js
│   │   │   ├── VenueManagement.js
│   │   │   ├── StockTaking.js
│   │   │   ├── SessionHistory.js
│   │   │   ├── AreaSetup.js
│   │   │   ├── Analysis.js
│   │   │   ├── InvoiceImport.js
│   │   │   ├── MasterProductMatcher.js
│   │   │   ├── EposCsvInput.js
│   │   │   └── InvoiceWorkflow/   # 5-step wizard
│   │   │       ├── InvoiceWorkflow.js
│   │   │       ├── Step1_Upload.js
│   │   │       ├── Step2_ReviewItems.js
│   │   │       ├── Step3_IgnoreItems.js
│   │   │       ├── Step4_MasterMatch.js
│   │   │       └── Step5_Summary.js
│   │   │
│   │   ├── services/
│   │   │   └── apiService.js     # API client (fetch wrapper)
│   │   │
│   │   ├── config/
│   │   │   ├── api.js            # API base URL
│   │   │   └── matchingConfig.js # Fuzzy matching settings
│   │   │
│   │   ├── utils/
│   │   │   └── helpers.js        # Utility functions
│   │   │
│   │   ├── styles/
│   │   │   ├── GlobalStyles.js   # Global CSS
│   │   │   ├── theme/            # Theme configuration
│   │   │   └── components/
│   │   │       └── Button.js     # Styled button component
│   │   │
│   │   └── _archived/            # Archived unused files
│   │
│   └── public/                   # Static assets
│
├── docs/                         # Comprehensive documentation
│   ├── GETTING_STARTED.md        # Setup & installation
│   ├── DEVELOPMENT.md            # Dev workflow & practices
│   ├── ARCHITECTURE.md           # System design principles
│   ├── DATABASE_SCHEMA.md        # Complete schema reference
│   ├── API_ENDPOINTS.md          # API reference
│   ├── WORKFLOW.md               # Stock-taking workflow
│   ├── PARSERS.md                # Invoice parser docs
│   └── products/                 # Product catalog files
│       ├── INDEX.md              # Category index
│       └── products-*.md         # 18 category files
│
├── invoices/                     # Sample/test invoice PDFs
│
├── README.md                     # Main documentation index
├── CLAUDE.md                     # This file (AI assistant guide)
├── package.json                  # Root package.json
│
└── Session Documentation Files   # Development history
    ├── SESSION_NOTES_2025-11-01.md
    ├── SESSION_NOTES_2025-10-22.md
    ├── SESSION_HANDOFF_2025-10-21.md
    └── claudeprompt.md           # Session continuation prompt
```

---

## Database Schema & Conventions

### Core Tables (15 Total)

#### Master Data Tables

1. **`venues`** - Pub/restaurant locations (UUID primary key)
2. **`venue_areas`** - Physical zones (Bar, Kitchen, Cellar, etc.)
3. **`master_products`** - **SINGLE SOURCE OF TRUTH** for product specs
4. **`suppliers`** - Supplier company information
5. **`user_profiles`** - User accounts and preferences

#### Linkage & Transaction Tables

6. **`venue_products`** - Links venues to master products (UUID primary key)
7. **`stock_sessions`** - Stock-taking sessions (UUID primary key)
8. **`stock_entries`** - Individual product counts per session
9. **`supplier_item_list`** - SKU → master_product mappings
10. **`invoices`** - Purchase invoice headers
11. **`invoice_line_items`** - Invoice detail lines
12. **`wastage_records`** - Breakages and losses
13. **`epos_imports`** - EPOS CSV upload metadata
14. **`epos_sales_records`** - Individual sales line items
15. **`venue_csv_preferences`** - Saved EPOS column mappings

### Critical Database Conventions

#### 1. Master Products = Single Source of Truth

```sql
-- ✅ CORRECT: Always JOIN to master_products
SELECT
  vp.id,
  mp.name,          -- From master_products
  mp.brand,         -- From master_products
  mp.unit_size,     -- From master_products
  mp.unit_type,     -- From master_products
  mp.case_size,     -- From master_products
  mp.category       -- From master_products
FROM venue_products vp
LEFT JOIN master_products mp ON vp.master_product_id = mp.id
WHERE vp.venue_id = $1;

-- ❌ WRONG: venue_products doesn't have these fields
SELECT
  vp.name,
  vp.brand,         -- ❌ Doesn't exist
  vp.unit_size      -- ❌ Doesn't exist
FROM venue_products vp;
```

**Why?**
- Prevents data duplication
- Ensures consistency across venues
- Simplifies updates (change once in master, applies everywhere)
- Enables accurate cross-venue reporting

#### 2. Venue Products = Linkage ONLY

`venue_products` stores:
- ✅ `venue_id` - Which venue
- ✅ `master_product_id` - Which master product
- ✅ `area_id` - Default area (optional)
- ✅ `name` - Venue-specific name (e.g., EPOS system naming)

`venue_products` does NOT store:
- ❌ Brand, category, unit_size, case_size, barcode
- ❌ Pricing information
- ❌ Product specifications

#### 3. 3-Table Invoice Architecture

```
┌─────────────────────┐
│ invoice_line_items  │ ← Transaction records (what was purchased)
│  - Raw supplier data│   - product_code, product_name (raw from PDF)
│  - Pricing data     │   - quantity, unit_price, line_total
│  - Links below ↓    │   - supplier_item_list_id, master_product_id
└─────────────────────┘
         ↓
┌─────────────────────┐
│ supplier_item_list  │ ← Mapping table (SKU → master product)
│  - Supplier SKU     │   - supplier_id, supplier_sku
│  - Supplier name    │   - supplier_name
│  - Links below ↓    │   - master_product_id
└─────────────────────┘
         ↓
┌─────────────────────┐
│ master_products     │ ← Product catalog (specifications)
│  - Name, brand      │   - unit_size, unit_type, case_size
│  - Category         │   - barcode, active
└─────────────────────┘
```

**Why 3 Tables?**
1. **Historical accuracy**: Invoice line items preserve raw supplier data
2. **Improved matching**: Supplier item list learns over time
3. **Normalized design**: Product specs only stored once

#### 4. Unit Size Storage

- **Storage Format**: INTEGER in milliliters (ml)
- **Display Format**: Auto-converts based on size
  - ≤1000ml → display as "ml" (e.g., 500ml)
  - 1001-9999ml → display as "cl" (e.g., 75cl)
  - ≥10000ml → display as "L" (e.g., 30L)

```sql
-- Store 750ml bottle
INSERT INTO master_products (unit_size, unit_type)
VALUES (750, 'bottle');

-- Display: "Bottle • 75cl"
```

#### 5. Foreign Key Relationships

```
venues (1) ──┬─→ (many) venue_areas
             ├─→ (many) venue_products
             ├─→ (many) stock_sessions
             └─→ (many) invoices

master_products (1) ──┬─→ (many) venue_products
                      ├─→ (many) supplier_item_list
                      └─→ (many) invoice_line_items

stock_sessions (1) ──→ (many) stock_entries
venue_products (1) ──→ (many) stock_entries
```

---

## Development Workflow

### Starting the Development Environment

#### 1. Ensure PostgreSQL is Running

```bash
# Check Windows Services: postgresql-x64-17 should be "Running"
# Or check with psql:
psql -U postgres -l
```

#### 2. Start Backend (with nodemon auto-restart)

```bash
cd backend
npm run dev
# Backend runs on http://localhost:3005
# Nodemon watches for file changes and auto-restarts
```

**Important**:
- ✅ Use `npm run dev` (NOT `npm start`)
- ✅ Let nodemon handle restarts (DON'T kill node processes)
- ✅ File changes trigger automatic restart

#### 3. Start Frontend (in separate terminal)

```bash
cd frontend
npm start
# Frontend runs on http://localhost:3000
# Opens browser automatically
# Hot-reloads on file changes
```

#### 4. Verify Health

```bash
# Check backend
curl http://localhost:3005/api/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "version": "2.0.1",
  ...
}
```

### Making Changes

#### Backend Changes

1. Edit files in `backend/`
2. Save file → nodemon auto-restarts server
3. Test changes via frontend or curl

**If backend seems stuck**:
- DON'T kill node processes
- Modify a backend file (add/remove comment) to trigger nodemon
- Or press `Ctrl+C` in terminal and restart `npm run dev`

#### Frontend Changes

1. Edit files in `frontend/src/`
2. Save file → React dev server hot-reloads
3. Changes appear instantly in browser

#### Database Changes

**Schema Changes**:
1. Update `backend/schema.sql` (single source of truth)
2. Create migration file in `backend/migrations/`
3. Run migration via psql or node script

**Data Changes**:
```bash
# Connect to database
psql -U postgres -d stocktaking_local

# Run queries
SELECT * FROM master_products WHERE active = true;

# Exit
\q
```

### Git Workflow

```bash
# Check status
git status

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: Add supplier XYZ parser"

# Push to remote
git push origin your-branch-name
```

**Commit Message Conventions**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks

---

## Key Design Principles

### 1. Keep Solutions Simple and Direct

❌ **DON'T**: Create complex tracking systems for simple operations

```javascript
// ❌ WRONG: User wants to remove product from session
// Creating session_excluded_products table, tracking exclusions, filtering on load

// ✅ RIGHT: Just delete from stock_entries
DELETE FROM stock_entries
WHERE session_id = $1 AND product_id = $2;
```

**Principle**: If something can be accomplished with a single DELETE/UPDATE/INSERT, do that. Avoid creating new tables unless absolutely necessary for data persistence.

### 2. Always Link to Master Products

❌ **DON'T**: Duplicate product information

```javascript
// ❌ WRONG: Duplicating master product data in venue_products
await pool.query(
  'INSERT INTO venue_products (name, brand, unit_size, category) VALUES ($1, $2, $3, $4)',
  [name, brand, unitSize, category]  // These belong in master_products only
);
```

✅ **DO**: Link to master products

```javascript
// ✅ CORRECT: Just link to master product
await pool.query(
  'INSERT INTO venue_products (venue_id, master_product_id, name) VALUES ($1, $2, $3)',
  [venueId, masterProductId, venueName]  // venueName is venue-specific, rest from master
);
```

### 3. Session-Specific Operations Modify Session Data

For session-specific changes (like removing a product from current count):
- ✅ Modify `stock_entries` (session-specific data)
- ❌ Don't create parallel tracking systems
- ❌ Don't modify `venue_products` (affects future sessions)

### 4. Clarify Persistence Requirements

When user says "remove product from counting":
- Ask: "Should this persist across sessions?"
- Don't automatically build complex solutions for implied requirements
- Implement exactly what was requested
- If persistence is needed later, user will specify explicitly

### 5. Master Products Drive Everything

All queries involving product data should:
1. Start with the appropriate table (`venue_products`, `stock_entries`, etc.)
2. JOIN to `master_products` via `master_product_id`
3. Pull specifications from `master_products` ONLY

---

## Common Tasks for AI Assistants

### Task 1: Add New Product to Master Catalog

```sql
-- Check for duplicates first
SELECT * FROM master_products
WHERE LOWER(name) LIKE '%product name%'
  AND brand = 'Brand Name';

-- If no duplicates, insert
INSERT INTO master_products (
  id,
  name,
  brand,
  category,
  subcategory,
  unit_type,
  unit_size,
  case_size,
  barcode,
  active
) VALUES (
  uuid_generate_v4(),
  'Product Name',
  'Brand Name',
  'Category',
  'Subcategory',
  'bottle',        -- or 'can', 'keg', 'case', 'pack', 'cask', 'bag-in-box'
  750,             -- ml (integer)
  12,              -- units per case
  '5012345678901', -- barcode (optional)
  true
);
```

### Task 2: Query Products for a Venue

```sql
-- ✅ CORRECT: With master_products JOIN
SELECT
  vp.id,
  vp.venue_id,
  vp.name as venue_name,        -- Venue-specific name
  mp.name as product_name,       -- Master product name
  mp.brand,
  mp.unit_size,
  mp.unit_type,
  mp.case_size,
  mp.category,
  mp.subcategory,
  va.name as area_name
FROM venue_products vp
LEFT JOIN master_products mp ON vp.master_product_id = mp.id
LEFT JOIN venue_areas va ON vp.area_id = va.id
WHERE vp.venue_id = $1
  AND mp.active = true
ORDER BY mp.name;
```

### Task 3: Create Stock-Taking Session

```sql
-- 1. Create session
INSERT INTO stock_sessions (
  id,
  venue_id,
  session_date,
  stocktaker_name,
  status,
  notes
) VALUES (
  uuid_generate_v4(),
  $1,  -- venue_id
  CURRENT_DATE,
  $2,  -- stocktaker_name
  'in_progress',
  $3   -- notes
) RETURNING id;

-- 2. Add stock entries as user counts products
INSERT INTO stock_entries (
  id,
  session_id,
  product_id,       -- venue_products.id
  venue_area_id,
  quantity_units
) VALUES (
  uuid_generate_v4(),
  $1,  -- session_id from step 1
  $2,  -- product_id (venue_products.id)
  $3,  -- venue_area_id
  $4   -- quantity
);

-- 3. Complete session when done
UPDATE stock_sessions
SET status = 'completed',
    completed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1;
```

### Task 4: Add New Supplier Parser

See `docs/PARSERS.md` for comprehensive guide. Quick steps:

1. Create `backend/parsers/yourSupplierParser.js`
2. Extend `SupplierParser` base class
3. Implement `detectSupplier()` and `parse()` methods
4. Register in `backend/parsers/parserRegistry.js`
5. Add supplier to database with keywords
6. Test with sample invoice PDF

### Task 5: Search Master Products (Fuzzy Match)

```sql
-- Install pg_trgm extension (if not already)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fuzzy search with similarity
SELECT
  id,
  name,
  brand,
  unit_size,
  unit_type,
  case_size,
  category,
  similarity(name, $1) as score
FROM master_products
WHERE
  active = true
  AND similarity(name, $1) > 0.3
ORDER BY score DESC, name
LIMIT 10;
```

### Task 6: Link Invoice Items to Master Products

```sql
-- 1. Update supplier_item_list
UPDATE supplier_item_list
SET
  master_product_id = $1,
  verified = true,
  confidence_score = $2,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $3;

-- 2. Update invoice_line_items
UPDATE invoice_line_items
SET
  master_product_id = $1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $4;
```

### Task 7: Create Temporary SQL Migration File

When creating one-time SQL scripts, mark them clearly:

```sql
-- ============================================
-- TEMPORARY SQL FILE - SAFE TO DELETE
-- ============================================
-- Created: 2025-11-15
-- Purpose: Add 100 new snack products to master catalog
-- Description: Bulk insert of snacks from vendor catalog
-- Status: ✅ Applied to Database
-- Cleanup: This file can be safely deleted after verification
-- ============================================

INSERT INTO master_products (id, name, brand, ...) VALUES
  (uuid_generate_v4(), 'Product 1', 'Brand A', ...),
  (uuid_generate_v4(), 'Product 2', 'Brand B', ...);
```

---

## Code Conventions

### Backend (Node.js/Express)

#### API Routes

```javascript
// Route naming: /api/{resource}
app.get('/api/venues', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM venues');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Use async/await (not callbacks)
// Always wrap in try/catch
// Return appropriate HTTP status codes
```

#### Database Queries

```javascript
// ✅ Use parameterized queries (prevents SQL injection)
const result = await pool.query(
  'SELECT * FROM venues WHERE id = $1',
  [venueId]
);

// ❌ DON'T concatenate SQL strings
const result = await pool.query(
  `SELECT * FROM venues WHERE id = '${venueId}'`  // ❌ SQL injection risk
);
```

#### Error Handling

```javascript
// Consistent error responses
try {
  // ... operation
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Error details:', error);
  res.status(500).json({
    success: false,
    error: error.message
  });
}
```

### Frontend (React)

#### Component Structure

```javascript
// Use functional components with hooks
import React, { useState, useEffect } from 'react';
import { fetchVenues } from '../services/apiService';

const VenueManagement = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      const data = await fetchVenues();
      setVenues(data);
    } catch (error) {
      console.error('Failed to load venues:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? <p>Loading...</p> : <VenueList venues={venues} />}
    </div>
  );
};

export default VenueManagement;
```

#### API Service Layer

```javascript
// frontend/src/services/apiService.js
import { API_BASE_URL } from '../config/api';

export const fetchVenues = async () => {
  const response = await fetch(`${API_BASE_URL}/api/venues`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const createVenue = async (venueData) => {
  const response = await fetch(`${API_BASE_URL}/api/venues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(venueData),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};
```

#### Styled Components

```javascript
// Use styled-components for styling
import styled from 'styled-components';

const Button = styled.button`
  background: ${props => props.primary ? '#007bff' : '#6c757d'};
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

// Usage
<Button primary onClick={handleClick}>Save</Button>
```

### SQL Conventions

```sql
-- Use lowercase for keywords and snake_case for identifiers
SELECT
  vp.id,
  vp.venue_id,
  mp.name,
  mp.brand
FROM venue_products vp
LEFT JOIN master_products mp ON vp.master_product_id = mp.id
WHERE vp.venue_id = $1
  AND mp.active = true
ORDER BY mp.name;

-- Use table aliases for readability
-- Use explicit JOINs (not comma syntax)
-- Use parameterized queries ($1, $2, etc.)
```

---

## Testing & Debugging

### Backend Testing

#### Test API Endpoints

```bash
# Health check
curl http://localhost:3005/api/health

# Get venues
curl http://localhost:3005/api/venues

# Create venue (POST with JSON)
curl -X POST http://localhost:3005/api/venues \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Pub","city":"London"}'

# Search master products
curl "http://localhost:3005/api/master-products?search=heineken&limit=5"
```

#### Database Inspection

```bash
# Connect to database
psql -U postgres -d stocktaking_local

# List tables
\dt

# Describe table structure
\d master_products

# Count records
SELECT COUNT(*) FROM master_products WHERE active = true;

# Check recent entries
SELECT * FROM stock_sessions ORDER BY created_at DESC LIMIT 5;

# Exit
\q
```

#### Backend Logs

```bash
# Backend logs appear in terminal running `npm run dev`
# Look for:
# - HTTP request logs (from morgan)
# - Error stack traces
# - console.log() output
# - Database query errors
```

### Frontend Testing

#### Browser DevTools

1. Open browser DevTools (F12)
2. **Console**: Check for JavaScript errors
3. **Network**: Monitor API requests/responses
4. **React DevTools**: Inspect component state/props

#### Common Issues

**Issue**: API calls fail with CORS error
- **Check**: Backend CORS middleware is enabled
- **Check**: API_BASE_URL in `frontend/src/config/api.js` is correct

**Issue**: Changes not appearing
- **Check**: React dev server is running (`npm start`)
- **Check**: Browser isn't caching old version (hard refresh: Ctrl+Shift+R)

**Issue**: 404 on API endpoint
- **Check**: Backend server is running (`npm run dev`)
- **Check**: Route exists in `backend/server.js`
- **Check**: URL spelling and HTTP method (GET/POST/PUT/DELETE)

### PDF Parser Testing

```javascript
// Create test script: backend/test-parser.js
const fs = require('fs');
const path = require('path');
const PDFParse = require('pdf-parse');
const ParserRegistry = require('./parsers/parserRegistry');

async function testParser() {
  const pdfPath = path.join(__dirname, '../invoices/test-invoice.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);

  // Extract text
  const pdfData = await PDFParse(dataBuffer);
  const pdfText = pdfData.text;

  // Detect supplier
  const registry = new ParserRegistry();
  const detection = registry.detectSupplier(pdfText);
  console.log('Detection:', detection);

  // Parse invoice
  if (detection.parser) {
    const result = await detection.parser.parse(pdfText);
    console.log('Parse Result:', JSON.stringify(result, null, 2));
  }
}

testParser().catch(console.error);

// Run: node backend/test-parser.js
```

---

## Important Files to Reference

### Before Making Changes

Always reference these files to understand context:

1. **`README.md`** - Main documentation index, quick reference
2. **`docs/ARCHITECTURE.md`** - System design principles
3. **`docs/DATABASE_SCHEMA.md`** - Complete schema reference
4. **`docs/DEVELOPMENT.md`** - Development workflow & best practices
5. **`docs/WORKFLOW.md`** - Business logic & user workflows
6. **`backend/schema.sql`** - Database schema (single source of truth)

### For Specific Tasks

- **Adding features**: Check `docs/ARCHITECTURE.md` for design principles
- **Database work**: Reference `docs/DATABASE_SCHEMA.md`
- **API work**: Check `docs/API_ENDPOINTS.md`
- **Parser work**: Read `docs/PARSERS.md`
- **Setup issues**: See `docs/GETTING_STARTED.md`

### Session History

Recent development sessions documented in:
- `SESSION_NOTES_2025-11-01.md` - Tolchards parser implementation
- `SESSION_NOTES_2025-10-22.md` - Product expansion (220 new products)
- `SESSION_HANDOFF_2025-10-21.md` - Earlier session summary

### Product Catalog

- **`masterproducts.md`** - Overview of 570+ products
- **`docs/products/INDEX.md`** - Category index
- **`docs/products/products-*.md`** - 18 individual category files

---

## Gotchas & Anti-patterns

### ❌ Common Mistakes to Avoid

#### 1. Querying venue_products Without JOIN

```sql
-- ❌ WRONG: Missing master_products data
SELECT * FROM venue_products WHERE venue_id = $1;

-- ✅ CORRECT: Always JOIN to master_products
SELECT vp.*, mp.*
FROM venue_products vp
LEFT JOIN master_products mp ON vp.master_product_id = mp.id
WHERE vp.venue_id = $1;
```

#### 2. Storing Product Data in Wrong Table

```sql
-- ❌ WRONG: Duplicating product specs
INSERT INTO venue_products (name, brand, unit_size, category, ...)

-- ✅ CORRECT: Store in master_products, link from venue_products
-- First, insert/find in master_products:
INSERT INTO master_products (name, brand, unit_size, category, ...)
VALUES (...) RETURNING id;

-- Then link in venue_products:
INSERT INTO venue_products (venue_id, master_product_id, name)
VALUES ($1, $2, $3);
```

#### 3. Killing Node Processes Instead of Using Nodemon

```bash
# ❌ WRONG: Breaking nodemon's auto-restart
taskkill /F /IM node.exe

# ✅ CORRECT: Let nodemon handle restarts
# Just save a file to trigger restart
# Or press Ctrl+C in terminal, then restart npm run dev
```

#### 4. Creating Complex Solutions for Simple Problems

```javascript
// User request: "Remove product from current counting session"

// ❌ WRONG: Over-engineering
// Create session_excluded_products table
// Add exclusion tracking logic
// Filter on every query
// Add UI for managing exclusions

// ✅ CORRECT: Direct solution
DELETE FROM stock_entries
WHERE session_id = $1 AND product_id = $2;
```

#### 5. Not Checking for Duplicates Before Adding Products

```javascript
// ❌ WRONG: Blindly inserting without checking
INSERT INTO master_products (name, brand, ...) VALUES (...);

// ✅ CORRECT: Check for duplicates first
const existing = await pool.query(
  `SELECT * FROM master_products
   WHERE LOWER(name) = LOWER($1)
     AND LOWER(brand) = LOWER($2)
     AND unit_size = $3`,
  [name, brand, unitSize]
);

if (existing.rows.length > 0) {
  // Duplicate found, use existing product
  return existing.rows[0].id;
} else {
  // Insert new product
  const result = await pool.query(
    'INSERT INTO master_products (...) VALUES (...) RETURNING id',
    [...]
  );
  return result.rows[0].id;
}
```

#### 6. Hardcoding API URLs

```javascript
// ❌ WRONG: Hardcoded URL
fetch('http://localhost:3005/api/venues')

// ✅ CORRECT: Use config
import { API_BASE_URL } from '../config/api';
fetch(`${API_BASE_URL}/api/venues`)
```

#### 7. Forgetting to Handle Errors

```javascript
// ❌ WRONG: No error handling
app.get('/api/venues', async (req, res) => {
  const result = await pool.query('SELECT * FROM venues');
  res.json(result.rows);
});

// ✅ CORRECT: Proper error handling
app.get('/api/venues', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM venues');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### ⚠️ Important Warnings

1. **Never delete `backend/schema.sql`** - It's the single source of truth
2. **Never push `.env` files** - Contains local database credentials
3. **Always use parameterized queries** - Prevents SQL injection
4. **Never modify `master_products` directly in production** - Use migrations
5. **Always test parsers with real PDFs** - Edge cases are common
6. **Never commit large files** (PDFs, CSVs) - Use .gitignore

---

## Quick Reference Commands

### Development

```bash
# Start backend (auto-restart on changes)
cd backend && npm run dev

# Start frontend (hot-reload on changes)
cd frontend && npm start

# Check API health
curl http://localhost:3005/api/health
```

### Database

```bash
# Connect to database
psql -U postgres -d stocktaking_local

# List tables
\dt

# Describe table
\d master_products

# Count products
SELECT COUNT(*) FROM master_products WHERE active = true;

# Export data
\copy (SELECT * FROM master_products) TO 'products.csv' CSV HEADER;

# Import data
\copy master_products FROM 'products.csv' CSV HEADER;

# Exit
\q
```

### Git

```bash
# Status
git status

# Stage changes
git add .

# Commit
git commit -m "feat: Description"

# Push
git push origin branch-name

# View history
git log --oneline -10
```

### Useful Queries

```sql
-- Find unmatched invoice items
SELECT * FROM invoice_line_items
WHERE master_product_id IS NULL;

-- Find unmatched supplier items
SELECT * FROM supplier_item_list
WHERE master_product_id IS NULL;

-- Product count by category
SELECT category, COUNT(*) as count
FROM master_products
WHERE active = true
GROUP BY category
ORDER BY count DESC;

-- Recent sessions
SELECT
  s.id,
  v.name as venue,
  s.session_date,
  s.status,
  COUNT(se.id) as entry_count
FROM stock_sessions s
JOIN venues v ON s.venue_id = v.id
LEFT JOIN stock_entries se ON s.id = se.session_id
GROUP BY s.id, v.name, s.session_date, s.status
ORDER BY s.created_at DESC
LIMIT 10;
```

---

## AI Assistant Best Practices

### When Starting a New Task

1. **Read relevant documentation first** (this file + specific docs)
2. **Understand the data model** (check DATABASE_SCHEMA.md)
3. **Review recent sessions** (SESSION_NOTES files for context)
4. **Check for existing patterns** (similar features already implemented)
5. **Ask clarifying questions** if requirements are ambiguous

### When Writing Code

1. **Follow existing conventions** (match code style)
2. **Use parameterized queries** (never string concatenation)
3. **Always JOIN to master_products** (for product data)
4. **Handle errors properly** (try/catch, status codes)
5. **Test thoroughly** (backend + frontend + database)

### When Making Database Changes

1. **Update schema.sql** (single source of truth)
2. **Create migration file** (document the change)
3. **Check for duplicates** (before adding products)
4. **Test with sample data** (verify queries work)
5. **Document in session notes** (for future reference)

### When Adding Features

1. **Keep it simple** (avoid over-engineering)
2. **Follow design principles** (check ARCHITECTURE.md)
3. **Reuse existing code** (DRY principle)
4. **Update documentation** (README, API docs, etc.)
5. **Commit with clear messages** (feat/fix/docs/refactor)

### Communication

1. **Be specific** about what you're doing
2. **Explain your reasoning** when making design decisions
3. **Ask before major changes** (architecture, schema, etc.)
4. **Document non-obvious logic** (comments, session notes)
5. **Provide clear summaries** after completing tasks

---

## Version History

- **v2.0.1** (November 2025) - Current version
  - 1,379+ active products
  - 2 supplier parsers (Booker, Tolchards)
  - Comprehensive documentation structure
  - Session management with reopen capability
  - EPOS CSV import with column mapping

- **v2.0.0** (October 2025) - Localhost migration
  - Migrated from Railway to localhost PostgreSQL
  - Implemented 3-table invoice architecture
  - Added PDF parsing with OCR
  - Imported 570+ UK drinks catalog
  - Created structured documentation

---

## Getting Help

### Documentation Resources

- **Main README**: `README.md`
- **Setup Guide**: `docs/GETTING_STARTED.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Database**: `docs/DATABASE_SCHEMA.md`
- **API Reference**: `docs/API_ENDPOINTS.md`
- **Workflow**: `docs/WORKFLOW.md`
- **Parsers**: `docs/PARSERS.md`
- **Development**: `docs/DEVELOPMENT.md`

### For AI Assistants

- Reference this file (`CLAUDE.md`) for comprehensive guidance
- Check session notes for recent development history
- Review existing code for patterns and conventions
- Ask clarifying questions before implementing
- Document changes in session notes

---

**Last Updated**: November 15, 2025
**Maintained By**: Development Team
**Purpose**: Guide AI assistants working with this codebase

---

*This file should be updated whenever significant architectural changes, new patterns, or important conventions are established.*
