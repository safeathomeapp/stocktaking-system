# API Endpoints Reference

**Base URL:**
- All environments: `http://localhost:3005`

---

## Health Check

- `GET /api/health` - Check API health and version

---

## Venues

- `GET /api/venues` - List all venues
- `POST /api/venues` - Create venue
- `PUT /api/venues/:id` - Update venue
- `DELETE /api/venues/:id` - Delete venue
- `GET /api/venues/:id/products` - List venue products
- `GET /api/venues/:id/areas` - List venue areas

---

## Venue Areas

- `POST /api/venues/:id/areas` - Create area
- `PUT /api/areas/:id` - Update area
- `DELETE /api/areas/:id` - Delete area

---

## Stock Sessions

- `GET /api/sessions` - List sessions (query: `status=in_progress|completed`)
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session (e.g., mark completed)

---

## Stock Entries

- `GET /api/sessions/:id/entries` - Get entries (query: `completed_only=true|false`)
- `POST /api/sessions/:id/entries` - Create entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/sessions/:sessionId/entries/product/:productId` - Remove product from session

---

## Master Products

- `GET /api/master-products` - Search master products (query: `search=`, `category=`, `limit=`)
- `POST /api/master-products` - Create master product
- `PUT /api/master-products/:id` - Update master product

---

## Suppliers

- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `GET /api/supplier-items` - List supplier item mappings

---

## Invoices

- `POST /api/invoices/parse` - Parse PDF invoice (OCR)
- `POST /api/invoices` - Create invoice header
- `GET /api/invoices/:id` - Get invoice details
- `GET /api/invoices` - List invoices (query: `venue_id=`, `supplier_id=`)

---

## Invoice Line Items

- `GET /api/invoices/:invoiceId/line-items` - Get line items for invoice
- `PUT /api/invoice-line-items/:id/link-master-product` - Link to master product

---

## EPOS Integration

- `POST /api/epos-imports` - Upload EPOS CSV data
- `GET /api/epos-imports?venue_id=X` - List imports for venue
- `GET /api/epos-imports/:id/records` - View sales records
- `GET /api/venues/:venueId/csv-preferences` - Get saved column mappings
- `PUT /api/venues/:venueId/csv-preferences` - Save column mappings
- `GET /api/venues/:venueId/last-session-date` - Get last stocktake date

---

## Database Inspector

- `GET /api/db-tables` - List all database tables
- `GET /api/db-inspect/:tableName` - Inspect table structure and data

---

## User Profile

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

---

## Example Requests

### Create Venue

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

### Create Stock Session

```json
POST /api/sessions
{
  "venue_id": "uuid",
  "session_date": "2025-11-15",
  "stocktaker_name": "Alice Johnson",
  "status": "in_progress"
}
```

### Create Stock Entry

```json
POST /api/sessions/:id/entries
{
  "product_id": "uuid",
  "venue_area_id": 1,
  "quantity_units": 5.50
}
```

### Upload Invoice PDF

```
POST /api/invoices/parse
Content-Type: multipart/form-data

file: [PDF file]
```

### Create Invoice

```json
POST /api/invoices
{
  "invoice_number": "INV-2025-12345",
  "venue_id": "uuid",
  "supplier_id": "uuid",
  "invoice_date": "2025-11-15",
  "total_amount": 1250.50,
  "import_method": "pdf"
}
```

### Upload EPOS CSV

```
POST /api/epos-imports
Content-Type: multipart/form-data

file: [CSV file]
venue_id: [uuid]
column_mapping: {
  "date": "Transaction Date",
  "product": "Item Name",
  "quantity": "Qty",
  "revenue": "Amount"
}
```

---

## Master Products Search

### Query Parameters:
- `search` - Free text search on product name/brand
- `category` - Filter by category (spirits, wine, beer, soft_drinks, snacks)
- `limit` - Maximum results (default: 20)

### Example:
```
GET /api/master-products?search=heineken&category=beer&limit=10
```

---

## Response Format

All successful responses return:
```json
{
  "status": "success",
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```
