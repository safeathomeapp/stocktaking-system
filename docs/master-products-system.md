# Master Products System

## Overview

The Master Products system provides a centralized product catalog that all venues can reference. This eliminates duplicate product entries and provides structured data for reporting and analysis.

**🚨 IMPORTANT**: All future programming MUST use this master products system as the single source of truth for product data.

## Complete Database Schema

### Master Products Table Structure

```sql
CREATE TABLE master_products (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core product information
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Product categorization
    category VARCHAR(100), -- e.g., chardonnay, sauvignon blanc, beer, cider, gin, vodka
    master_category VARCHAR(50), -- e.g., draught, spirits, wine, misc

    -- Container specifications
    container_type VARCHAR(50), -- e.g., bottle, can, keg, box, bag
    container_size VARCHAR(50), -- e.g., 275ml, 750ml, 568ml, 50L, 11 gallons
    case_size INTEGER, -- e.g., 12, 24, 6 (units per case)
    unit_size VARCHAR(100), -- e.g., "24 bottles per case", "1 keg (11 gallons)"

    -- Additional product details
    brand VARCHAR(100),
    alcohol_percentage DECIMAL(4,2), -- e.g., 12.5 for 12.5% ABV
    barcode VARCHAR(50),
    sku VARCHAR(100), -- Stock Keeping Unit

    -- Pricing information (optional)
    suggested_retail_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'GBP',

    -- Product status and metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Search optimization (inherited from previous system)
    search_vector tsvector,
    confidence_score DECIMAL(5,2),
    created_by VARCHAR(100),
    ean_code VARCHAR(20),
    first_seen_venue UUID,
    last_used TIMESTAMP,
    normalized_name VARCHAR(255),
    phonetic_key VARCHAR(100),
    search_terms TEXT[],
    size VARCHAR(50),
    subcategory VARCHAR(100),
    success_rate DECIMAL(5,2),
    total_venues_count INTEGER,
    unit_type VARCHAR(50),
    upc_code VARCHAR(20),
    usage_count INTEGER,
    venues_seen UUID[],
    verification_status VARCHAR(50)
);
```

### Key Fields Explained

- **id**: UUID primary key - ALWAYS use this for references
- **name**: Product name (e.g., "Becks Lager Bottles")
- **description**: Detailed product description
- **category**: Specific product type (chardonnay, sauvignon blanc, beer, cider, gin, vodka)
- **master_category**: High-level grouping (draught, spirits, wine, beer, misc)
- **container_type**: Physical container (bottle, can, keg, box, bag)
- **container_size**: Size of individual container (275ml, 750ml, 11 gallons, etc.)
- **case_size**: Number of units per case/pack (24, 12, 1, etc.)
- **unit_size**: 🆕 **CRITICAL FIELD** - Descriptive unit size (e.g., "24 bottles per case", "1 keg (11 gallons)")
- **brand**: Product brand
- **alcohol_percentage**: ABV percentage
- **barcode**: Product barcode
- **sku**: Stock Keeping Unit
- **active**: Whether product is active and available

### Categories

**Master Categories:**
- `draught` - Keg products served on tap
- `spirits` - Bottled spirits and liqueurs
- `wine` - All wine products
- `beer` - Bottled/canned beers
- `soft_drinks` - Soft drinks, minerals, juices, water, etc.
- `misc` - Food items, cleaning supplies, etc.

**Category Examples:**
- Wine: chardonnay, sauvignon blanc, merlot, prosecco
- Spirits: vodka, gin, whiskey, rum
- Beer: lager, stout, IPA, bitter
- Soft Drinks: cola, juice, water, mineral, tonic, lemonade
- Misc: food items, cleaning supplies, paper products

## API Endpoints

### GET /api/master-products
Get all master products with optional filtering

**Query Parameters:**
- `category` - Filter by specific category
- `master_category` - Filter by master category
- `search` - Search in name, brand, description
- `active` - Filter by active status (true/false/all)

**Example:**
```bash
GET /api/master-products?master_category=wine&active=true
```

### GET /api/master-products/:id
Get specific master product by ID

### POST /api/master-products
Create new master product

**Body Example:**
```json
{
  "name": "Stella Artois Premium Lager",
  "description": "Premium European lager beer",
  "category": "lager",
  "master_category": "draught",
  "container_type": "keg",
  "container_size": "50L",
  "case_size": 1,
  "brand": "Stella Artois",
  "alcohol_percentage": 5.0,
  "barcode": "1234567890123"
}
```

### PUT /api/master-products/:id
Update existing master product

### GET /api/master-products/categories/summary
Get summary of all categories and product counts

### POST /api/master-products/search
Advanced full-text search

**Body Example:**
```json
{
  "query": "chardonnay white wine",
  "limit": 20,
  "min_score": 0.1
}
```

## Setup Instructions

### 1. Run Database Migration

**Option A: Using Node.js script**
```bash
cd backend
node migrate-master-products.js
```

**Option B: Direct SQL execution**
```bash
cd backend
psql $DATABASE_URL -f create-master-products-table.sql
```

### 2. Verify Installation

Check that the table was created and sample data inserted:
```bash
curl "https://your-api-url/api/master-products/categories/summary"
```

## Usage Examples

### Frontend Integration

```javascript
import { apiService } from '../services/apiService';

// Get all wine products
const wines = await apiService.getMasterProducts({
  master_category: 'wine',
  active: 'true'
});

// Search for products
const searchResults = await apiService.searchMasterProductsAdvanced('chardonnay', {
  limit: 10
});

// Create new product
const newProduct = await apiService.createMasterProduct({
  name: "New Product",
  category: "lager",
  master_category: "beer",
  container_type: "bottle",
  container_size: "330ml",
  case_size: 24,
  brand: "Brand Name"
});
```

### Voice Recognition Integration

The master products system integrates with voice recognition:

```javascript
// Voice search will now search master products
const voiceResult = await apiService.searchMasterProducts("becks lager");
```

## Programming Guidelines

### 🚨 MANDATORY for All Future Development

1. **Always Reference master_products Table**: Never create standalone product tables
2. **Use UUID References**: All product references must use master_products.id (UUID)
3. **Include unit_size Field**: Always capture and display unit_size information
4. **Validate Against Categories**: Use predefined master_category and category values
5. **Search Integration**: Use the built-in search functionality for product lookups

### Required Fields for New Products

**Minimum Required:**
- `name` (VARCHAR(255), NOT NULL)
- `master_category` (draught, spirits, wine, beer, misc)
- `container_type` (bottle, can, keg, box, bag)
- `unit_size` (descriptive text explaining the unit packaging)

**Recommended:**
- `category` (specific product type)
- `container_size` (individual container size)
- `case_size` (units per case)
- `brand`
- `alcohol_percentage`

### Code Examples

**Creating a New Product:**
```javascript
const newProduct = {
  name: "Becks Lager Bottles",
  description: "German premium lager",
  category: "lager",
  master_category: "beer",
  container_type: "bottle",
  container_size: "275ml",
  case_size: 24,
  unit_size: "24 bottles per case", // CRITICAL FIELD
  brand: "Becks",
  alcohol_percentage: 5.0
};

const result = await apiService.createMasterProduct(newProduct);
```

**Searching Products:**
```javascript
// Search by category
const wines = await apiService.getMasterProducts({
  master_category: "wine"
});

// Text search
const searchResults = await apiService.searchMasterProductsAdvanced("becks lager", {
  limit: 10
});
```

## Sample Data

The system includes sample products with proper unit sizing:

### Current Products in Database:
- **Becks Lager Bottles**: 24 bottles per case (275ml each) - Beer
- **Guinness Draught Keg**: 1 keg (11 gallons) - Draught
- **House Wine Box**: 4 boxes per case (3L each) - Wine
- **Vodka 70cl Case**: 12 bottles per case - Spirits

### Example Unit Size Formats:
- **Bottles**: "24 bottles per case", "12 bottles per case"
- **Kegs**: "1 keg (11 gallons)", "1 keg (50 litres)"
- **Boxes**: "4 boxes per case (3L each)"
- **Cases**: "6 cans per pack", "20 units per case"

## Benefits

1. **Centralized Catalog**: Single source of truth for all products
2. **Structured Data**: Consistent categorization and container specifications
3. **Search Optimization**: Full-text search with relevance scoring
4. **Voice Recognition**: Enhanced product matching for voice commands
5. **Reporting**: Rich data for analysis and reporting
6. **Consistency**: Eliminates duplicate products across venues
7. **Scalability**: Easy to add new products and categories

## Supplier Mapping Bridge System

The system includes a powerful bridge table system to handle different supplier formats and automatically map them to your standardized master products structure.

### Bridge Tables

#### suppliers
```sql
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- e.g., "Bookers", "Tesco", "CSV_Import_2024"
    type VARCHAR(50) NOT NULL, -- e.g., "invoice", "csv", "ocr", "manual"
    description TEXT,
    field_mappings JSONB, -- Maps supplier fields to our fields
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### supplier_product_mappings (Bridge Table)
```sql
CREATE TABLE supplier_product_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id),
    master_product_id UUID REFERENCES master_products(id),

    -- Original supplier data (raw format)
    supplier_product_code VARCHAR(100), -- Their internal code
    supplier_description TEXT NOT NULL, -- Raw description from supplier
    supplier_category VARCHAR(100), -- Their category name
    supplier_pack_size VARCHAR(50), -- Their pack size format
    supplier_unit_size VARCHAR(50), -- Their unit size format
    supplier_brand VARCHAR(100), -- Their brand name
    supplier_data JSONB, -- Store any extra fields like price, VAT, etc.

    -- Mapping confidence and validation
    mapping_confidence DECIMAL(5,2) DEFAULT 1.0,
    auto_mapped BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,

    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(supplier_id, supplier_product_code)
);
```

### Supplier Mapping API Endpoints

#### Process Bookers Invoice Data
```bash
POST /api/suppliers/bookers/process
```

**Example Request Body:**
```json
{
  "invoiceData": [
    {
      "internal_code": "BK123456",
      "description": "Coca Cola Can",
      "pack": "24",
      "size": "330ml",
      "qty": "2",
      "price": "18.50",
      "value": "37.00",
      "VAT": "7.40",
      "STD_RRP": "1.20",
      "POR": "12345"
    }
  ]
}
```

The system will automatically:
1. Parse "Coca Cola Can" → Extract product name "Coca Cola", container type "can"
2. Parse "24" pack → case_size = 24
3. Parse "330ml" size → container_size = "330ml"
4. Generate unit_size → "24 cans per case"
5. Determine master_category → "soft_drinks"
6. Create or link to master product
7. Store supplier mapping for future reference

#### Process CSV Data
```bash
POST /api/suppliers/:id/process-csv
```

**Example Request Body:**
```json
{
  "csvData": [
    {
      "product_name": "Beck's Lager",
      "category": "Beer",
      "size": "275ml",
      "pack_size": "24"
    }
  ],
  "fieldMapping": {
    "name": "product_name",
    "category": "category",
    "container_size": "size",
    "case_size": "pack_size"
  }
}
```

#### Get Supplier Mappings
```bash
GET /api/suppliers/:id/mappings?search=coca&limit=20
```

#### Update Mapping (Verify/Correct)
```bash
PUT /api/supplier-mappings/:id
```

```json
{
  "master_product_id": "uuid-here",
  "verified": true,
  "mapping_confidence": 0.95
}
```

### Auto-Mapping Logic

The system includes intelligent parsing rules that automatically extract:

- **Product Name**: Removes container words, capitalizes properly
- **Container Type**: Detects bottle, can, keg, box, bag from description
- **Container Size**: Normalizes ml, cl, L, gallons formats
- **Case Size**: Extracts pack quantity numbers
- **Unit Size**: Generates descriptive text like "24 bottles per case"
- **Master Category**: Uses keyword matching for wine, beer, spirits, draught
- **Brand**: Recognizes common brands or extracts from description

### Parsing Rules Examples

For Bookers supplier:
- Extract container type: `\b(bottle|can|keg|box|bag)\b` → container_type
- Extract size: `(\d+(?:\.\d+)?)\s*(ml|cl|l|gallons?)` → container_size
- Determine wine: `wine|chardonnay|merlot|sauvignon` → master_category = 'wine'
- Determine beer: `beer|lager|ale|stout|bitter` → master_category = 'beer'

### Usage Examples

**Processing Bookers Invoice:**
```javascript
// Your Bookers OCR data
const bookersData = {
  internal_code: "BK789123",
  description: "Stella Artois Lager Can",
  pack: "24",
  size: "440ml",
  qty: "3",
  price: "22.50"
};

// System automatically creates:
// - Product name: "Stella Artois Lager"
// - Container type: "can"
// - Container size: "440ml"
// - Case size: 24
// - Unit size: "24 cans per case"
// - Master category: "beer"
// - Category: "lager"
// - Brand: "Stella Artois"
```

**Benefits:**
- **Unified Data**: All supplier formats convert to standard master products
- **Auto-Mapping**: Intelligent parsing reduces manual work
- **Audit Trail**: Track confidence scores and verify mappings
- **Flexible**: Support any supplier format via configurable field mappings
- **Scalable**: Easy to add new suppliers and parsing rules

### Setup Instructions

1. **Run Supplier Mapping Migration**
```bash
cd backend
node migrate-supplier-mappings.js
```

2. **Verify Installation**
```bash
curl "https://your-api-url/api/suppliers"
```

This will show the pre-configured suppliers: Bookers, CSV_Import, Manual_Entry.

## Future Enhancements

- Product images and photos
- Advanced OCR integration
- Machine learning for mapping confidence
- Inventory thresholds and reorder points
- Product lifecycle management
- Integration with POS systems
- Barcode scanning support
- Nutritional information
- Allergen data