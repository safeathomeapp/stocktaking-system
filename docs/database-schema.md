# Database Schema Reference

## 📋 Complete Database Schema

This document provides the complete database schema for the Stock Taking System, including all tables, relationships, constraints, and indexes.

### Database Information
- **Database Type**: PostgreSQL
- **Hosted on**: Railway
- **SSL**: Required
- **Current Version**: v1.1.0-county-support

---

## 🏢 Table: `venues`

**Purpose**: Stores venue information with complete address and billing details

```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,  -- Legacy field (kept for compatibility)

    -- Structured Address Fields
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    county VARCHAR(100),
    postcode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United Kingdom',

    -- Contact Information
    phone VARCHAR(50),
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),

    -- Billing Information
    billing_rate DECIMAL(10,2) DEFAULT 0.00,
    billing_currency VARCHAR(10) DEFAULT 'GBP',
    billing_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_venues_name` ON venues(name)

**Sample Data**:
```sql
-- Test venues with complete address information
INSERT INTO venues (name, address_line_1, city, county, postcode, country, phone, contact_person, contact_email)
VALUES
('Test Venue', '123 Test Street', 'Test City', 'Test County', 'AB1 2CD', 'United Kingdom', '01234567890', 'Test Person', 'test@example.com'),
('Another Test Venue', '456 Another Street', 'Another City', 'Another County', 'XY9 8ZA', 'United Kingdom', NULL, NULL, NULL);
```

---

## 📍 Table: `venue_areas`

**Purpose**: Defines areas within each venue for organizing stock

```sql
CREATE TABLE venue_areas (
    id SERIAL PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relationships**:
- `venue_id` → `venues.id` (Many-to-One)

**Indexes**:
- `idx_venue_areas_venue_id` ON venue_areas(venue_id)

**Default Areas** (Created automatically for each venue):
1. **Bar Area** - Main bar and serving area
2. **Storage Room** - Main storage and inventory area
3. **Kitchen** - Kitchen and food preparation area
4. **Wine Cellar** - Wine storage and cellar area
5. **Dry Storage** - Dry goods and non-refrigerated storage

---

## 📦 Table: `products`

**Purpose**: Stores product information for each venue

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    area_id INTEGER REFERENCES venue_areas(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),
    size VARCHAR(50),
    unit_type VARCHAR(50) DEFAULT 'bottle',
    barcode VARCHAR(100),
    expected_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relationships**:
- `venue_id` → `venues.id` (Many-to-One)
- `area_id` → `venue_areas.id` (Many-to-One, Optional)

**Constraints**:
```sql
-- Unit type must be one of the approved values
ALTER TABLE products ADD CONSTRAINT products_unit_type_check
CHECK (unit_type IN ('bottle', 'keg', 'case', 'can', 'jar', 'packet', 'other'));
```

**Indexes**:
- `idx_products_venue_id` ON products(venue_id)
- `idx_products_area_id` ON products(area_id)

**Sample Data**:
```sql
-- Sample products for testing
INSERT INTO products (venue_id, area_id, name, category, brand, size, unit_type, expected_count)
VALUES
('venue-uuid', 1, 'Budweiser', 'Beer', 'Budweiser', '330ml', 'bottle', 24),
('venue-uuid', 1, 'Guinness', 'Beer', 'Guinness', '440ml', 'can', 12),
('venue-uuid', 1, 'Smirnoff Vodka', 'Spirits', 'Smirnoff', '700ml', 'bottle', 2);
```

---

## 📊 Table: `stock_sessions`

**Purpose**: Tracks stock-taking sessions

```sql
CREATE TABLE stock_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    stocktaker_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relationships**:
- `venue_id` → `venues.id` (Many-to-One)

**Status Values**:
- `'in_progress'` - Session is currently active
- `'completed'` - Session has been finished
- `'cancelled'` - Session was cancelled

**Indexes**:
- `idx_stock_sessions_venue_id` ON stock_sessions(venue_id)
- `idx_stock_sessions_status` ON stock_sessions(status)

---

## 📝 Table: `stock_entries`

**Purpose**: Records individual stock counts during sessions

```sql
CREATE TABLE stock_entries (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES stock_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_level DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity_units INTEGER DEFAULT 0,
    location_notes TEXT,
    condition_flags TEXT,
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relationships**:
- `session_id` → `stock_sessions.id` (Many-to-One)
- `product_id` → `products.id` (Many-to-One)

**Indexes**:
- `idx_stock_entries_session_id` ON stock_entries(session_id)
- `idx_stock_entries_product_id` ON stock_entries(product_id)

**Usage Notes**:
- `quantity_level` - Decimal level (e.g., 0.75 for 75% full bottle)
- `quantity_units` - Integer units (e.g., 24 for 24 bottles)
- `location_notes` - Additional location information
- `condition_flags` - Product condition notes
- `photo_url` - URL to product photo

---

## 🧾 Table: `invoices` (Future Use)

**Purpose**: Stores invoice data for delivery tracking

```sql
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    session_id UUID REFERENCES stock_sessions(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    textract_data JSONB,
    processed_items JSONB,
    supplier_name VARCHAR(255),
    invoice_date DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Status Values**:
- `'pending'` - Invoice uploaded, not processed
- `'processing'` - Being processed by AWS Textract
- `'completed'` - Processing complete
- `'error'` - Processing failed

---

## 📋 Table: `delivery_items` (Future Use)

**Purpose**: Individual items from invoices

```sql
CREATE TABLE delivery_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    ordered_quantity INTEGER,
    delivered_quantity INTEGER,
    unit_cost DECIMAL(10,2),
    line_total DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Database Functions & Triggers

### Automatic Timestamp Updates

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_venues_updated_at
    BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_areas_updated_at
    BEFORE UPDATE ON venue_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_sessions_updated_at
    BEFORE UPDATE ON stock_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_entries_updated_at
    BEFORE UPDATE ON stock_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔗 Entity Relationship Diagram

```
venues (1) ─────── (∞) venue_areas
  │                      │
  │                      │
  │ (1)               (∞) │
  │                      │
  └─── (∞) products ──────┘
  │           │
  │ (1)    (∞) │
  │           │
  └─── (∞) stock_sessions
              │
              │ (1)
              │
              └── (∞) stock_entries
```

**Relationship Summary**:
- Each **venue** can have multiple **areas**, **products**, and **sessions**
- Each **area** belongs to one **venue** and can contain multiple **products**
- Each **product** belongs to one **venue** and optionally one **area**
- Each **session** belongs to one **venue** and can have multiple **entries**
- Each **entry** belongs to one **session** and references one **product**

---

## 📊 Current Data Status

### Production Database (Railway)
- **Venues**: 3 test venues with complete data
- **Areas**: 15 areas (5 per venue)
- **Products**: 15 products (5 per venue)
- **Sessions**: Various test sessions
- **Entries**: Sample stock entries for testing

### Sample Queries

**Get all venues with their areas:**
```sql
SELECT v.name as venue_name, va.name as area_name, va.display_order
FROM venues v
LEFT JOIN venue_areas va ON v.id = va.venue_id
ORDER BY v.name, va.display_order;
```

**Get products by venue and area:**
```sql
SELECT v.name as venue_name, va.name as area_name, p.name as product_name, p.category, p.expected_count
FROM venues v
JOIN products p ON v.id = p.venue_id
LEFT JOIN venue_areas va ON p.area_id = va.id
WHERE v.id = 'venue-uuid'
ORDER BY va.display_order, p.category, p.name;
```

**Get session progress:**
```sql
SELECT
    s.id as session_id,
    v.name as venue_name,
    s.stocktaker_name,
    s.status,
    COUNT(se.id) as entries_count,
    COUNT(DISTINCT se.product_id) as products_counted
FROM stock_sessions s
JOIN venues v ON s.venue_id = v.id
LEFT JOIN stock_entries se ON s.id = se.session_id
WHERE s.id = 'session-uuid'
GROUP BY s.id, v.name, s.stocktaker_name, s.status;
```

---

## 🛠️ Database Management Scripts

### Available Scripts
- `backend/migrate-db.js` - Run schema migrations
- `backend/init-database.sql` - Complete schema initialization
- `backend/fix-products.js` - Add sample products
- `backend/check-db.js` - Verify database structure
- `backend/check-constraints.js` - Check table constraints

### Connection Details
```javascript
// Database connection (example)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

---

*Last Updated: September 27, 2025*
*Schema Version: v1.1.0-county-support*