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
      db_time: result.rows[0].now
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

// Get all venues
app.get('/api/venues', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM venues ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new venue
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

    // Create default areas for the new venue
    const defaultAreas = [
      { name: 'Bar Area', order: 1, description: 'Main bar and serving area' },
      { name: 'Storage Room', order: 2, description: 'Main storage and inventory area' },
      { name: 'Kitchen', order: 3, description: 'Kitchen and food preparation area' },
      { name: 'Wine Cellar', order: 4, description: 'Wine storage and cellar area' },
      { name: 'Dry Storage', order: 5, description: 'Dry goods and non-refrigerated storage' }
    ];

    for (const area of defaultAreas) {
      await pool.query(
        'INSERT INTO venue_areas (venue_id, name, display_order, description) VALUES ($1, $2, $3, $4)',
        [newVenue.id, area.name, area.order, area.description]
      );
    }

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
    const { name, display_order, description } = req.body;

    const result = await pool.query(
      'UPDATE venue_areas SET name = $1, display_order = $2, description = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, display_order, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }

    res.json({
      message: 'Area updated successfully',
      area: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating area:', error);
    res.status(500).json({ error: 'Failed to update area' });
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
       FROM products p
       LEFT JOIN venue_areas va ON p.area_id = va.id
       WHERE p.venue_id = $1
       ORDER BY va.display_order, p.category, p.name`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const { status = 'in_progress', limit = 20 } = req.query;

    const result = await pool.query(
      `SELECT 
         s.*,
         v.name as venue_name,
         COUNT(se.id) as entry_count
       FROM stock_sessions s
       JOIN venues v ON s.venue_id = v.id
       LEFT JOIN stock_entries se ON s.id = se.session_id
       WHERE s.status = $1
       GROUP BY s.id, v.name
       ORDER BY s.created_at DESC
       LIMIT $2`,
      [status, parseInt(limit)]
    );

    res.json({
      sessions: result.rows,
      filter: { status }
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Add this endpoint after the GET /api/sessions endpoint in your server.js

// ===== STOCK ENTRY MANAGEMENT ENDPOINTS =====

// Add product stock entry to a session
app.post('/api/sessions/:id/entries', async (req, res) => {
  try {
    const { id: session_id } = req.params;
    const { 
      product_id, 
      quantity_level, 
      quantity_units = 0, 
      location_notes, 
      condition_flags,
      photo_url 
    } = req.body;

    // Validate required fields
    if (!product_id || quantity_level === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: product_id and quantity_level are required' 
      });
    }

    // Validate quantity_level range (0.0 to 1.0)
    if (quantity_level < 0.0 || quantity_level > 1.0) {
      return res.status(400).json({ 
        error: 'quantity_level must be between 0.0 (empty) and 1.0 (full)' 
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
       (session_id, product_id, quantity_level, quantity_units, location_notes, condition_flags, photo_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [session_id, product_id, quantity_level, quantity_units, location_notes, 
       condition_flags ? JSON.stringify(condition_flags) : null, photo_url]
    );

    // Get entry with product details for response
    const entryWithProduct = await pool.query(
      `SELECT 
         se.*,
         p.name as product_name,
         p.brand,
         p.size,
         p.category,
         p.unit_type
       FROM stock_entries se
       JOIN products p ON se.product_id = p.id
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
        p.barcode
      FROM stock_entries se
      JOIN products p ON se.product_id = p.id
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
      query += ` AND se.quantity_level IS NOT NULL`;
    }

    query += ` ORDER BY p.category, p.name`;

    const result = await pool.query(query, queryParams);

    // Get summary statistics
    const statsResult = await pool.query(
      `SELECT 
         COUNT(*) as total_entries,
         COUNT(CASE WHEN quantity_level IS NOT NULL THEN 1 END) as completed_entries,
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

// Update stock entry (quantity, notes, condition, etc.)
app.put('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      quantity_level, 
      quantity_units, 
      location_notes, 
      condition_flags,
      photo_url 
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

    // Validate quantity_level if provided
    if (quantity_level !== undefined && (quantity_level < 0.0 || quantity_level > 1.0)) {
      return res.status(400).json({ 
        error: 'quantity_level must be between 0.0 (empty) and 1.0 (full)' 
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (quantity_level !== undefined) {
      updateFields.push(`quantity_level = $${paramCount}`);
      values.push(quantity_level);
      paramCount++;
    }

    if (quantity_units !== undefined) {
      updateFields.push(`quantity_units = $${paramCount}`);
      values.push(quantity_units);
      paramCount++;
    }

    if (location_notes !== undefined) {
      updateFields.push(`location_notes = $${paramCount}`);
      values.push(location_notes);
      paramCount++;
    }

    if (condition_flags !== undefined) {
      updateFields.push(`condition_flags = $${paramCount}`);
      values.push(condition_flags ? JSON.stringify(condition_flags) : null);
      paramCount++;
    }

    if (photo_url !== undefined) {
      updateFields.push(`photo_url = $${paramCount}`);
      values.push(photo_url);
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

    // Get updated entry with product details
    const entryWithProduct = await pool.query(
      `SELECT 
         se.*,
         p.name as product_name,
         p.brand,
         p.size,
         p.category,
         p.unit_type
       FROM stock_entries se
       JOIN products p ON se.product_id = p.id
       WHERE se.id = $1`,
      [id]
    );

    res.json({
      message: 'Stock entry updated successfully',
      entry: entryWithProduct.rows[0]
    });

  } catch (error) {
    console.error('Error updating stock entry:', error);
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
           COUNT(CASE WHEN se.quantity_level IS NOT NULL THEN 1 END) as products_completed,
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
             COUNT(CASE WHEN se2.quantity_level IS NOT NULL THEN 1 END) as completed
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


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Force redeploy $(date)// Force redeploy Fri Sep 26 00:02:49 GMTST 2025
