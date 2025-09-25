const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const pool = require('./src/database');
require('dotenv').config();

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

// Get products for a venue
app.get('/api/venues/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE venue_id = $1 ORDER BY category, name',
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


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Force redeploy $(date)// Force redeploy Fri Sep 26 00:02:49 GMTST 2025
