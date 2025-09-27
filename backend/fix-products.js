const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixProducts() {
  try {
    console.log('🚀 Fixing products issue...');

    // Clear existing products first
    await pool.query('DELETE FROM products');
    console.log('🗑️  Cleared existing products');

    // Get first venue and its first area
    const venueResult = await pool.query('SELECT id, name FROM venues LIMIT 1');
    if (venueResult.rows.length === 0) {
      console.log('❌ No venues found');
      return;
    }

    const venue = venueResult.rows[0];
    console.log(`🏢 Using venue: ${venue.name} (${venue.id})`);

    const areaResult = await pool.query(
      'SELECT id, name FROM venue_areas WHERE venue_id = $1 ORDER BY display_order LIMIT 1',
      [venue.id]
    );

    if (areaResult.rows.length === 0) {
      console.log('❌ No areas found for venue');
      return;
    }

    const area = areaResult.rows[0];
    console.log(`📍 Using area: ${area.name} (${area.id})`);

    // Add sample products (using valid unit_type values: bottle, keg, case, can, jar, packet, other)
    const products = [
      { name: 'Budweiser', category: 'Beer', brand: 'Budweiser', size: '330ml', unit_type: 'bottle', expected_count: 24 },
      { name: 'Stella Artois', category: 'Beer', brand: 'Stella Artois', size: '330ml', unit_type: 'bottle', expected_count: 24 },
      { name: 'Guinness', category: 'Beer', brand: 'Guinness', size: '440ml', unit_type: 'can', expected_count: 12 },
      { name: 'Smirnoff Vodka', category: 'Spirits', brand: 'Smirnoff', size: '700ml', unit_type: 'bottle', expected_count: 2 },
      { name: 'Jack Daniels', category: 'Spirits', brand: 'Jack Daniels', size: '700ml', unit_type: 'bottle', expected_count: 1 }
    ];

    for (const product of products) {
      const result = await pool.query(
        `INSERT INTO products (venue_id, area_id, name, category, brand, size, unit_type, expected_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name`,
        [venue.id, area.id, product.name, product.category, product.brand, product.size, product.unit_type, product.expected_count]
      );
      console.log(`✅ Added: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
    }

    // Verify
    const countResult = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`\n📦 Total products: ${countResult.rows[0].count}`);

    // Test the API endpoint
    console.log('\n🧪 Testing venue products API...');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing products:', error);
    process.exit(1);
  }
}

fixProducts();