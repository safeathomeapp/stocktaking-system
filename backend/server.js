const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const pool = require('./src/database');
require('dotenv').config();

// Updated with county field support

const app = express();
const PORT = process.env.PORT || 3005;

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
      `SELECT p.*, va.name as area_name
       FROM venue_item_list p
       LEFT JOIN venue_areas va ON p.ven_location_area = va.id
       WHERE p.venue_id = $1
       ORDER BY va.display_order, p.ven_category, p.ven_name`,
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
    const { name, category, unit, area_id, brand, size, barcode } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    // Verify venue exists
    const venueCheck = await pool.query('SELECT id FROM venues WHERE id = $1', [venueId]);
    if (venueCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Create the product
    const result = await pool.query(
      `INSERT INTO products (venue_id, area_id, name, category, brand, size, unit_type, barcode, expected_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [venueId, area_id || null, name, category || 'General', brand || null, size || null, unit || 'bottle', barcode || null, 0]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating venue product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ===== MASTER PRODUCTS ENDPOINTS =====

// Get all master products with filtering
app.get('/api/master-products', async (req, res) => {
  try {
    const { category, master_category, search, active = 'true' } = req.query;

    let query = 'SELECT * FROM master_item_list WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (active !== 'all') {
      query += ` AND mas_active = $${paramCount}`;
      params.push(active === 'true');
      paramCount++;
    }

    if (category) {
      query += ` AND mas_category ILIKE $${paramCount}`;
      params.push(`%${category}%`);
      paramCount++;
    }

    if (master_category) {
      query += ` AND mas_category = $${paramCount}`;
      params.push(master_category);
      paramCount++;
    }

    if (search) {
      query += ` AND (mas_name ILIKE $${paramCount} OR mas_brand ILIKE $${paramCount} OR mas_description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY mas_category, mas_brand, mas_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching master products:', error);
    res.status(500).json({ error: 'Failed to fetch master products' });
  }
});

// Get master product by ID
app.get('/api/master-products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM master_item_list WHERE mas_item_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Master product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching master product:', error);
    res.status(500).json({ error: 'Failed to fetch master product' });
  }
});

// Create new master product
app.post('/api/master-products', async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      master_category,
      container_type,
      container_size,
      case_size,
      unit_size,
      brand,
      alcohol_percentage,
      barcode,
      sku,
      suggested_retail_price,
      currency = 'GBP'
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const result = await pool.query(
      `INSERT INTO master_products
       (name, description, category, master_category, container_type, container_size, case_size, unit_size,
        brand, alcohol_percentage, barcode, sku, suggested_retail_price, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, description, category, master_category, container_type, container_size, case_size, unit_size,
       brand, alcohol_percentage, barcode, sku, suggested_retail_price, currency]
    );

    res.status(201).json({
      message: 'Master product created successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating master product:', error);
    res.status(500).json({ error: 'Failed to create master product' });
  }
});

// Update master product
app.put('/api/master-products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      master_category,
      container_type,
      container_size,
      case_size,
      unit_size,
      brand,
      alcohol_percentage,
      barcode,
      sku,
      suggested_retail_price,
      currency,
      active
    } = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    const fields = {
      name, description, category, master_category, container_type, container_size,
      case_size, unit_size, brand, alcohol_percentage, barcode, sku, suggested_retail_price,
      currency, active
    };

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE master_products SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Master product not found' });
    }

    res.json({
      message: 'Master product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating master product:', error);
    res.status(500).json({ error: 'Failed to update master product' });
  }
});

// Get master product categories summary
app.get('/api/master-products/categories/summary', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM master_products_summary ORDER BY master_category, category');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories summary:', error);
    res.status(500).json({ error: 'Failed to fetch categories summary' });
  }
});

// Search master products (for voice recognition, etc.)
app.post('/api/master-products/search', async (req, res) => {
  try {
    const { query: searchQuery, limit = 20, min_score = 0.1 } = req.body;

    if (!searchQuery || searchQuery.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Use PostgreSQL full-text search
    const result = await pool.query(
      `SELECT *,
              ts_rank(search_vector, plainto_tsquery('english', $1)) as relevance_score
       FROM master_products
       WHERE search_vector @@ plainto_tsquery('english', $1)
          AND active = true
          AND ts_rank(search_vector, plainto_tsquery('english', $1)) > $2
       ORDER BY relevance_score DESC, name
       LIMIT $3`,
      [searchQuery.trim(), min_score, limit]
    );

    res.json({
      query: searchQuery,
      results: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error searching master products:', error);
    res.status(500).json({ error: 'Failed to search master products' });
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
         v.address as venue_address,
         COUNT(se.id) as entry_count
       FROM stock_sessions s
       JOIN venues v ON s.venue_id = v.id
       LEFT JOIN stock_entries se ON s.id = se.session_id
       WHERE s.id = $1
       GROUP BY s.id, v.name, v.address`,
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
      'SELECT id, name FROM products WHERE id = $1 AND venue_id = $2', 
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
         p.name as product_name,
         p.brand,
         p.size,
         p.category,
         p.unit_type,
         va.name as venue_area_name
       FROM stock_entries se
       JOIN products p ON se.product_id = p.id
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
        p.name as product_name,
        p.brand,
        p.size,
        p.category,
        p.unit_type,
        p.barcode,
        va.name as venue_area_name
      FROM stock_entries se
      JOIN products p ON se.product_id = p.id
      LEFT JOIN venue_areas va ON se.venue_area_id = va.id
      WHERE se.session_id = $1
    `;

    const queryParams = [session_id];
    let paramCount = 2;

    if (category) {
      query += ` AND p.category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }

    if (completed_only === 'true') {
      query += ` AND se.quantity_units > 0`;
    }

    query += ` ORDER BY p.category, p.name`;

    const result = await pool.query(query, queryParams);

    // Get summary statistics
    const statsResult = await pool.query(
      `SELECT
         COUNT(*) as total_entries,
         COUNT(CASE WHEN quantity_units > 0 THEN 1 END) as completed_entries,
         COUNT(DISTINCT p.category) as categories_covered
       FROM stock_entries se
       JOIN products p ON se.product_id = p.id
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
         p.name as product_name,
         p.brand,
         p.size,
         p.category,
         p.unit_type,
         p.barcode,
         va.name as venue_area_name
       FROM stock_entries se
       JOIN products p ON se.product_id = p.id
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
      `SELECT se.id, se.session_id, ss.status, p.name as product_name
       FROM stock_entries se 
       JOIN stock_sessions ss ON se.session_id = ss.id 
       JOIN products p ON se.product_id = p.id
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
         FROM products p
         JOIN stock_sessions ss ON p.venue_id = ss.venue_id
         WHERE ss.id = $1
       ) venue_products
       LEFT JOIN (
         -- Get entry statistics
         SELECT 
           COUNT(DISTINCT se.product_id) as products_counted,
           COUNT(CASE WHEN se.quantity_units > 0 THEN 1 END) as products_completed,
           json_agg(
             json_build_object(
               'category', p.category,
               'total', category_stats.total,
               'counted', category_stats.counted,
               'completed', category_stats.completed
             )
           ) as categories_data
         FROM stock_entries se
         JOIN products p ON se.product_id = p.id
         JOIN (
           -- Category-wise breakdown
           SELECT 
             p2.category,
             COUNT(*) as total,
             COUNT(se2.id) as counted,
             COUNT(CASE WHEN se2.quantity_units > 0 THEN 1 END) as completed
           FROM products p2
           JOIN stock_sessions ss2 ON p2.venue_id = ss2.venue_id AND ss2.id = $1
           LEFT JOIN stock_entries se2 ON p2.id = se2.product_id AND se2.session_id = $1
           GROUP BY p2.category
         ) category_stats ON p.category = category_stats.category
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


// ===== VOICE RECOGNITION & MASTER PRODUCTS ENDPOINTS =====

// Import voice recognition service when needed to prevent startup errors

// Search master products with fuzzy matching
app.post('/api/master-products/search', async (req, res) => {
  try {
    const { query, sessionId, venueId, maxResults, minConfidence } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const options = {
      maxResults: maxResults || 20,
      minConfidence: minConfidence || 40,
      sessionId: sessionId || null,
      venueId: venueId || null,
      includeAliases: true
    };

    const fuzzyMatchingService = require('./services/fuzzyMatchingService');
    const searchResults = await fuzzyMatchingService.searchMasterProducts(query.trim(), options);

    res.json(searchResults);

  } catch (error) {
    console.error('Error searching master products:', error);
    res.status(500).json({
      error: 'Search service unavailable',
      details: error.message
    });
  }
});

// Record product selection for learning
app.post('/api/voice-recognition/select', async (req, res) => {
  try {
    const { productId, logId, selectionRank } = req.body;

    if (!productId || !logId) {
      return res.status(400).json({ error: 'Product ID and log ID are required' });
    }

    const fuzzyMatchingService = require('./services/fuzzyMatchingService');
    await fuzzyMatchingService.recordProductSelection(
      productId,
      logId,
      selectionRank || 1
    );

    res.json({ message: 'Selection recorded successfully' });

  } catch (error) {
    console.error('Error recording product selection:', error);
    res.status(500).json({ error: 'Failed to record selection' });
  }
});

// Add new master product
app.post('/api/master-products', async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      subcategory,
      size,
      unit_type,
      alcohol_percentage,
      barcode,
      venue_id
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const productData = {
      name: name.trim(),
      brand: brand?.trim() || null,
      category: category?.trim() || null,
      subcategory: subcategory?.trim() || null,
      size: size?.trim() || null,
      unit_type: unit_type || 'other',
      alcohol_percentage: alcohol_percentage || null,
      barcode: barcode?.trim() || null,
      venue_id: venue_id || null
    };

    const fuzzyMatchingService = require('./services/fuzzyMatchingService');
    const newProduct = await fuzzyMatchingService.addMasterProduct(productData);

    res.status(201).json({
      message: 'Master product created successfully',
      product: newProduct
    });

  } catch (error) {
    console.error('Error creating master product:', error);
    res.status(500).json({ error: 'Failed to create master product' });
  }
});

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

// Get voice recognition analytics
app.get('/api/voice-recognition/analytics', async (req, res) => {
  try {
    const { venueId, days = 30 } = req.query;

    // Basic analytics query
    const analyticsQuery = `
      SELECT
        COUNT(*) as total_requests,
        COUNT(selected_product_id) as successful_selections,
        AVG(confidence_score) as avg_confidence,
        AVG(processing_time_ms) as avg_processing_time,
        COUNT(CASE WHEN selection_rank = 1 THEN 1 END) as first_choice_selections,
        COUNT(CASE WHEN manual_entry = true THEN 1 END) as manual_entries
      FROM voice_recognition_log
      WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      ${venueId ? 'AND venue_id = $1' : ''}
    `;

    const params = venueId ? [venueId] : [];
    const result = await pool.query(analyticsQuery, params);

    const analytics = result.rows[0];

    // Calculate success rate
    const successRate = analytics.total_requests > 0
      ? (analytics.successful_selections / analytics.total_requests * 100).toFixed(2)
      : 0;

    // Calculate first choice accuracy
    const firstChoiceAccuracy = analytics.successful_selections > 0
      ? (analytics.first_choice_selections / analytics.successful_selections * 100).toFixed(2)
      : 0;

    res.json({
      totalRequests: parseInt(analytics.total_requests),
      successfulSelections: parseInt(analytics.successful_selections),
      successRate: parseFloat(successRate),
      firstChoiceAccuracy: parseFloat(firstChoiceAccuracy),
      avgConfidence: parseFloat(analytics.avg_confidence || 0).toFixed(2),
      avgProcessingTime: parseFloat(analytics.avg_processing_time || 0).toFixed(0),
      manualEntries: parseInt(analytics.manual_entries),
      periodDays: parseInt(days)
    });

  } catch (error) {
    console.error('Error fetching voice recognition analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get popular products from master database
app.get('/api/master-products/popular', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;

    let sql = `
      SELECT
        mp.*,
        array_length(mp.venues_seen, 1) as venue_count
      FROM master_products mp
      WHERE mp.usage_count > 0
    `;

    const params = [];
    if (category) {
      sql += ' AND LOWER(mp.category) = LOWER($1)';
      params.push(category);
    }

    sql += `
      ORDER BY mp.usage_count DESC, mp.success_rate DESC
      LIMIT $${params.length + 1}
    `;

    params.push(parseInt(limit));

    const result = await pool.query(sql, params);

    res.json({
      products: result.rows,
      totalCount: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching popular products:', error);
    res.status(500).json({ error: 'Failed to fetch popular products' });
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
      `UPDATE products
       SET master_product_id = $1, auto_matched = false
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
      SELECT s.*, COUNT(spm.id) as mapped_products_count
      FROM suppliers s
      LEFT JOIN supplier_product_mappings spm ON s.id = spm.supplier_id
      WHERE s.active = true
      GROUP BY s.id
      ORDER BY s.name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
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
      SELECT spm.*, mp.name as master_product_name, mp.unit_size
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

// Get supplier product mappings with search
app.get('/api/suppliers/:id/mappings', async (req, res) => {
  try {
    const { id } = req.params;
    const { search, limit = 50 } = req.query;

    let query = `
      SELECT spm.*, mp.name as master_product_name, mp.unit_size, mp.master_category
      FROM supplier_product_mappings spm
      JOIN master_products mp ON spm.master_product_id = mp.id
      WHERE spm.supplier_id = $1
    `;
    const params = [id];

    if (search) {
      query += ` AND (spm.supplier_description ILIKE $${params.length + 1} OR mp.name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY spm.updated_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching mappings:', error);
    res.status(500).json({ error: 'Failed to fetch mappings' });
  }
});

// Update supplier mapping (verify/correct mapping)
app.put('/api/supplier-mappings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { master_product_id, verified, mapping_confidence } = req.body;

    const result = await pool.query(`
      UPDATE supplier_product_mappings
      SET master_product_id = $1, verified = $2, mapping_confidence = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [master_product_id, verified, mapping_confidence, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mapping not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating mapping:', error);
    res.status(500).json({ error: 'Failed to update mapping' });
  }
});

// Get supplier mapping statistics
app.get('/api/suppliers/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        COUNT(*) as total_mappings,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified_mappings,
        COUNT(CASE WHEN auto_mapped = true THEN 1 END) as auto_mapped,
        AVG(mapping_confidence) as avg_confidence,
        COUNT(DISTINCT master_product_id) as unique_products
      FROM supplier_product_mappings
      WHERE supplier_id = $1
    `, [id]);

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
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

    // Get the current active user ID
    const currentUser = await pool.query('SELECT id FROM user_profiles WHERE active = true LIMIT 1');

    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: 'No active user profile found' });
    }

    const userId = currentUser.rows[0].id;

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
      message: 'User profile updated successfully',
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Voice Recognition API ready at /api/master-products/search`);
  console.log(`User Profile API ready at /api/user/profile`);
});

// Force redeploy $(date)// Force redeploy Fri Sep 26 00:02:49 GMTST 2025
