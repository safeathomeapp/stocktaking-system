const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addUnitSizeColumn() {
  console.log('🔄 Adding unit_size column and updating master_products table...');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-unit-size-to-master-products.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the migration
    console.log('📦 Adding missing columns including unit_size...');
    await pool.query(sql);

    console.log('✅ Master products table updated successfully!');

    // Test the migration by showing some sample records
    const result = await pool.query(`
      SELECT name, master_category, container_size, case_size, unit_size
      FROM master_products
      WHERE unit_size IS NOT NULL
      LIMIT 5
    `);

    console.log('\n📋 Sample products with unit sizes:');
    result.rows.forEach(row => {
      console.log(`   ${row.name}: ${row.unit_size} (${row.container_size})`);
    });

    // Show column structure
    const columns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'master_products'
      AND column_name IN ('unit_size', 'master_category', 'case_size')
      ORDER BY column_name
    `);

    console.log('\n📊 Added columns:');
    columns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
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
  addUnitSizeColumn()
    .then(() => {
      console.log('\n🎉 Migration complete! unit_size column added successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = addUnitSizeColumn;