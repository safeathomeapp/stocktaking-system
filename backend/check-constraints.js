const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkConstraints() {
  try {
    console.log('🔍 Checking table constraints...');

    const constraints = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'products'
    `);

    console.log('📋 Products table constraints:');
    constraints.rows.forEach(row => {
      console.log(`   - ${row.constraint_name}: ${row.check_clause}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking constraints:', error);
    process.exit(1);
  }
}

checkConstraints();