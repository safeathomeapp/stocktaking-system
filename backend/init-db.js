const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool with explicit SSL configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'init-database.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 SQL file loaded successfully');

    // Execute the SQL script
    await pool.query(sql);

    console.log('✅ Database initialized successfully!');
    console.log('📊 Tables created and sample data inserted');

    // Test the setup by querying venues
    const venuesResult = await pool.query('SELECT id, name FROM venues');
    console.log(`🏢 Found ${venuesResult.rows.length} venues:`);
    venuesResult.rows.forEach(venue => {
      console.log(`   - ${venue.name} (ID: ${venue.id})`);
    });

    // Test areas
    const areasResult = await pool.query('SELECT COUNT(*) as count FROM venue_areas');
    console.log(`📍 Total areas created: ${areasResult.rows[0].count}`);

    // Test products
    const productsResult = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`📦 Total products created: ${productsResult.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();