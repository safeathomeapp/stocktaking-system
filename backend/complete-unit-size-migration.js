const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function completeUnitSizeMigration() {
  console.log('🔄 Completing unit_size migration...');

  try {
    // Add sample products with unit sizes (without conflict clause)
    console.log('📦 Adding sample products with unit sizes...');

    const sampleProducts = [
      ['Becks Lager Bottles', 'German premium lager', 'lager', 'beer', 'bottle', '275ml', 24, '24 bottles per case', 'Becks', 5.0],
      ['Guinness Draught Keg', 'Irish dry stout on draught', 'stout', 'draught', 'keg', '11 gallons', 1, '1 keg (11 gallons)', 'Guinness', 4.2],
      ['House Wine Box', 'House red wine in bag-in-box', 'red blend', 'wine', 'box', '3L', 4, '4 boxes per case (3L each)', 'House Selection', 12.5],
      ['Vodka 70cl Case', 'Premium vodka bottles', 'vodka', 'spirits', 'bottle', '70cl', 12, '12 bottles per case', 'Premium Brand', 40.0]
    ];

    for (const product of sampleProducts) {
      try {
        await pool.query(`
          INSERT INTO master_products (name, description, category, master_category, container_type, container_size, case_size, unit_size, brand, alcohol_percentage)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, product);
        console.log(`   ✅ Added: ${product[0]}`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          console.log(`   ⚠️  Skipped: ${product[0]} (already exists)`);
        } else {
          console.log(`   ❌ Failed: ${product[0]} - ${error.message}`);
        }
      }
    }

    // Update existing products to have unit sizes where missing
    console.log('📦 Updating existing products with unit sizes...');

    await pool.query(`
      UPDATE master_products
      SET unit_size = '12 bottles per case',
          master_category = 'wine',
          container_type = 'bottle',
          container_size = '750ml',
          case_size = 12
      WHERE category LIKE '%wine%' OR category LIKE '%chardonnay%' OR category LIKE '%sauvignon%'
      AND unit_size IS NULL
    `);

    await pool.query(`
      UPDATE master_products
      SET unit_size = '24 bottles per case',
          master_category = 'beer',
          container_type = 'bottle',
          container_size = '330ml',
          case_size = 24
      WHERE category LIKE '%beer%' OR category LIKE '%lager%'
      AND unit_size IS NULL
    `);

    console.log('✅ Migration completed successfully!');

    // Show final results
    const results = await pool.query(`
      SELECT name, unit_size, container_size, case_size, master_category
      FROM master_products
      WHERE unit_size IS NOT NULL
      LIMIT 10
    `);

    console.log('\n📋 Products with unit sizes:');
    results.rows.forEach(row => {
      console.log(`   ${row.name}`);
      console.log(`      Unit Size: ${row.unit_size}`);
      console.log(`      Container: ${row.container_size} | Case: ${row.case_size} | Category: ${row.master_category}`);
      console.log('');
    });

    // Show counts by category
    const counts = await pool.query(`
      SELECT master_category, COUNT(*) as count
      FROM master_products
      WHERE master_category IS NOT NULL
      GROUP BY master_category
      ORDER BY count DESC
    `);

    console.log('📊 Products by category:');
    counts.rows.forEach(row => {
      console.log(`   ${row.master_category}: ${row.count} products`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  completeUnitSizeMigration()
    .then(() => {
      console.log('\n🎉 Unit size migration complete! Master products now have structured unit information.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = completeUnitSizeMigration;