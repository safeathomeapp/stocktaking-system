const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addSampleProducts() {
  try {
    console.log('🚀 Adding sample products to venues...');

    // Get all venues
    const venuesResult = await pool.query('SELECT id, name FROM venues');
    console.log(`Found ${venuesResult.rows.length} venues`);

    for (const venue of venuesResult.rows) {
      console.log(`\n🏢 Adding products to: ${venue.name}`);

      // Get the first area for this venue (Bar Area)
      const areaResult = await pool.query(
        'SELECT id FROM venue_areas WHERE venue_id = $1 ORDER BY display_order LIMIT 1',
        [venue.id]
      );

      if (areaResult.rows.length === 0) {
        console.log(`   ⚠️  No areas found for ${venue.name}`);
        continue;
      }

      const areaId = areaResult.rows[0].id;

      // Sample products to add
      const products = [
        { name: 'Budweiser', category: 'Beer', brand: 'Budweiser', size: '330ml', unit_type: 'bottles', expected_count: 24 },
        { name: 'Stella Artois', category: 'Beer', brand: 'Stella Artois', size: '330ml', unit_type: 'bottles', expected_count: 24 },
        { name: 'Guinness', category: 'Beer', brand: 'Guinness', size: '440ml', unit_type: 'cans', expected_count: 12 },
        { name: 'Smirnoff Vodka', category: 'Spirits', brand: 'Smirnoff', size: '700ml', unit_type: 'bottles', expected_count: 2 },
        { name: 'Jack Daniels', category: 'Spirits', brand: 'Jack Daniels', size: '700ml', unit_type: 'bottles', expected_count: 1 },
        { name: 'House Chardonnay', category: 'Wine', brand: 'House Wine', size: '750ml', unit_type: 'bottles', expected_count: 6 },
        { name: 'Coca Cola', category: 'Soft Drinks', brand: 'Coca Cola', size: '330ml', unit_type: 'bottles', expected_count: 48 },
        { name: 'Orange Juice', category: 'Soft Drinks', brand: 'Tropicana', size: '1L', unit_type: 'cartons', expected_count: 6 }
      ];

      // Insert products for this venue
      for (const product of products) {
        try {
          await pool.query(
            `INSERT INTO products (venue_id, area_id, name, category, brand, size, unit_type, expected_count)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT DO NOTHING`,
            [venue.id, areaId, product.name, product.category, product.brand, product.size, product.unit_type, product.expected_count]
          );
          console.log(`   ✅ Added: ${product.name}`);
        } catch (err) {
          console.log(`   ⚠️  Skipped: ${product.name} (already exists)`);
        }
      }
    }

    // Verify products were added
    const totalProducts = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`\n📦 Total products in database: ${totalProducts.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample products:', error);
    process.exit(1);
  }
}

addSampleProducts();