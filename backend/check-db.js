const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking existing database structure...');

    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📊 Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    if (tablesResult.rows.length === 0) {
      console.log('   No tables found');
      return;
    }

    // Check venues table structure if it exists
    const venuesExists = tablesResult.rows.some(row => row.table_name === 'venues');
    if (venuesExists) {
      console.log('\n📋 Venues table structure:');
      const venuesStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'venues'
        ORDER BY ordinal_position
      `);
      venuesStructure.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default ? 'DEFAULT ' + row.column_default : ''}`);
      });

      // Check existing venues
      const venuesData = await pool.query('SELECT id, name FROM venues LIMIT 5');
      console.log(`\n🏢 Existing venues (${venuesData.rows.length}):`);
      venuesData.rows.forEach(venue => {
        console.log(`   - ${venue.name} (ID: ${venue.id})`);
      });
    }

    // Check other key tables
    const stockSessionsExists = tablesResult.rows.some(row => row.table_name === 'stock_sessions');
    if (stockSessionsExists) {
      console.log('\n📋 Stock sessions table structure:');
      const sessionsStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'stock_sessions'
        ORDER BY ordinal_position
      `);
      sessionsStructure.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();