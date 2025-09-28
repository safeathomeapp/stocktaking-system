const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMasterProductsMigration() {
  console.log('🔄 Starting master products database migration...');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-master-products-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the migration
    console.log('📦 Creating master_products table and related structures...');
    await pool.query(sql);

    console.log('✅ Master products migration completed successfully!');

    // Test the migration by counting records
    const result = await pool.query('SELECT COUNT(*) FROM master_products');
    console.log(`📊 Master products table created with ${result.rows[0].count} sample records`);

    // Show category summary
    console.log('\n📋 Master Categories Summary:');
    const categories = await pool.query(`
      SELECT master_category, COUNT(*) as count
      FROM master_products
      GROUP BY master_category
      ORDER BY master_category
    `);

    categories.rows.forEach(row => {
      console.log(`   ${row.master_category}: ${row.count} products`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMasterProductsMigration()
    .then(() => {
      console.log('\n🎉 Migration complete! You can now use the master products system.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = runMasterProductsMigration;