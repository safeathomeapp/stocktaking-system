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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Force redeploy $(date)// Force redeploy Fri Sep 26 00:02:49 GMTST 2025
