const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function safeAddUnitSize() {
  console.log('🔄 Safely adding unit_size column to master_products...');

  try {
    // First, check what columns exist
    const existingColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'master_products'
      ORDER BY column_name
    `);

    console.log('📋 Existing columns:', existingColumns.rows.map(r => r.column_name).join(', '));

    // Add unit_size column if it doesn't exist
    console.log('📦 Adding unit_size column...');
    await pool.query(`
      ALTER TABLE master_products
      ADD COLUMN IF NOT EXISTS unit_size VARCHAR(100)
    `);

    // Add description column if it doesn't exist
    await pool.query(`
      ALTER TABLE master_products
      ADD COLUMN IF NOT EXISTS description TEXT
    `);

    // Add other missing columns one by one
    const columnsToAdd = [
      'master_category VARCHAR(50)',
      'container_type VARCHAR(50)',
      'container_size VARCHAR(50)',
      'case_size INTEGER',
      'brand VARCHAR(100)',
      'alcohol_percentage DECIMAL(4,2)',
      'barcode VARCHAR(50)',
      'sku VARCHAR(100)',
      'suggested_retail_price DECIMAL(10,2)',
      'currency VARCHAR(3) DEFAULT \'GBP\'',
      'active BOOLEAN DEFAULT true'
    ];

    for (const column of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE master_products ADD COLUMN IF NOT EXISTS ${column}`);
        console.log(`   ✅ Added: ${column.split(' ')[0]}`);
      } catch (error) {
        console.log(`   ⚠️  Skipped: ${column.split(' ')[0]} (${error.message})`);
      }
    }

    // Add some sample data with unit sizes
    console.log('📦 Adding sample products with unit sizes...');
    await pool.query(`
      INSERT INTO master_products (name, description, category, master_category, container_type, container_size, case_size, unit_size, brand, alcohol_percentage) VALUES
      ('Becks Lager Bottles', 'German premium lager', 'lager', 'beer', 'bottle', '275ml', 24, '24 bottles per case', 'Becks', 5.0),
      ('Guinness Draught Keg', 'Irish dry stout on draught', 'stout', 'draught', 'keg', '11 gallons', 1, '1 keg (11 gallons)', 'Guinness', 4.2),
      ('House Wine Box', 'House red wine in bag-in-box', 'red blend', 'wine', 'box', '3L', 4, '4 boxes per case (3L each)', 'House Selection', 12.5),
      ('Vodka 70cl Case', 'Premium vodka bottles', 'vodka', 'spirits', 'bottle', '70cl', 12, '12 bottles per case', 'Premium Brand', 40.0)
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('✅ Migration completed successfully!');

    // Show final column structure
    const finalColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'master_products'
      ORDER BY column_name
    `);

    console.log('\n📊 Final table structure:');
    finalColumns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });

    // Show sample data
    const samples = await pool.query(`
      SELECT name, unit_size, container_size, case_size
      FROM master_products
      WHERE unit_size IS NOT NULL
      LIMIT 5
    `);

    console.log('\n📋 Sample products with unit sizes:');
    samples.rows.forEach(row => {
      console.log(`   ${row.name}: ${row.unit_size}`);
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
  safeAddUnitSize()
    .then(() => {
      console.log('\n🎉 Migration complete! unit_size column ready for use.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = safeAddUnitSize;