const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const pool = require('./src/database');
const { PDFParse } = require('pdf-parse');
require('dotenv').config();

// Updated with county field support

const app = express();
const PORT = process.env.PORT || 3005;

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and CSV files are allowed'));
    }
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Stocktaking System API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      db_time: result.rows[0].now,
      version: '2.0.1'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint to verify deployment
app.get('/api/test-deployment', (req, res) => {
  res.json({
    message: 'Deployment successful with county field support',
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

// Get all venues
app.get('/api/venues', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM venues ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new venue with county field support
app.post('/api/venues', async (req, res) => {
  try {
    const {
      name,
      address_line_1,
      address_line_2,
      city,
      county,
      postcode,
      country = 'United Kingdom',
      phone,
      contact_person,
      contact_email,
      billing_rate,
      billing_currency = 'GBP',
      billing_notes
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Venue name is required' });
    }

    // Create new venue
    const result = await pool.query(
      `INSERT INTO venues (name, address_line_1, address_line_2, city, county, postcode, country, phone, contact_person, contact_email, billing_rate, billing_currency, billing_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [name, address_line_1, address_line_2, city, county, postcode, country, phone, contact_person, contact_email, billing_rate, billing_currency, billing_notes]
    );

    const newVenue = result.rows[0];

    // No automatic areas - user will manually add areas as needed

    res.status(201).json({
      message: 'Venue created successfully',
      venue: newVenue
    });

  } catch (error) {
    console.error('Error creating venue:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// Get venue by ID with full details
app.get('/api/venues/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM venues WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json({
      venue: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching venue:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// Update venue
app.put('/api/venues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address_line_1,
      address_line_2,
      city,
      county,
      postcode,
      country,
      phone,
      contact_person,
      contact_email,
      billing_rate,
      billing_currency,
      billing_notes,
      active
    } = req.body;

    // Check if venue exists
    const venueCheck = await pool.query('SELECT id FROM venues WHERE id = $1', [id]);
    if (venueCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (address_line_1 !== undefined) {
      updateFields.push(`address_line_1 = $${paramCount}`);
      values.push(address_line_1);
      paramCount++;
    }
    if (address_line_2 !== undefined) {
      updateFields.push(`address_line_2 = $${paramCount}`);
      values.push(address_line_2);
      paramCount++;
    }
    if (city !== undefined) {
      updateFields.push(`city = $${paramCount}`);
      values.push(city);
      paramCount++;
    }
    if (county !== undefined) {
      updateFields.push(`county = $${paramCount}`);
      values.push(county);
      paramCount++;
    }
    if (postcode !== undefined) {
      updateFields.push(`postcode = $${paramCount}`);
      values.push(postcode);
      paramCount++;
    }
    if (country !== undefined) {
      updateFields.push(`country = $${paramCount}`);
      values.push(country);
      paramCount++;
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }
    if (contact_person !== undefined) {
      updateFields.push(`contact_person = $${paramCount}`);
      values.push(contact_person);
      paramCount++;
    }
    if (contact_email !== undefined) {
      updateFields.push(`contact_email = $${paramCount}`);
      values.push(contact_email);
      paramCount++;
    }
    if (billing_rate !== undefined) {
      updateFields.push(`billing_rate = $${paramCount}`);
      values.push(billing_rate);
      paramCount++;
    }
    if (billing_currency !== undefined) {
      updateFields.push(`billing_currency = $${paramCount}`);
      values.push(billing_currency);
      paramCount++;
    }
    if (billing_notes !== undefined) {
      updateFields.push(`billing_notes = $${paramCount}`);
      values.push(billing_notes);
      paramCount++;
    }
    if (active !== undefined) {
      updateFields.push(`active = $${paramCount}`);
      values.push(active);
      paramCount++;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 1) { // Only timestamp update
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // Add venue ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE venues
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Venue updated successfully',
      venue: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating venue:', error);
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// Get areas for a venue
app.get('/api/venues/:id/areas', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify venue exists
    const venueCheck = await pool.query('SELECT id FROM venues WHERE id = $1', [id]);
    if (venueCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const result = await pool.query(
      'SELECT * FROM venue_areas WHERE venue_id = $1 ORDER BY display_order, name',
      [id]
    );

    res.json({
      areas: result.rows
    });

  } catch (error) {
    console.error('Error fetching venue areas:', error);
    res.status(500).json({ error: 'Failed to fetch venue areas' });
  }
});

// Add area to venue
app.post('/api/venues/:id/areas', async (req, res) => {
  try {
    const { id: venue_id } = req.params;
    const { name, display_order, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Area name is required' });
    }

    // Verify venue exists
    const venueCheck = await pool.query('SELECT id FROM venues WHERE id = $1', [venue_id]);
    if (venueCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const result = await pool.query(
      'INSERT INTO venue_areas (venue_id, name, display_order, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [venue_id, name, display_order || 0, description]
    );

    res.status(201).json({
      message: 'Area added successfully',
      area: result.rows[0]
    });

  } catch (error) {
    if (error.constraint === 'unique_venue_area_name') {
      return res.status(409).json({ error: 'Area name already exists for this venue' });
    }
    console.error('Error adding area:', error);
    res.status(500).json({ error: 'Failed to add area' });
  }
});

// Update area
app.put('/api/areas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_order, description, photo } = req.body;

    // Build dynamic update query for partial updates
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount}`);
      values.push(display_order);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (photo !== undefined) {
      updates.push(`photo = $${paramCount}`);
      values.push(photo);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE venue_areas SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Area not found' });
    }

    res.json({
      success: true,
      message: 'Area updated successfully',
      area: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating area:', error);
    res.status(500).json({ success: false, error: 'Failed to update area', details: error.message });
  }
});

// Delete area
app.delete('/api/areas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM venue_areas WHERE id = $1 RETURNING name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }

    res.json({
      message: 'Area deleted successfully',
      deleted_area: result.rows[0].name
    });

  } catch (error) {
    console.error('Error deleting area:', error);
    res.status(500).json({ error: 'Failed to delete area' });
  }
});

// Get products for a venue
app.get('/api/venues/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
         vp.id,
         vp.venue_id,
         mp.name,
         mp.name as venue_name,
         vp.master_product_id,
         vp.area_id,
         vp.created_at,
         vp.updated_at,
         mp.brand,
         mp.unit_type,
         mp.unit_size,
         mp.category,
         mp.subcategory,
         mp.barcode,
         mp.case_size
       FROM venue_products vp
       LEFT JOIN master_products mp ON vp.master_product_id = mp.id
       WHERE vp.venue_id = $1
       ORDER BY mp.category, mp.name`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create venue-specific product
app.post('/api/venues/:id/products', async (req, res) => {
  try {
    const venueId = req.params.id;
    const {
      name,
      area_id,
      master_product_id
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    if (!master_product_id) {
      return res.status(400).json({ error: 'Master product ID is required' });
    }

    // Verify venue exists
    const venueCheck = await pool.query('SELECT id FROM venues WHERE id = $1', [venueId]);
    if (venueCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Verify master product exists
    const masterCheck = await pool.query('SELECT id FROM master_products WHERE id = $1', [master_product_id]);
    if (masterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Master product not found' });
    }

    // Create the venue product (linkage table only)
    const result = await pool.query(
      `INSERT INTO venue_products (venue_id, master_product_id, area_id, name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [venueId, master_product_id, area_id || null, name]
    );

    // Get the full product details by joining with master_products
    const fullProduct = await pool.query(
      `SELECT
        vp.id,
        vp.venue_id,
        vp.area_id,
        vp.name as venue_name,
        vp.master_product_id,
        mp.name,
        mp.brand,
        mp.unit_type,
        mp.unit_size,
        mp.category,
        mp.subcategory,
        mp.barcode,
        mp.case_size
      FROM venue_products vp
      LEFT JOIN master_products mp ON vp.master_product_id = mp.id
      WHERE vp.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: fullProduct.rows[0]
    });

  } catch (error) {
    console.error('Error creating venue product:', error);
    if (error.code === '23505') {
      // Unique constraint violation (venue_id, master_product_id, area_id)
      res.status(409).json({ error: 'This product is already linked to this area in this venue' });
    } else {
      res.status(500).json({ error: error.message || 'Failed to create product' });
    }
  }
});

// ===== MASTER PRODUCTS ENDPOINTS =====

// Get all master products with filtering
app.get('/api/master-products', async (req, res) => {
  try {
    const { category, search, active = 'true' } = req.query;

    let query = 'SELECT * FROM master_products WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (active !== 'all') {
      query += ` AND active = $${paramCount}`;
      params.push(active === 'true');
      paramCount++;
    }

    if (category) {
      query += ` AND category ILIKE $${paramCount}`;
      params.push(`%${category}%`);
      paramCount++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR brand ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY category, brand, name';

    const result = await pool.query(query, params);

    // Return in expected format for apiService
    res.json({
      success: true,
      products: result.rows
    });
  } catch (error) {
    console.error('Error fetching master products:', error);
    res.status(500).json({ error: 'Failed to fetch master products' });
  }
});


// NOTE: Duplicate old POST/PUT endpoints removed. Using newer endpoints below (around line 1300+)

// Get master product categories summary
app.get('/api/master-products/categories/summary', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM master_products_summary ORDER BY category');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories summary:', error);
    res.status(500).json({ error: 'Failed to fetch categories summary' });
  }
});

// Search master products (for voice recognition, etc.)
app.post('/api/master-products/search', async (req, res) => {
  const client = await pool.connect();
  try {
    const { query: searchQuery, limit = 20, min_score = 0.1 } = req.body;

    if (!searchQuery || searchQuery.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Enable pg_trgm extension for fuzzy matching if not already enabled
    await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // Smart Hybrid Search with Multi-Tier Ranking (same logic as fuzzy-match)
    // This is the PRIMARY search endpoint used by the frontend
    const searchTerm = searchQuery.trim();

    const result = await client.query(
      `SELECT
        id,
        name as product_name,
        brand,
        category,
        subcategory,
        unit_size,
        unit_type,
        case_size,
        barcode,
        ean_code,
        upc_code,
        active,
        similarity(name, $1) as name_similarity,
        CASE
          WHEN $2::TEXT != '' THEN similarity(COALESCE(category, ''), $2::TEXT)
          ELSE 0
        END as description_similarity,
        -- Multi-tier scoring system
        CASE
          -- TIER 1: Exact prefix match (score 100+)
          WHEN LOWER(name) LIKE LOWER($3) || '%' THEN 100 + similarity(name, $1) * 0.1

          -- TIER 2: Word start match (score 80+)
          WHEN LOWER(name) ~ ('(^|[^a-z0-9])' || LOWER($3)) THEN 80 + similarity(name, $1) * 0.1

          -- TIER 3: High similarity fuzzy match (50%+, score 60+)
          WHEN similarity(name, $1) > 0.50 THEN 60 + (similarity(name, $1) * 0.8 +
            CASE WHEN $2::TEXT != '' THEN similarity(COALESCE(category, ''), $2::TEXT) * 0.2 ELSE 0 END) * 10

          -- TIER 4: Moderate similarity fuzzy match (35%+, score 40+)
          WHEN similarity(name, $1) > 0.35 THEN 40 + (similarity(name, $1) * 0.8 +
            CASE WHEN $2::TEXT != '' THEN similarity(COALESCE(category, ''), $2::TEXT) * 0.2 ELSE 0 END) * 10

          ELSE 0
        END as relevance_score
       FROM master_products
       WHERE active = true
         AND (
           -- Include any match above 35% similarity threshold OR prefix/word match
           similarity(name, $1) > 0.35
           OR LOWER(name) LIKE LOWER($3) || '%'
           OR LOWER(name) ~ ('(^|[^a-z0-9])' || LOWER($3))
         )
       ORDER BY relevance_score DESC, name_similarity DESC
       LIMIT $4`,
      [searchTerm, '', searchTerm, limit]
    );

    res.json({
      query: searchQuery,
      results: result.rows.map(row => ({
        id: row.id,
        name: row.product_name,
        product_name: row.product_name,
        brand: row.brand,
        category: row.category,
        subcategory: row.subcategory,
        unit_size: row.unit_size,      // Frontend expects snake_case
        unit_type: row.unit_type,       // Frontend expects snake_case
        case_size: row.case_size,       // Frontend expects snake_case
        barcode: row.barcode,
        active: row.active,
        confidenceScore: Math.round(row.relevance_score * 10) // Convert to 0-100% scale
      })),
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error searching master products:', error);
    res.status(500).json({ error: 'Failed to search master products', message: error.message });
  } finally {
    client.release();
  }
});

// ===== SESSION MANAGEMENT ENDPOINTS =====

// Create new stock-taking session
app.post('/api/sessions', async (req, res) => {
  try {
    const { venue_id, stocktaker_name, notes } = req.body;

    // Validate required fields
    if (!venue_id || !stocktaker_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: venue_id and stocktaker_name are required' 
      });
    }

    // Verify venue exists
    const venueCheck = await pool.query('SELECT id FROM venues WHERE id = $1', [venue_id]);
    if (venueCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Create new session
    const result = await pool.query(
      `INSERT INTO stock_sessions (venue_id, stocktaker_name, notes, session_date, status) 
       VALUES ($1, $2, $3, CURRENT_DATE, 'in_progress') 
       RETURNING *`,
      [venue_id, stocktaker_name, notes || null]
    );

    res.status(201).json({
      message: 'Stock session created successfully',
      session: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});
// Add this endpoint after the POST /api/sessions endpoint in your server.js

// Get session details with venue info and entry count
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get session with venue details and entry count
    const result = await pool.query(
      `SELECT
         s.*,
         v.name as venue_name,
         v.address_line_1,
         v.address_line_2,
         v.city,
         v.county,
         v.postcode,
         v.country,
         COUNT(se.id) as entry_count
       FROM stock_sessions s
       JOIN venues v ON s.venue_id = v.id
       LEFT JOIN stock_entries se ON s.id = se.session_id
       WHERE s.id = $1
       GROUP BY s.id, v.name, v.address_line_1, v.address_line_2, v.city, v.county, v.postcode, v.country`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      session: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Add this endpoint after the GET /api/sessions/:id endpoint in your server.js

// Replace the PUT /api/sessions/:id endpoint in your server.js with this corrected version

// Update session (complete, add notes, change status)
app.put('/api/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, stocktaker_name } = req.body;

    // Validate status if provided
    const validStatuses = ['in_progress', 'completed', 'reviewed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be: in_progress, completed, or reviewed' 
      });
    }

    // Check if session exists
    const sessionCheck = await pool.query('SELECT id, status FROM stock_sessions WHERE id = $1', [id]);
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
      
      // Set completed_at timestamp when status changes to completed
      if (status === 'completed') {
        updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`);
      values.push(notes);
      paramCount++;
    }

    if (stocktaker_name !== undefined) {
      updateFields.push(`stocktaker_name = $${paramCount}`);
      values.push(stocktaker_name);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // Add session ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE stock_sessions 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Session updated successfully',
      session: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Add this endpoint after the PUT /api/sessions/:id endpoint in your server.js

// Get session history for a venue (with pagination)
app.get('/api/venues/:id/sessions', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10, offset = 0, status } = req.query;

    // Verify venue exists
    const venueCheck = await pool.query('SELECT id, name FROM venues WHERE id = $1', [id]);
    if (venueCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Build query with optional status filter
    let query = `
      SELECT 
        s.*,
        COUNT(se.id) as entry_count
      FROM stock_sessions s
      LEFT JOIN stock_entries se ON s.id = se.session_id
      WHERE s.venue_id = $1
    `;
    
    const queryParams = [id];
    let paramCount = 2;

    if (status) {
      query += ` AND s.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    query += `
      GROUP BY s.id
      ORDER BY s.session_date DESC, s.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM stock_sessions WHERE venue_id = $1';
    const countParams = [id];
    
    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      venue: venueCheck.rows[0],
      sessions: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching venue sessions:', error);
    res.status(500).json({ error: 'Failed to fetch venue sessions' });
  }
});

// Add this endpoint after the GET /api/venues/:id/sessions endpoint in your server.js

// Get all active sessions (useful for dashboard/monitoring)
app.get('/api/sessions', async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    let query = `SELECT
         s.*,
         v.name as venue_name,
         COUNT(se.id) as entry_count
       FROM stock_sessions s
       JOIN venues v ON s.venue_id = v.id
       LEFT JOIN stock_entries se ON s.id = se.session_id`;

    let params = [];
    let paramCount = 0;

    // Only add WHERE clause if status is specified
    if (status) {
      query += ` WHERE s.status = $${++paramCount}`;
      params.push(status);
    }

    query += ` GROUP BY s.id, v.name
       ORDER BY s.created_at DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`;

    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      sessions: result.rows,
      filter: { status: status || 'all' },
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Add this endpoint after the GET /api/sessions endpoint in your server.js

// ===== STOCK ENTRY MANAGEMENT ENDPOINTS =====

// Add product stock entry to a session
// Helper function to round to 2 decimal places
function roundToTwoDecimals(num) {
  return Math.round((parseFloat(num) || 0) * 100) / 100;
}

app.post('/api/sessions/:id/entries', async (req, res) => {
  try {
    const { id: session_id } = req.params;
    const {
      product_id,
      quantity_units = 0,
      venue_area_id
    } = req.body;

    // Validate required fields
    if (!product_id || quantity_units === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: product_id and quantity_units are required'
      });
    }

    // Round quantity_units to 2 decimal places and ensure non-negative
    const roundedQuantity = roundToTwoDecimals(quantity_units);
    if (roundedQuantity < 0) {
      return res.status(400).json({
        error: 'quantity_units must be non-negative'
      });
    }

    // Check if session exists and is in progress
    const sessionCheck = await pool.query(
      'SELECT id, status, venue_id FROM stock_sessions WHERE id = $1', 
      [session_id]
    );
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (sessionCheck.rows[0].status !== 'in_progress') {
      return res.status(400).json({ 
        error: 'Cannot add entries to a session that is not in progress' 
      });
    }

    // Verify product exists and belongs to the same venue as the session
    const productCheck = await pool.query(
      'SELECT id, name FROM venue_products WHERE id = $1 AND venue_id = $2',
      [product_id, sessionCheck.rows[0].venue_id]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Product not found or does not belong to this venue' 
      });
    }

    // Check if entry already exists for this product in this session
    const existingEntry = await pool.query(
      'SELECT id FROM stock_entries WHERE session_id = $1 AND product_id = $2',
      [session_id, product_id]
    );

    if (existingEntry.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Stock entry already exists for this product in this session. Use PUT to update.' 
      });
    }

    // Create new stock entry
    const result = await pool.query(
      `INSERT INTO stock_entries
       (session_id, product_id, quantity_units, venue_area_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [session_id, product_id, roundedQuantity, venue_area_id || null]
    );

    // Get entry with product and venue area details for response
    const entryWithProduct = await pool.query(
      `SELECT
         se.*,
         vp.name as product_name,
         mp.brand,
         mp.category,
         mp.unit_type,
         mp.unit_size,
         mp.case_size,
         va.name as venue_area_name
       FROM stock_entries se
       JOIN venue_products vp ON se.product_id = vp.id
       LEFT JOIN master_products mp ON vp.master_product_id = mp.id
       LEFT JOIN venue_areas va ON se.venue_area_id = va.id
       WHERE se.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      message: 'Stock entry created successfully',
      entry: entryWithProduct.rows[0]
    });

  } catch (error) {
    console.error('Error creating stock entry:', error);
    res.status(500).json({ error: 'Failed to create stock entry' });
  }
});

// Add this endpoint after the POST /api/sessions/:id/entries endpoint in your server.js

// Get all entries for a session with product details
app.get('/api/sessions/:id/entries', async (req, res) => {
  try {
    const { id: session_id } = req.params;
    const { category, completed_only } = req.query;

    // Verify session exists
    const sessionCheck = await pool.query('SELECT id FROM stock_sessions WHERE id = $1', [session_id]);
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Build query with optional filters
    let query = `
      SELECT
        se.*,
        vp.name as product_name,
        mp.brand,
        mp.category,
        mp.unit_type,
        mp.unit_size,
        mp.barcode,
        mp.case_size,
        va.name as venue_area_name
      FROM stock_entries se
      JOIN venue_products vp ON se.product_id = vp.id
      LEFT JOIN master_products mp ON vp.master_product_id = mp.id
      LEFT JOIN venue_areas va ON se.venue_area_id = va.id
      WHERE se.session_id = $1
    `;

    const queryParams = [session_id];
    let paramCount = 2;

    if (category) {
      query += ` AND mp.category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }

    if (completed_only === 'true') {
      query += ` AND se.quantity_units > 0`;
    }

    query += ` ORDER BY mp.category, vp.name`;

    const result = await pool.query(query, queryParams);

    // Get summary statistics
    const statsResult = await pool.query(
      `SELECT
         COUNT(*) as total_entries,
         COUNT(CASE WHEN quantity_units > 0 THEN 1 END) as completed_entries,
         COUNT(DISTINCT mp.category) as categories_covered
       FROM stock_entries se
       JOIN venue_products vp ON se.product_id = vp.id
       LEFT JOIN master_products mp ON vp.master_product_id = mp.id
       WHERE se.session_id = $1`,
      [session_id]
    );

    res.json({
      entries: result.rows,
      summary: statsResult.rows[0]
    });

  } catch (error) {
    console.error('Error fetching stock entries:', error);
    res.status(500).json({ error: 'Failed to fetch stock entries' });
  }
});

// Delete stock entry for a product in a session
app.delete('/api/sessions/:sessionId/entries/product/:productId', async (req, res) => {
  try {
    const { sessionId, productId } = req.params;

    await pool.query(
      `DELETE FROM stock_entries WHERE session_id = $1 AND product_id = $2`,
      [sessionId, productId]
    );

    res.json({ success: true, message: 'Stock entry deleted' });
  } catch (error) {
    console.error('Error deleting stock entry:', error);
    res.status(500).json({ error: 'Failed to delete stock entry' });
  }
});

// Add this endpoint after the GET /api/sessions/:id/entries endpoint in your server.js

// Update stock entry (quantity and venue area)
app.put('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quantity_units,
      venue_area_id
    } = req.body;

    // Check if entry exists
    const entryCheck = await pool.query(
      `SELECT se.id, se.session_id, ss.status
       FROM stock_entries se
       JOIN stock_sessions ss ON se.session_id = ss.id
       WHERE se.id = $1`,
      [id]
    );

    if (entryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Stock entry not found' });
    }

    if (entryCheck.rows[0].status !== 'in_progress') {
      return res.status(400).json({
        error: 'Cannot update entries for a session that is not in progress'
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (quantity_units !== undefined) {
      const roundedQuantity = roundToTwoDecimals(quantity_units);
      if (roundedQuantity < 0) {
        return res.status(400).json({
          error: 'quantity_units must be non-negative'
        });
      }
      updateFields.push(`quantity_units = $${paramCount}`);
      values.push(roundedQuantity);
      paramCount++;
    }

    if (venue_area_id !== undefined) {
      updateFields.push(`venue_area_id = $${paramCount}`);
      values.push(venue_area_id);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // Add entry ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE stock_entries
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    // Get updated entry with product and venue area details
    const entryWithProduct = await pool.query(
      `SELECT
         se.*,
         vp.name as product_name,
         mp.brand,
         mp.category,
         mp.unit_type,
         mp.unit_size,
         mp.barcode,
         mp.case_size,
         va.name as venue_area_name
       FROM stock_entries se
       JOIN venue_products vp ON se.product_id = vp.id
       LEFT JOIN master_products mp ON vp.master_product_id = mp.id
       LEFT JOIN venue_areas va ON se.venue_area_id = va.id
       WHERE se.id = $1`,
      [id]
    );

    res.json({
      message: 'Stock entry updated successfully',
      entry: entryWithProduct.rows[0]
    });

  } catch (error) {
    console.error('Error updating stock entry:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to update stock entry' });
  }
});

// Add this endpoint after the PUT /api/entries/:id endpoint in your server.js

// Delete stock entry
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if entry exists and session is in progress
    const entryCheck = await pool.query(
      `SELECT se.id, se.session_id, ss.status, vp.name as product_name
       FROM stock_entries se
       JOIN stock_sessions ss ON se.session_id = ss.id
       JOIN venue_products vp ON se.product_id = vp.id
       WHERE se.id = $1`,
      [id]
    );

    if (entryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Stock entry not found' });
    }

    if (entryCheck.rows[0].status !== 'in_progress') {
      return res.status(400).json({ 
        error: 'Cannot delete entries from a session that is not in progress' 
      });
    }

    // Delete the entry
    await pool.query('DELETE FROM stock_entries WHERE id = $1', [id]);

    res.json({
      message: 'Stock entry deleted successfully',
      deleted_product: entryCheck.rows[0].product_name
    });

  } catch (error) {
    console.error('Error deleting stock entry:', error);
    res.status(500).json({ error: 'Failed to delete stock entry' });
  }
});

// Add this endpoint after the DELETE /api/entries/:id endpoint in your server.js

// Get session progress summary
app.get('/api/sessions/:id/progress', async (req, res) => {
  try {
    const { id: session_id } = req.params;

    // Verify session exists
    const sessionCheck = await pool.query('SELECT id, status FROM stock_sessions WHERE id = $1', [session_id]);
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get detailed progress information
    const progressResult = await pool.query(
      `SELECT
         -- Total products available for this venue
         venue_products.total_products,
         -- Products with stock entries
         COALESCE(entries.products_counted, 0) as products_counted,
         -- Products with completed quantities (not null)
         COALESCE(entries.products_completed, 0) as products_completed,
         -- Category breakdown
         COALESCE(entries.categories_data, '[]'::json) as categories_breakdown
       FROM (
         -- Get total products for the venue
         SELECT
           COUNT(*) as total_products
         FROM venue_products vp
         JOIN stock_sessions ss ON vp.venue_id = ss.venue_id
         WHERE ss.id = $1
       ) venue_products
       LEFT JOIN (
         -- Get entry statistics
         SELECT
           COUNT(DISTINCT se.product_id) as products_counted,
           COUNT(CASE WHEN se.quantity_units > 0 THEN 1 END) as products_completed,
           json_agg(
             json_build_object(
               'category', mp.category,
               'total', category_stats.total,
               'counted', category_stats.counted,
               'completed', category_stats.completed
             )
           ) as categories_data
         FROM stock_entries se
         JOIN venue_products vp ON se.product_id = vp.id
         LEFT JOIN master_products mp ON vp.master_product_id = mp.id
         JOIN (
           -- Category-wise breakdown
           SELECT
             mp2.category,
             COUNT(*) as total,
             COUNT(se2.id) as counted,
             COUNT(CASE WHEN se2.quantity_units > 0 THEN 1 END) as completed
           FROM venue_products vp2
           LEFT JOIN master_products mp2 ON vp2.master_product_id = mp2.id
           JOIN stock_sessions ss2 ON vp2.venue_id = ss2.venue_id AND ss2.id = $1
           LEFT JOIN stock_entries se2 ON vp2.id = se2.product_id AND se2.session_id = $1
           GROUP BY mp2.category
         ) category_stats ON mp.category = category_stats.category
         WHERE se.session_id = $1
       ) entries ON true`,
      [session_id]
    );

    const progress = progressResult.rows[0];
    const completionPercentage = progress.total_products > 0 
      ? Math.round((progress.products_completed / progress.total_products) * 100) 
      : 0;

    res.json({
      session_id,
      status: sessionCheck.rows[0].status,
      progress: {
        total_products: parseInt(progress.total_products),
        products_counted: parseInt(progress.products_counted),
        products_completed: parseInt(progress.products_completed),
        completion_percentage: completionPercentage,
        categories_breakdown: progress.categories_breakdown || []
      }
    });

  } catch (error) {
    console.error('Error fetching session progress:', error);
    res.status(500).json({ error: 'Failed to fetch session progress' });
  }
});


// ===== MASTER PRODUCTS ENDPOINTS =====


// Get master product by ID
app.get('/api/master-products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM master_products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Master product not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching master product:', error);
    res.status(500).json({ error: 'Failed to fetch master product' });
  }
});


// Link venue product to master product
app.post('/api/venues/:venueId/products/:productId/link-master', async (req, res) => {
  try {
    const { venueId, productId } = req.params;
    const { masterProductId } = req.body;

    if (!masterProductId) {
      return res.status(400).json({ error: 'Master product ID is required' });
    }

    // Update the venue product to link to master product
    const result = await pool.query(
      `UPDATE venue_products
       SET master_product_id = $1
       WHERE id = $2 AND venue_id = $3
       RETURNING *`,
      [masterProductId, productId, venueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product linked to master database successfully',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error linking product to master:', error);
    res.status(500).json({ error: 'Failed to link product' });
  }
});

// Supplier Mapping Service
const SupplierMappingService = require('./supplier-mapping-service');
const supplierMappingService = new SupplierMappingService(pool);

// ==================== SUPPLIER MAPPING ENDPOINTS ====================

// Get all suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.sup_id,
        s.sup_name,
        s.sup_contact_person,
        s.sup_email,
        s.sup_phone,
        s.sup_address,
        s.sup_website,
        s.sup_account_number,
        s.sup_payment_terms,
        s.sup_delivery_days,
        s.sup_minimum_order,
        s.sup_active,
        s.sup_created_at,
        s.sup_updated_at,
        COUNT(sil.id) as item_count
      FROM suppliers s
      LEFT JOIN supplier_item_list sil ON s.sup_id = sil.supplier_id
      WHERE s.sup_active = true
      GROUP BY s.sup_id
      ORDER BY s.sup_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Create new supplier
app.post('/api/suppliers', async (req, res) => {
  try {
    const {
      sup_name,
      sup_contact_person,
      sup_email,
      sup_phone,
      sup_address,
      sup_website,
      sup_account_number,
      sup_payment_terms,
      sup_delivery_days,
      sup_minimum_order
    } = req.body;

    if (!sup_name || sup_name.trim() === '') {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const { v4: uuidv4 } = require('uuid');
    const supplierId = uuidv4();

    const result = await pool.query(`
      INSERT INTO suppliers (
        sup_id,
        sup_name,
        sup_contact_person,
        sup_email,
        sup_phone,
        sup_address,
        sup_website,
        sup_account_number,
        sup_payment_terms,
        sup_delivery_days,
        sup_minimum_order,
        sup_active,
        sup_created_at,
        sup_updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())
      RETURNING *
    `, [
      supplierId,
      sup_name.trim(),
      sup_contact_person || null,
      sup_email || null,
      sup_phone || null,
      sup_address || null,
      sup_website || null,
      sup_account_number || null,
      sup_payment_terms || null,
      sup_delivery_days || null,
      sup_minimum_order || null
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Supplier created successfully'
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier', message: error.message });
  }
});

// Get supplier by ID with mappings
app.get('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const supplierResult = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    if (supplierResult.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const mappingsResult = await pool.query(`
      SELECT spm.*, mp.name as master_product_name
      FROM supplier_product_mappings spm
      JOIN master_products mp ON spm.master_product_id = mp.id
      WHERE spm.supplier_id = $1
      ORDER BY spm.created_at DESC
    `, [id]);

    const supplier = supplierResult.rows[0];
    supplier.mappings = mappingsResult.rows;

    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

// Process Bookers invoice data
app.post('/api/suppliers/bookers/process', async (req, res) => {
  try {
    const { invoiceData } = req.body; // Array of Bookers invoice items

    if (!Array.isArray(invoiceData)) {
      return res.status(400).json({ error: 'Invoice data must be an array' });
    }

    // Get Bookers supplier ID
    const supplierResult = await pool.query("SELECT id FROM suppliers WHERE name = 'Bookers'");
    if (supplierResult.rows.length === 0) {
      return res.status(400).json({ error: 'Bookers supplier not found. Run migration first.' });
    }

    const supplierId = supplierResult.rows[0].id;
    const results = [];

    for (const item of invoiceData) {
      try {
        const masterProduct = await supplierMappingService.findOrCreateMasterProduct(item, supplierId);
        results.push({
          success: true,
          supplier_data: item,
          master_product: masterProduct
        });
      } catch (error) {
        console.error('Error processing item:', item, error);
        results.push({
          success: false,
          supplier_data: item,
          error: error.message
        });
      }
    }

    res.json({
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    console.error('Error processing Bookers data:', error);
    res.status(500).json({ error: 'Failed to process invoice data' });
  }
});

// Process CSV data with custom field mapping
app.post('/api/suppliers/:id/process-csv', async (req, res) => {
  try {
    const { id } = req.params;
    const { csvData, fieldMapping } = req.body;

    if (!Array.isArray(csvData)) {
      return res.status(400).json({ error: 'CSV data must be an array' });
    }

    const results = await supplierMappingService.processCSVData(csvData, id, fieldMapping);

    res.json({
      processed: results.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results
    });

  } catch (error) {
    console.error('Error processing CSV data:', error);
    res.status(500).json({ error: 'Failed to process CSV data' });
  }
});


// =============================================
// SUPPLIER INVOICE PREFERENCES ENDPOINTS
// Column mapping preferences for invoice imports per supplier
// =============================================

// Get supplier invoice preferences
app.get('/api/suppliers/:supplierId/invoice-preferences', async (req, res) => {
  try {
    const { supplierId } = req.params;

    const result = await pool.query(
      `SELECT * FROM supplier_invoice_preferences WHERE supplier_id = $1`,
      [supplierId]
    );

    if (result.rows.length === 0) {
      // Return default preferences if none exist
      return res.json({
        success: true,
        data: {
          preferences: {
            invoice_number_column: -1,
            invoice_date_column: -1,
            delivery_number_column: -1,
            date_ordered_column: -1,
            date_delivered_column: -1,
            customer_ref_column: -1,
            subtotal_column: -1,
            vat_total_column: -1,
            total_amount_column: -1,
            product_code_column: -1,
            product_name_column: 0,
            product_description_column: -1,
            quantity_column: -1,
            unit_price_column: -1,
            nett_price_column: -1,
            vat_code_column: -1,
            vat_rate_column: -1,
            vat_amount_column: -1,
            line_total_column: -1,
            import_method: 'csv',
            date_format: 'DD/MM/YYYY',
            currency: 'GBP'
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        preferences: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Error fetching supplier invoice preferences:', error);
    res.status(500).json({ error: 'Failed to fetch supplier invoice preferences' });
  }
});

// Save supplier invoice preferences
app.put('/api/suppliers/:supplierId/invoice-preferences', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const {
      invoice_number_column,
      invoice_date_column,
      delivery_number_column,
      date_ordered_column,
      date_delivered_column,
      customer_ref_column,
      subtotal_column,
      vat_total_column,
      total_amount_column,
      product_code_column,
      product_name_column,
      product_description_column,
      quantity_column,
      unit_price_column,
      nett_price_column,
      vat_code_column,
      vat_rate_column,
      vat_amount_column,
      line_total_column,
      import_method,
      date_format,
      currency,
      updated_by
    } = req.body;

    // Upsert preferences
    const result = await pool.query(
      `INSERT INTO supplier_invoice_preferences (
        supplier_id,
        invoice_number_column,
        invoice_date_column,
        delivery_number_column,
        date_ordered_column,
        date_delivered_column,
        customer_ref_column,
        subtotal_column,
        vat_total_column,
        total_amount_column,
        product_code_column,
        product_name_column,
        product_description_column,
        quantity_column,
        unit_price_column,
        nett_price_column,
        vat_code_column,
        vat_rate_column,
        vat_amount_column,
        line_total_column,
        import_method,
        date_format,
        currency,
        updated_by,
        last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, CURRENT_TIMESTAMP)
      ON CONFLICT (supplier_id)
      DO UPDATE SET
        invoice_number_column = $2,
        invoice_date_column = $3,
        delivery_number_column = $4,
        date_ordered_column = $5,
        date_delivered_column = $6,
        customer_ref_column = $7,
        subtotal_column = $8,
        vat_total_column = $9,
        total_amount_column = $10,
        product_code_column = $11,
        product_name_column = $12,
        product_description_column = $13,
        quantity_column = $14,
        unit_price_column = $15,
        nett_price_column = $16,
        vat_code_column = $17,
        vat_rate_column = $18,
        vat_amount_column = $19,
        line_total_column = $20,
        import_method = $21,
        date_format = $22,
        currency = $23,
        updated_by = $24,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        supplierId,
        invoice_number_column,
        invoice_date_column,
        delivery_number_column,
        date_ordered_column,
        date_delivered_column,
        customer_ref_column,
        subtotal_column,
        vat_total_column,
        total_amount_column,
        product_code_column,
        product_name_column,
        product_description_column,
        quantity_column,
        unit_price_column,
        nett_price_column,
        vat_code_column,
        vat_rate_column,
        vat_amount_column,
        line_total_column,
        import_method || 'csv',
        date_format || 'DD/MM/YYYY',
        currency || 'GBP',
        updated_by || 'user'
      ]
    );

    res.json({
      success: true,
      data: {
        preferences: result.rows[0]
      },
      message: 'Supplier invoice preferences saved successfully'
    });

  } catch (error) {
    console.error('Error saving supplier invoice preferences:', error);
    res.status(500).json({ error: 'Failed to save supplier invoice preferences' });
  }
});

// =============================================
// INVOICE PDF/OCR PROCESSING ENDPOINTS
// =============================================

// Import OCR utility
const { extractTextFromScannedPDF, parseOCRInvoiceText } = require('./utils/ocrParser');

// Upload and process invoice PDF with OCR
app.post('/api/invoices/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log('Processing PDF:', req.file.originalname);

    // Extract text from scanned PDF using OCR
    const extracted = await extractTextFromScannedPDF(req.file.buffer);

    // Parse the extracted text
    const parsed = parseOCRInvoiceText(extracted.text);

    res.json({
      success: true,
      data: {
        filename: req.file.originalname,
        pageCount: extracted.pageCount,
        text: extracted.text,
        header: parsed.header,
        items: parsed.items,
        lines: parsed.lines
      }
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({
      error: 'Failed to process PDF',
      message: error.message
    });
  }
});

// =============================================
// SUPPLIER INVOICE PDF PARSING
// =============================================

// Helper function to parse supplier invoice PDF
async function parseSupplierInvoicePDF(buffer) {
  let parser;
  try {
    parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText();
    const text = pdfData.text;

    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    // === HEADER EXTRACTION ===

    // Extract supplier name (usually near the top)
    let supplierName = null;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i];
      if (line.match(/limited|ltd|plc|uk|suppliers?|booker/i) && line.length > 5 && line.length < 80) {
        supplierName = line;
        break;
      }
    }

    // Extract invoice number (INVOICE NUMBER followed by 7 digits)
    let invoiceNumber = null;
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];
      // Look for "INVOICE NUMBER" or "INVOICE NO" followed by 7 digits
      const invoiceMatch = line.match(/INVOICE\s+(?:NUMBER|NO)[:\s]*(\d{7})/i);
      if (invoiceMatch) {
        invoiceNumber = invoiceMatch[1];
        console.log('Found invoice number:', invoiceNumber);
        break;
      }
    }

    // Extract invoice date (look for date patterns near invoice number)
    let invoiceDate = null;
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];
      // Look for various date formats: DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY, DD-MM-YY
      const dateMatch = line.match(/(?:DATE|DATED?)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i) ||
                       line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);

      if (dateMatch) {
        const dateParts = dateMatch[1].split(/[\/\-]/);
        // Assume DD/MM/YYYY or DD/MM/YY format (UK standard)
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, '0');
          const month = dateParts[1].padStart(2, '0');
          let year = dateParts[2];

          // Handle 2-digit years (YY)
          if (year.length === 2) {
            const currentYear = new Date().getFullYear();
            const currentCentury = Math.floor(currentYear / 100) * 100;
            const twoDigitYear = parseInt(year);

            // Assume 20xx for years 00-30, 19xx for years 31-99
            if (twoDigitYear <= 30) {
              year = (currentCentury + twoDigitYear).toString();
            } else {
              year = (currentCentury - 100 + twoDigitYear).toString();
            }
          }

          invoiceDate = `${year}-${month}-${day}`; // Convert to YYYY-MM-DD
          console.log('Found invoice date:', invoiceDate);
          break;
        }
      }
    }

    // Extract customer account number
    let customerNumber = null;
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];
      // Look for "ACCOUNT" or "CUSTOMER" followed by number
      const accountMatch = line.match(/(?:ACCOUNT|CUSTOMER|A\/C)(?:\s+(?:NUMBER|NO|NUM|#))?[:\s]*(\d{5,10})/i);
      if (accountMatch) {
        customerNumber = accountMatch[1];
        console.log('Found customer number:', customerNumber);
        break;
      }
    }

    // Extract delivery number if present
    let deliveryNumber = null;
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];
      const deliveryMatch = line.match(/DELIVERY\s+(?:NUMBER|NO|NOTE)[:\s]*(\d+)/i);
      if (deliveryMatch) {
        deliveryNumber = deliveryMatch[1];
        console.log('Found delivery number:', deliveryNumber);
        break;
      }
    }

    // === PRODUCT EXTRACTION (BOOKER-SPECIFIC) ===
    const products = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // BOOKER SPECIFIC: Only parse lines starting with 6-digit numeric
      const startsWithSixDigits = /^\d{6}/.test(line);

      if (!startsWithSixDigits) {
        continue; // Skip lines that don't start with 6 digits (headers, etc.)
      }

      // Look for lines with price patterns (e.g., "£12.50" or "12.50")
      const priceMatch = line.match(/£?(\d+\.\d{2})/g);

      if (priceMatch && line.length > 10) {
        // Extract the 6-digit SKU from the start
        const sku = line.substring(0, 6);

        // The rest of the line after SKU contains product info
        const remainder = line.substring(6).trim();

        // Booker format uses tabs to separate fields
        // Format: ProductName [tab] Pack Size [tab] Qty [tab] Price [tab] Total [tab] VAT
        // BUT: Some product names contain tabs, so we need to find the pack/size field intelligently
        const tabParts = remainder.split(/\t+/);

        let packSize = '';
        let unitSize = '';
        let packSizeFieldIndex = -1;

        // Find which tab field contains the pack/size pattern "number space unit"
        // This handles cases where product name itself has tabs (e.g., "CLE 2 [tab] Ply Blue Centrefeed")
        for (let i = 0; i < tabParts.length; i++) {
          const field = tabParts[i].trim();
          // Expanded units: ml, g, cl, l, kg, s (sheets/pieces), pk (pack), cm
          const packAndSizeMatch = field.match(/^(\d+)\s+([\d.]+(?:ml|g|cl|l|kg|s|pk|cm))/i);

          if (packAndSizeMatch) {
            packSize = packAndSizeMatch[1]; // e.g., "1", "24"
            unitSize = packAndSizeMatch[2]; // e.g., "330ml", "10s", "125s", "6pk"
            packSizeFieldIndex = i;
            break;
          }
        }

        // Product name is everything before the pack/size field
        let productName = '';
        if (packSizeFieldIndex > 0) {
          productName = tabParts.slice(0, packSizeFieldIndex).join(' ').trim();
        } else if (tabParts.length > 0) {
          productName = tabParts[0].trim();
        }

        // If no pack/size found via tabs, try fallback patterns
        if (!packSize && !unitSize) {
          // Try "24x330ml" format
          const xFormatMatch = remainder.match(/(\d+)\s*x\s*([\d.]+(?:ml|g|cl|l|kg|s|pk|cm))/i);
          if (xFormatMatch) {
            packSize = xFormatMatch[1];
            unitSize = xFormatMatch[2];
            productName = productName.replace(/\d+\s*x\s*[\d.]+(?:ml|g|cl|l|kg|s|pk|cm)/i, '').trim();
          } else {
            // Try to find just a size anywhere
            const sizeOnlyMatch = remainder.match(/([\d.]+(?:ml|g|cl|l|kg|s|pk|cm))/i);
            if (sizeOnlyMatch) {
              unitSize = sizeOnlyMatch[1];
              packSize = '1';
            }
          }
        }

        // Extract prices
        const prices = priceMatch.map(p => parseFloat(p.replace('£', '')));
        const unitPrice = prices[0] || 0;

        // Quantity is the field after pack/size field
        let quantity = 1;
        if (packSizeFieldIndex >= 0 && tabParts.length > packSizeFieldIndex + 1) {
          const qtyField = tabParts[packSizeFieldIndex + 1].trim();
          const qtyNum = parseInt(qtyField);
          if (!isNaN(qtyNum)) {
            quantity = qtyNum;
          }
        } else {
          // Fallback: look for number before prices
          const qtyMatch = remainder.match(/\s+(\d+)\s+£?[\d.]+/);
          if (qtyMatch) {
            quantity = parseInt(qtyMatch[1]);
          }
        }

        // Clean product name - remove any size info that leaked in
        productName = productName.replace(/\d+\s*x\s*[\d.]+(?:ml|g|cl|l|kg|s|pk|cm)/i, '').trim();
        productName = productName.replace(/\s+\d+(?:ml|g|cl|l|kg|s|pk|cm)\b/i, '').trim();

        if (productName.length > 2) {
          products.push({
            sku: sku,
            name: productName,
            description: productName,
            unitSize: unitSize,
            packSize: packSize,
            unitCost: unitPrice,
            caseSize: quantity,
            selected: true // Default to selected
          });
        }
      }
    }

    console.log(`Parsed ${products.length} products from invoice`);

    return {
      supplierName: supplierName || 'Unknown Supplier',
      invoiceNumber: invoiceNumber,
      invoiceDate: invoiceDate,
      customerNumber: customerNumber,
      deliveryNumber: deliveryNumber,
      products: products,
      totalPages: pdfData.total || 1
    };

  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}

// Parse supplier invoice PDF without saving
app.post('/api/invoices/parse-supplier-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log('Parsing supplier invoice PDF:', req.file.originalname);

    const parsedData = await parseSupplierInvoicePDF(req.file.buffer);

    res.json({
      success: true,
      data: {
        filename: req.file.originalname,
        supplier: parsedData.supplierName,
        invoiceNumber: parsedData.invoiceNumber,
        invoiceDate: parsedData.invoiceDate,
        customerNumber: parsedData.customerNumber,
        deliveryNumber: parsedData.deliveryNumber,
        products: parsedData.products,
        totalPages: parsedData.totalPages,
        totalProducts: parsedData.products.length
      }
    });

  } catch (error) {
    console.error('Error parsing supplier PDF:', error);
    res.status(500).json({
      error: 'Failed to parse PDF',
      message: error.message
    });
  }
});

// Upload selected supplier products
app.post('/api/invoices/upload-supplier-products', async (req, res) => {
  const client = await pool.connect();

  try {
    const { supplierName, products } = req.body;

    if (!supplierName || !products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    await client.query('BEGIN');

    // Find or create supplier
    let supplierId;
    const existingSupplier = await client.query(
      'SELECT sup_id FROM suppliers WHERE sup_name ILIKE $1',
      [supplierName]
    );

    if (existingSupplier.rows.length > 0) {
      supplierId = existingSupplier.rows[0].sup_id;
    } else {
      const newSupplier = await client.query(
        `INSERT INTO suppliers (sup_name, sup_active)
         VALUES ($1, true)
         RETURNING sup_id`,
        [supplierName]
      );
      supplierId = newSupplier.rows[0].sup_id;
    }

    // Insert products
    let addedCount = 0;
    let skippedCount = 0;
    const addedProducts = [];

    for (const product of products) {
      // Check if product already exists
      const existing = await client.query(
        `SELECT id FROM supplier_item_list
         WHERE supplier_id = $1 AND supplier_sku = $2`,
        [supplierId, product.sku]
      );

      if (existing.rows.length > 0) {
        skippedCount++;
        continue;
      }

      // Insert new product
      const result = await client.query(
        `INSERT INTO supplier_item_list (
          supplier_id, supplier_sku, supplier_name, supplier_description,
          supplier_size, unit_cost, case_size, pack_size, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING *`,
        [
          supplierId,
          product.sku,
          product.name,
          product.description || product.name,
          product.unitSize || '',
          product.unitCost,
          product.caseSize || 1,
          product.packSize || ''
        ]
      );

      addedProducts.push(result.rows[0]);
      addedCount++;
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        supplierId: supplierId,
        addedCount: addedCount,
        skippedCount: skippedCount,
        products: addedProducts
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading supplier products:', error);
    res.status(500).json({
      error: 'Failed to upload products',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// =============================================
// STEP 2: CREATE INVOICE & LINE ITEMS
// =============================================

// NOTE: Invoice creation is handled by the unified endpoint below (app.post('/api/invoices'))

// =============================================
// STEP 3: MATCH INVOICE ITEMS TO SUPPLIER ITEMS
// =============================================

// Match invoice line items to supplier_item_list and auto-create missing entries
app.post('/api/invoices/:invoiceId/match-supplier-items', async (req, res) => {
  const client = await pool.connect();

  try {
    const { invoiceId } = req.params;

    await client.query('BEGIN');

    // Get invoice with supplier info
    const invoiceResult = await client.query(
      'SELECT id, supplier_id FROM invoices WHERE id = $1',
      [invoiceId]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];

    // Get all line items for this invoice
    const lineItemsResult = await client.query(
      'SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY line_number',
      [invoiceId]
    );

    const matchResults = {
      matched: [],
      created: [],
      failed: []
    };

    // Process each line item
    for (const lineItem of lineItemsResult.rows) {
      try {
        // Try to find existing supplier item by SKU
        let supplierItemId = null;
        let masterProductId = null;

        if (lineItem.product_code) {
          const existingItem = await client.query(
            `SELECT id, master_product_id
             FROM supplier_item_list
             WHERE supplier_id = $1 AND supplier_sku = $2`,
            [invoice.supplier_id, lineItem.product_code]
          );

          if (existingItem.rows.length > 0) {
            // Match found!
            supplierItemId = existingItem.rows[0].id;
            masterProductId = existingItem.rows[0].master_product_id;

            // Update line item with links
            await client.query(
              `UPDATE invoice_line_items
               SET supplier_item_list_id = $1, master_product_id = $2
               WHERE id = $3`,
              [supplierItemId, masterProductId, lineItem.id]
            );

            matchResults.matched.push({
              lineItemId: lineItem.id,
              productName: lineItem.product_name,
              supplierItemId: supplierItemId,
              masterProductId: masterProductId,
              status: 'matched'
            });

            continue;
          }
        }

        // No supplier SKU match found - try Tier 2: Fuzzy match against master_products
        const searchTerm = lineItem.product_name.trim();

        const fuzzyMatchResult = await client.query(
          `SELECT
            id,
            name,
            similarity(name, $1) as name_similarity,
            CASE
              -- TIER 1: Exact prefix match (score 100+)
              WHEN LOWER(name) LIKE LOWER($2) || '%' THEN 100 + similarity(name, $1) * 0.1

              -- TIER 2: Word start match (score 80+)
              WHEN LOWER(name) ~ ('(^|[^a-z0-9])' || LOWER($2)) THEN 80 + similarity(name, $1) * 0.1

              -- TIER 3: High similarity fuzzy match (50%+, score 60+)
              WHEN similarity(name, $1) > 0.50 THEN 60 + similarity(name, $1) * 10

              -- TIER 4: Moderate similarity fuzzy match (35%+, score 40+)
              WHEN similarity(name, $1) > 0.35 THEN 40 + similarity(name, $1) * 10

              ELSE 0
            END as relevance_score
           FROM master_products
           WHERE active = true
             AND (
               similarity(name, $1) > 0.35
               OR LOWER(name) LIKE LOWER($2) || '%'
               OR LOWER(name) ~ ('(^|[^a-z0-9])' || LOWER($2))
             )
           ORDER BY relevance_score DESC, name_similarity DESC
           LIMIT 1`,
          [searchTerm, searchTerm]
        );

        // Determine if we found a good fuzzy match (score >= 60)
        const bestMatch = fuzzyMatchResult.rows.length > 0 ? fuzzyMatchResult.rows[0] : null;
        const confidenceScore = bestMatch ? bestMatch.relevance_score : 0;
        const isAutoMatched = bestMatch && confidenceScore >= 60;

        if (isAutoMatched) {
          masterProductId = bestMatch.id;
        }

        // Create new supplier_item_list entry (with or without master_product_id)
        const newItemResult = await client.query(
          `INSERT INTO supplier_item_list (
            supplier_id,
            supplier_sku,
            supplier_name,
            supplier_description,
            master_product_id,
            auto_matched,
            confidence_score,
            active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
          RETURNING id`,
          [
            invoice.supplier_id,
            lineItem.product_code || `AUTO-${lineItem.id}`,
            lineItem.product_name,
            lineItem.product_description,
            masterProductId,
            isAutoMatched,
            confidenceScore
          ]
        );

        supplierItemId = newItemResult.rows[0].id;

        // Update line item with links
        await client.query(
          `UPDATE invoice_line_items
           SET supplier_item_list_id = $1, master_product_id = $2
           WHERE id = $3`,
          [supplierItemId, masterProductId, lineItem.id]
        );

        // Categorize result
        if (isAutoMatched) {
          matchResults.created.push({
            lineItemId: lineItem.id,
            productName: lineItem.product_name,
            supplierItemId: supplierItemId,
            masterProductId: masterProductId,
            matchedTo: bestMatch.name,
            confidenceScore: Math.round(confidenceScore),
            status: 'created'
          });
        } else {
          matchResults.failed.push({
            lineItemId: lineItem.id,
            productName: lineItem.product_name,
            supplierItemId: supplierItemId,
            masterProductId: null,
            bestGuess: bestMatch ? bestMatch.name : null,
            confidenceScore: bestMatch ? Math.round(confidenceScore) : 0,
            status: 'needs_master_match'
          });
        }

      } catch (itemError) {
        console.error('Error processing line item:', lineItem.id, itemError);
        matchResults.failed.push({
          lineItemId: lineItem.id,
          productName: lineItem.product_name,
          error: itemError.message
        });
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        invoiceId: invoiceId,
        totalItems: lineItemsResult.rows.length,
        matched: matchResults.matched.length,
        created: matchResults.created.length,
        failed: matchResults.failed.length,
        results: matchResults
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error matching supplier items:', error);
    res.status(500).json({
      error: 'Failed to match supplier items',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// ===================================
// STEP 4: Master Product Fuzzy Matching
// ===================================

// NOTE: Product search consolidated into app.post('/api/master-products/search') at line 618

// Link an invoice line item to a master product
app.put('/api/invoice-line-items/:id/link-master-product', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { masterProductId, confidenceScore, verified = true } = req.body;

    if (!masterProductId) {
      return res.status(400).json({ error: 'masterProductId is required' });
    }

    await client.query('BEGIN');

    // Get the line item with its supplier_item_list_id
    const lineItemResult = await client.query(
      'SELECT id, supplier_item_list_id FROM invoice_line_items WHERE id = $1',
      [id]
    );

    if (lineItemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice line item not found' });
    }

    const lineItem = lineItemResult.rows[0];

    // Update the line item with master_product_id
    await client.query(
      'UPDATE invoice_line_items SET master_product_id = $1 WHERE id = $2',
      [masterProductId, id]
    );

    // Update the supplier_item_list entry with master_product_id and matching metadata
    if (lineItem.supplier_item_list_id) {
      await client.query(
        `UPDATE supplier_item_list
         SET master_product_id = $1,
             verified = $2,
             confidence_score = $3,
             auto_matched = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          masterProductId,
          verified,
          confidenceScore || null,
          confidenceScore >= 80, // Consider auto-matched if confidence >= 80%
          lineItem.supplier_item_list_id
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        lineItemId: id,
        masterProductId: masterProductId,
        supplierItemListId: lineItem.supplier_item_list_id,
        verified: verified,
        confidenceScore: confidenceScore
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error linking master product:', error);
    res.status(500).json({
      error: 'Failed to link master product',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// Check for duplicate invoices
app.get('/api/invoices/check-duplicate', async (req, res) => {
  try {
    const { supplier_id, invoice_number } = req.query;

    if (!supplier_id || !invoice_number) {
      return res.status(400).json({
        error: 'supplier_id and invoice_number are required',
        duplicate: false
      });
    }

    const result = await pool.query(
      `SELECT id, invoice_date, created_at, total_amount, payment_status
       FROM invoices
       WHERE supplier_id = $1 AND invoice_number = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [supplier_id, invoice_number]
    );

    if (result.rows.length > 0) {
      const existingInvoice = result.rows[0];
      return res.json({
        duplicate: true,
        existingInvoice: {
          id: existingInvoice.id,
          invoiceNumber: invoice_number,
          invoiceDate: existingInvoice.invoice_date,
          totalAmount: existingInvoice.total_amount,
          createdAt: existingInvoice.created_at
        }
      });
    } else {
      return res.json({
        duplicate: false,
        existingInvoice: null
      });
    }
  } catch (error) {
    console.error('Error checking for duplicate invoices:', error);
    res.status(500).json({
      error: 'Failed to check for duplicate invoices',
      message: error.message,
      duplicate: false
    });
  }
});

// Create manual invoice with line items
app.post('/api/invoices', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      invoice_number,
      venue_id,
      supplier_id,
      invoice_date,
      date_ordered,
      date_delivered,
      delivery_number,
      customer_ref,
      subtotal,
      vat_total,
      total_amount,
      currency = 'GBP',
      payment_status = 'pending',
      notes,
      line_items, // Array of line items
      force_create = false // Allow creating duplicates (for testing)
    } = req.body;

    // Validate required fields
    if (!venue_id || !supplier_id || !invoice_date || !line_items || !Array.isArray(line_items) || line_items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Missing required fields: venue_id, supplier_id, invoice_date, and line_items are required'
      });
    }

    // Generate invoice ID
    const { v4: uuidv4 } = require('uuid');
    const invoiceId = uuidv4();

    // If force_create is true, delete any existing invoice with same supplier_id and invoice_number
    if (force_create) {
      await client.query(
        `DELETE FROM invoices WHERE supplier_id = $1 AND invoice_number = $2`,
        [supplier_id, invoice_number]
      );
      console.log(`Force creating invoice: deleted any existing invoice ${invoice_number} for supplier ${supplier_id}`);
    }

    // Insert invoice
    const invoiceInsert = await client.query(`
      INSERT INTO invoices (
        id, invoice_number, venue_id, supplier_id,
        invoice_date, date_ordered, date_delivered,
        delivery_number, customer_ref,
        subtotal, vat_total, total_amount, currency,
        payment_status, import_method, notes,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `, [
      invoiceId,
      invoice_number,
      venue_id,
      supplier_id,
      invoice_date,
      date_ordered,
      date_delivered,
      delivery_number,
      customer_ref,
      subtotal,
      vat_total,
      total_amount,
      currency,
      payment_status,
      'manual',
      notes
    ]);

    // Insert line items
    const lineItemInserts = [];
    for (let i = 0; i < line_items.length; i++) {
      const item = line_items[i];

      const lineItemResult = await client.query(`
        INSERT INTO invoice_line_items (
          invoice_id,
          master_product_id,
          supplier_item_list_id,
          line_number,
          product_code,
          product_name,
          product_description,
          quantity,
          unit_price,
          nett_price,
          vat_code,
          vat_rate,
          vat_amount,
          line_total,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING *
      `, [
        invoiceId,
        item.master_product_id || null,
        item.supplier_item_list_id || null,
        i + 1,
        item.product_code || '',
        item.product_name || '',
        item.product_description || '',
        item.quantity || 0,
        item.unit_price || 0,
        item.nett_price || item.unit_price || 0,
        item.vat_code || 'S',
        item.vat_rate || 20,
        item.vat_amount || 0,
        item.line_total || 0
      ]);

      lineItemInserts.push(lineItemResult.rows[0]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        invoice: invoiceInsert.rows[0],
        line_items: lineItemInserts
      },
      message: 'Invoice created successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating invoice:', error);

    // Handle specific database errors
    if (error.code === '23505' && error.constraint === 'unique_invoice_number_supplier') {
      // Unique constraint violation - duplicate invoice
      return res.status(409).json({
        error: 'Duplicate invoice',
        message: `An invoice with number "${invoice_number}" from this supplier already exists. Enable the duplicate check in testing mode to see details, or use a different invoice number.`,
        code: 'DUPLICATE_INVOICE'
      });
    }

    res.status(500).json({
      error: 'Failed to create invoice',
      message: error.message
    });
  } finally {
    client.release();
  }
});

// =============================================
// USER PROFILE MANAGEMENT ENDPOINTS
// Single-user system - manages the active user profile
// =============================================

// Get current user profile
app.get('/api/user/profile', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, first_name, last_name,
        address_line_1, address_line_2, city, county, postcode, country,
        mobile_phone, home_phone, work_phone, whatsapp_number,
        primary_email, work_email, personal_email,
        facebook_handle, instagram_handle, twitter_handle, linkedin_handle,
        company_name, job_title,
        preferred_language, timezone, date_format, currency,
        profile_complete, active,
        share_phone, share_email, share_social_media,
        notes,
        created_at, updated_at, last_login
      FROM user_profiles
      WHERE active = true
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userProfile = result.rows[0];
    res.json({
      success: true,
      profile: userProfile
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile (PUT for updating existing profile)
app.put('/api/user/profile', async (req, res) => {
  try {
    const profileData = req.body;

    // Get the current active user ID (or create if none exists)
    const currentUser = await pool.query('SELECT id FROM user_profiles WHERE active = true LIMIT 1');

    let userId;
    let isNewProfile = false;

    if (currentUser.rows.length === 0) {
      // No profile exists - create a new one
      const newUser = await pool.query(`
        INSERT INTO user_profiles (first_name, last_name, active, profile_complete)
        VALUES ('', '', true, false)
        RETURNING id
      `);
      userId = newUser.rows[0].id;
      isNewProfile = true;
    } else {
      userId = currentUser.rows[0].id;
    }

    // Build dynamic update query based on provided fields
    const allowedFields = [
      'first_name', 'last_name',
      'address_line_1', 'address_line_2', 'city', 'county', 'postcode', 'country',
      'mobile_phone', 'home_phone', 'work_phone', 'whatsapp_number',
      'primary_email', 'work_email', 'personal_email',
      'facebook_handle', 'instagram_handle', 'twitter_handle', 'linkedin_handle',
      'company_name', 'job_title',
      'preferred_language', 'timezone', 'date_format', 'currency',
      'share_phone', 'share_email', 'share_social_media',
      'notes'
    ];

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(profileData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // Check if profile should be marked as complete
    const essentialFields = ['first_name', 'last_name', 'primary_email', 'mobile_phone'];
    const hasEssentialFields = essentialFields.every(field =>
      profileData[field] || updateFields.some(f => f.startsWith(field))
    );

    if (hasEssentialFields) {
      updateFields.push(`profile_complete = true`);
    }

    // Add updated timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE user_profiles
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    updateValues.push(userId);

    const result = await pool.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: isNewProfile ? 'User profile created successfully' : 'User profile updated successfully',
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Create or reset user profile (POST for creating new or resetting)
app.post('/api/user/profile/reset', async (req, res) => {
  try {
    // Deactivate any existing profiles
    await pool.query('UPDATE user_profiles SET active = false WHERE active = true');

    // Create new default profile
    const result = await pool.query(`
      INSERT INTO user_profiles (
        first_name, last_name,
        country, currency, timezone,
        active, profile_complete,
        notes
      ) VALUES (
        'Stock', 'Taker',
        'United Kingdom', 'GBP', 'Europe/London',
        true, false,
        'Reset user profile - please update through Settings'
      )
      RETURNING *
    `);

    res.json({
      success: true,
      message: 'User profile reset successfully',
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('Error resetting user profile:', error);
    res.status(500).json({ error: 'Failed to reset user profile' });
  }
});

// Get user profile summary (lightweight endpoint for quick checks)
app.get('/api/user/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, first_name, last_name,
        primary_email, mobile_phone,
        city, county,
        profile_complete, active,
        created_at
      FROM user_profiles
      WHERE active = true
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      success: true,
      summary: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching user summary:', error);
    res.status(500).json({ error: 'Failed to fetch user summary' });
  }
});

// ==================== SUPPLIER ITEM LIST ENDPOINTS ====================

// Get all supplier items (with optional filtering)
app.get('/api/supplier-items', async (req, res) => {
  try {
    const { supplier_id, master_product_id, active, search } = req.query;

    let query = `
      SELECT
        sil.*,
        s.sup_name as supplier_name,
        mp.name as master_product_name,
        mp.brand as master_product_brand,
        mp.category as master_product_category
      FROM supplier_item_list sil
      LEFT JOIN suppliers s ON sil.supplier_id = s.sup_id
      LEFT JOIN master_products mp ON sil.master_product_id = mp.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (supplier_id) {
      query += ` AND sil.supplier_id = $${paramCount}`;
      params.push(supplier_id);
      paramCount++;
    }

    if (master_product_id) {
      query += ` AND sil.master_product_id = $${paramCount}`;
      params.push(master_product_id);
      paramCount++;
    }

    if (active !== undefined) {
      query += ` AND sil.active = $${paramCount}`;
      params.push(active === 'true');
      paramCount++;
    }

    // Add search functionality for product name or SKU
    if (search && search.trim()) {
      query += ` AND (
        LOWER(sil.supplier_name) LIKE LOWER($${paramCount}) OR
        LOWER(sil.supplier_sku) LIKE LOWER($${paramCount}) OR
        LOWER(sil.supplier_description) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search.trim()}%`);
      paramCount++;
    }

    query += ` ORDER BY sil.supplier_name, sil.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      items: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching supplier items:', error);
    res.status(500).json({ error: 'Failed to fetch supplier items' });
  }
});

// Get supplier item by ID
app.get('/api/supplier-items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        sil.*,
        s.sup_name as supplier_name,
        mp.name as master_product_name,
        mp.brand as master_product_brand,
        mp.category as master_product_category,
        mp.case_size as master_case_size
      FROM supplier_item_list sil
      LEFT JOIN suppliers s ON sil.supplier_id = s.sup_id
      LEFT JOIN master_products mp ON sil.master_product_id = mp.id
      WHERE sil.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier item not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching supplier item:', error);
    res.status(500).json({ error: 'Failed to fetch supplier item' });
  }
});

// Create new supplier item
app.post('/api/supplier-items', async (req, res) => {
  try {
    const {
      supplier_id,
      master_product_id,
      supplier_sku,
      supplier_name,
      supplier_description,
      supplier_brand,
      supplier_category,
      supplier_size,
      supplier_barcode,
      unit_cost,
      case_cost,
      pack_size,
      case_size,
      minimum_order,
      auto_matched,
      verified,
      confidence_score,
      created_by
    } = req.body;

    // Validate required fields
    if (!supplier_id || !supplier_sku || !supplier_name) {
      return res.status(400).json({
        error: 'Missing required fields: supplier_id, supplier_sku, supplier_name'
      });
    }

    const result = await pool.query(`
      INSERT INTO supplier_item_list (
        supplier_id, master_product_id, supplier_sku, supplier_name,
        supplier_description, supplier_brand, supplier_category, supplier_size,
        supplier_barcode, unit_cost, case_cost, pack_size, case_size,
        minimum_order, auto_matched, verified, confidence_score, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING *
    `, [
      supplier_id, master_product_id, supplier_sku, supplier_name,
      supplier_description, supplier_brand, supplier_category, supplier_size,
      supplier_barcode, unit_cost, case_cost, pack_size || 1, case_size,
      minimum_order || 1, auto_matched || false, verified || false,
      confidence_score || 0, created_by
    ]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Supplier item created successfully'
    });
  } catch (error) {
    console.error('Error creating supplier item:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Supplier SKU already exists for this supplier' });
    } else {
      res.status(500).json({ error: 'Failed to create supplier item' });
    }
  }
});

// Update supplier item
app.put('/api/supplier-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'master_product_id', 'supplier_sku', 'supplier_name', 'supplier_description',
      'supplier_brand', 'supplier_category', 'supplier_size', 'supplier_barcode',
      'unit_cost', 'case_cost', 'pack_size', 'case_size', 'minimum_order',
      'auto_matched', 'verified', 'confidence_score', 'match_notes',
      'last_cost_update', 'last_ordered', 'order_frequency_days', 'active'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id); // Add id as last parameter

    const result = await pool.query(`
      UPDATE supplier_item_list
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier item not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Supplier item updated successfully'
    });
  } catch (error) {
    console.error('Error updating supplier item:', error);
    res.status(500).json({ error: 'Failed to update supplier item' });
  }
});

// Delete supplier item
app.delete('/api/supplier-items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM supplier_item_list
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier item not found' });
    }

    res.json({
      success: true,
      message: 'Supplier item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier item:', error);
    res.status(500).json({ error: 'Failed to delete supplier item' });
  }
});

// Search supplier items by name or SKU
app.get('/api/supplier-items/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { supplier_id } = req.query;

    let sqlQuery = `
      SELECT
        sil.*,
        s.sup_name as supplier_name,
        mp.name as master_product_name
      FROM supplier_item_list sil
      LEFT JOIN suppliers s ON sil.supplier_id = s.sup_id
      LEFT JOIN master_products mp ON sil.master_product_id = mp.id
      WHERE sil.active = true
        AND (
          sil.supplier_name ILIKE $1
          OR sil.supplier_sku ILIKE $1
          OR sil.supplier_barcode ILIKE $1
        )
    `;
    const params = [`%${query}%`];

    if (supplier_id) {
      sqlQuery += ` AND sil.supplier_id = $2`;
      params.push(supplier_id);
    }

    sqlQuery += ` ORDER BY sil.supplier_name LIMIT 50`;

    const result = await pool.query(sqlQuery, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error searching supplier items:', error);
    res.status(500).json({ error: 'Failed to search supplier items' });
  }
});

// Link supplier item to master product
app.post('/api/supplier-items/:id/link-master', async (req, res) => {
  try {
    const { id } = req.params;
    const { master_product_id, verified, confidence_score } = req.body;

    if (!master_product_id) {
      return res.status(400).json({ error: 'master_product_id is required' });
    }

    const result = await pool.query(`
      UPDATE supplier_item_list
      SET
        master_product_id = $1,
        verified = $2,
        confidence_score = $3,
        auto_matched = false
      WHERE id = $4
      RETURNING *
    `, [master_product_id, verified || false, confidence_score || 100, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier item not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Supplier item linked to master product successfully'
    });
  } catch (error) {
    console.error('Error linking supplier item:', error);
    res.status(500).json({ error: 'Failed to link supplier item' });
  }
});

// ===== EPOS SALES IMPORT ENDPOINTS =====

// Upload EPOS CSV data
app.post('/api/epos-imports', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      venue_id,
      epos_system_name,
      original_filename,
      period_start_date,
      period_end_date,
      imported_by,
      import_notes,
      records // Array of sales records from CSV
    } = req.body;

    // Validation
    if (!venue_id || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        error: 'venue_id and records array are required'
      });
    }

    await client.query('BEGIN');

    // Create import record
    const importResult = await client.query(
      `INSERT INTO epos_imports (
        venue_id, epos_system_name, original_filename,
        start_date, end_date, imported_by, import_notes,
        total_records
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        venue_id,
        epos_system_name || 'Unknown',
        original_filename || 'upload.csv',
        period_start_date || null,
        period_end_date || null,
        imported_by || 'user',
        import_notes || null,
        records.length
      ]
    );

    const importId = importResult.rows[0].id;
    let matchedCount = 0;
    let unmatchedCount = 0;
    let totalSalesValue = 0;

    // Insert each sales record and attempt to match products
    for (const record of records) {
      const {
        item_code,
        item_description,
        category,
        quantity_sold,
        unit_price,
        total_value,
        epos_data // Any extra fields as JSON
      } = record;

      // Attempt to match to venue product by name
      let venueProductId = null;
      let masterProductId = null;
      let matchStatus = 'unmatched';
      let matchConfidence = null;

      if (item_description) {
        // Try exact match first
        const exactMatch = await client.query(
          `SELECT vp.id, vp.master_product_id
           FROM venue_products vp
           WHERE vp.venue_id = $1
           AND LOWER(vp.name) = LOWER($2)
           LIMIT 1`,
          [venue_id, item_description.trim()]
        );

        if (exactMatch.rows.length > 0) {
          venueProductId = exactMatch.rows[0].id;
          masterProductId = exactMatch.rows[0].master_product_id;
          matchStatus = 'exact';
          matchConfidence = 100;
          matchedCount++;
        } else {
          // No match found - automatically create a new venue_product
          const newProduct = await client.query(
            `INSERT INTO venue_products (venue_id, name)
             VALUES ($1, $2)
             RETURNING id, master_product_id`,
            [venue_id, item_description.trim()]
          );

          venueProductId = newProduct.rows[0].id;
          masterProductId = newProduct.rows[0].master_product_id; // Will be null initially
          matchStatus = 'exact'; // It's exact because we created it from EPOS name
          matchConfidence = 100;
          matchedCount++;
        }
      } else {
        unmatchedCount++;
      }

      // Insert sales record
      await client.query(
        `INSERT INTO epos_sales_records (
          import_id, venue_id, item_code, item_description, category,
          quantity_sold, unit_price, total_value, epos_data,
          venue_product_id, master_product_id, match_status, match_confidence,
          matched_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          importId,
          venue_id,
          item_code || null,
          item_description || null,
          category || null,
          quantity_sold || 0,
          unit_price || 0,
          total_value || 0,
          epos_data ? JSON.stringify(epos_data) : null,
          venueProductId,
          masterProductId,
          matchStatus,
          matchConfidence,
          matchStatus !== 'unmatched' ? new Date() : null
        ]
      );

      totalSalesValue += parseFloat(total_value || 0);
    }

    // Update import summary statistics
    await client.query(
      `UPDATE epos_imports
       SET matched_records = $1,
           unmatched_records = $2,
           total_sales_value = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [matchedCount, unmatchedCount, totalSalesValue, importId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'EPOS data imported successfully',
      import: {
        id: importId,
        total_records: records.length,
        matched_records: matchedCount,
        unmatched_records: unmatchedCount,
        total_sales_value: totalSalesValue,
        match_rate: ((matchedCount / records.length) * 100).toFixed(1) + '%'
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing EPOS data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import EPOS data',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Get all EPOS imports for a venue
app.get('/api/epos-imports', async (req, res) => {
  try {
    const { venue_id } = req.query;

    if (!venue_id) {
      return res.status(400).json({ error: 'venue_id is required' });
    }

    const result = await pool.query(
      `SELECT * FROM epos_imports
       WHERE venue_id = $1
       ORDER BY import_date DESC`,
      [venue_id]
    );

    res.json({
      success: true,
      imports: result.rows
    });

  } catch (error) {
    console.error('Error fetching EPOS imports:', error);
    res.status(500).json({ error: 'Failed to fetch EPOS imports' });
  }
});

// Get sales records for a specific import
app.get('/api/epos-imports/:id/records', async (req, res) => {
  try {
    const { id } = req.params;
    const { match_status } = req.query; // Filter by match_status if provided

    let query = `
      SELECT
        esr.*,
        vp.name as venue_product_name,
        mp.brand,
        mp.category
      FROM epos_sales_records esr
      LEFT JOIN venue_products vp ON esr.venue_product_id = vp.id
      LEFT JOIN master_products mp ON esr.master_product_id = mp.id
      WHERE esr.import_id = $1
    `;

    const params = [id];

    if (match_status) {
      query += ` AND esr.match_status = $2`;
      params.push(match_status);
    }

    query += ` ORDER BY esr.item_description`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      records: result.rows
    });

  } catch (error) {
    console.error('Error fetching EPOS sales records:', error);
    res.status(500).json({ error: 'Failed to fetch sales records' });
  }
});

// Manually match an EPOS record to a product
app.put('/api/epos-records/:id/match', async (req, res) => {
  try {
    const { id } = req.params;
    const { venue_product_id, matched_by } = req.body;

    if (!venue_product_id) {
      return res.status(400).json({ error: 'venue_product_id is required' });
    }

    // Get master_product_id from venue_product
    const productResult = await pool.query(
      'SELECT master_product_id FROM venue_products WHERE id = $1',
      [venue_product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Venue product not found' });
    }

    const masterProductId = productResult.rows[0].master_product_id;

    // Update the EPOS record
    const result = await pool.query(
      `UPDATE epos_sales_records
       SET venue_product_id = $1,
           master_product_id = $2,
           match_status = 'manual',
           match_confidence = 100,
           matched_at = CURRENT_TIMESTAMP,
           matched_by = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [venue_product_id, masterProductId, matched_by || 'user', id]
    );

    res.json({
      success: true,
      message: 'Product matched successfully',
      record: result.rows[0]
    });

  } catch (error) {
    console.error('Error matching EPOS record:', error);
    res.status(500).json({ error: 'Failed to match product' });
  }
});

// ============================================================================
// VENUE CSV PREFERENCES
// ============================================================================

// Get CSV preferences for a venue
app.get('/api/venues/:venueId/csv-preferences', async (req, res) => {
  try {
    const { venueId } = req.params;

    const result = await pool.query(
      `SELECT * FROM venue_csv_preferences WHERE venue_id = $1`,
      [venueId]
    );

    if (result.rows.length === 0) {
      // Return default preferences if none exist
      return res.json({
        success: true,
        preferences: {
          item_code_column: -1,
          item_description_column: 0,
          quantity_sold_column: -1,
          unit_price_column: -1,
          total_value_column: -1
        }
      });
    }

    res.json({
      success: true,
      preferences: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching CSV preferences:', error);
    res.status(500).json({ error: 'Failed to fetch CSV preferences' });
  }
});

// Save CSV preferences for a venue
app.put('/api/venues/:venueId/csv-preferences', async (req, res) => {
  try {
    const { venueId } = req.params;
    const {
      item_code_column,
      item_description_column,
      quantity_sold_column,
      unit_price_column,
      total_value_column,
      updated_by
    } = req.body;

    // Upsert preferences
    const result = await pool.query(
      `INSERT INTO venue_csv_preferences (
        venue_id,
        item_code_column,
        item_description_column,
        quantity_sold_column,
        unit_price_column,
        total_value_column,
        updated_by,
        last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (venue_id)
      DO UPDATE SET
        item_code_column = $2,
        item_description_column = $3,
        quantity_sold_column = $4,
        unit_price_column = $5,
        total_value_column = $6,
        updated_by = $7,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        venueId,
        item_code_column,
        item_description_column,
        quantity_sold_column,
        unit_price_column,
        total_value_column,
        updated_by || 'user'
      ]
    );

    res.json({
      success: true,
      message: 'CSV preferences saved',
      preferences: result.rows[0]
    });

  } catch (error) {
    console.error('Error saving CSV preferences:', error);
    res.status(500).json({ error: 'Failed to save CSV preferences' });
  }
});

// Get last session date for a venue (to pre-fill date inputs)
app.get('/api/venues/:venueId/last-session-date', async (req, res) => {
  try {
    const { venueId } = req.params;

    // Get the most recent stock_entry date for this venue
    const result = await pool.query(
      `SELECT MAX(DATE(se.created_at)) as last_entry_date
       FROM stock_entries se
       JOIN stock_sessions ss ON se.session_id = ss.id
       WHERE ss.venue_id = $1`,
      [venueId]
    );

    res.json({
      success: true,
      lastSessionDate: result.rows[0]?.last_entry_date || null
    });

  } catch (error) {
    console.error('Error fetching last session date:', error);
    res.status(500).json({ error: 'Failed to fetch last session date' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Master Products API ready at /api/master-products`);
  console.log(`User Profile API ready at /api/user/profile`);
  console.log(`Supplier Item List API ready at /api/supplier-items`);
  console.log(`EPOS Sales Import API ready at /api/epos-imports`);
});

// Force redeploy $(date)// Force redeploy Fri Sep 26 00:02:49 GMTST 2025
