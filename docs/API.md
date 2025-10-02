# API Reference

## Base URL
- Production: `https://stocktaking-api-production.up.railway.app`
- Local: `http://localhost:3005`

## Endpoints

### Health Check

#### GET /api/health
Check API health and version

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-02T10:00:00.000Z",
  "db_time": "2025-10-02 10:00:00",
  "version": "2.0.1"
}
```

### Venues

#### GET /api/venues
List all venues

**Response:** Array of venue objects

#### POST /api/venues
Create new venue

**Request Body:**
```json
{
  "name": "Venue Name",
  "address_line_1": "123 Main St",
  "address_line_2": "Suite 100",
  "city": "London",
  "county": "Greater London",
  "postcode": "SW1A 1AA",
  "country": "United Kingdom",
  "phone": "+44 20 1234 5678",
  "contact_person": "John Doe",
  "contact_email": "john@example.com",
  "billing_rate": 50.00,
  "billing_currency": "GBP",
  "billing_notes": "Net 30 terms"
}
```

#### PUT /api/venues/:id
Update venue

#### DELETE /api/venues/:id
Delete venue

### Venue Areas

#### GET /api/venues/:id/areas
List areas for a venue

#### POST /api/venues/:id/areas
Create area for venue

**Request Body:**
```json
{
  "name": "Bar Area",
  "description": "Main bar counter",
  "display_order": 1
}
```

#### PUT /api/areas/:id
Update area

#### DELETE /api/areas/:id
Delete area

### Products

#### GET /api/venues/:id/products
List products for a venue

### Stock Sessions

#### GET /api/sessions
List all sessions

**Query Parameters:**
- `status` - Filter by status (in_progress, completed)

#### POST /api/sessions
Create new session

**Request Body:**
```json
{
  "venue_id": "uuid",
  "stocktaker_name": "John Doe",
  "session_date": "2025-10-02",
  "notes": "Monthly inventory"
}
```

#### GET /api/sessions/:id
Get session details

#### PUT /api/sessions/:id
Update session

**Request Body:**
```json
{
  "status": "completed",
  "notes": "Updated notes"
}
```

### Stock Entries

#### GET /api/sessions/:id/entries
Get entries for a session

**Query Parameters:**
- `completed_only` - true/false (default: false)

#### POST /api/sessions/:id/entries
Create stock entry

**Request Body:**
```json
{
  "product_id": "uuid",
  "venue_area_id": 1,
  "quantity_units": 5.50
}
```

#### PUT /api/entries/:id
Update stock entry

**Request Body:**
```json
{
  "quantity_units": 12.25,
  "venue_area_id": 1
}
```

---

**Version**: 2.0.1
