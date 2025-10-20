const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function importMasterProducts() {
  const client = await pool.connect();
  const csvFilePath = path.join(__dirname, '..', '..', 'master_products_comprehensive.csv');

  try {
    console.log('\n📦 Starting Master Products Import...\n');
    console.log(`Reading CSV from: ${csvFilePath}\n`);

    // Start transaction
    await client.query('BEGIN');

    // Clear existing master_products table
    console.log('🗑️  Clearing existing master_products data...');
    const deleteResult = await client.query('DELETE FROM master_products');
    console.log(`   ✓ Deleted ${deleteResult.rowCount} existing records\n`);

    // Read and parse CSV
    const products = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          products.push({
            name: row.name,
            brand: row.brand || null,
            category: row.category || null,
            subcategory: row.subcategory || null,
            unit_type: row.unit_type || null,
            unit_size: row.unit_size ? parseInt(row.unit_size) : null,
            case_size: row.case_size ? parseInt(row.case_size) : null
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 Found ${products.length} products to import\n`);

    // Insert products in batches of 50
    const batchSize = 50;
    let imported = 0;
    let categoryStats = {};

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      for (const product of batch) {
        await client.query(
          `INSERT INTO master_products
           (name, brand, category, subcategory, unit_type, unit_size, case_size, active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
          [
            product.name,
            product.brand,
            product.category,
            product.subcategory,
            product.unit_type,
            product.unit_size,
            product.case_size
          ]
        );

        // Track category stats
        const category = product.category || 'Unknown';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
        imported++;
      }

      // Progress indicator
      const progress = Math.min(100, Math.round((imported / products.length) * 100));
      process.stdout.write(`\r   Importing... ${progress}% (${imported}/${products.length})`);
    }

    console.log('\n');

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n✅ Import completed successfully!\n');
    console.log('📊 Products imported by category:\n');

    // Sort categories alphabetically and display
    Object.keys(categoryStats)
      .sort()
      .forEach(category => {
        console.log(`   ${category}: ${categoryStats[category]} products`);
      });

    console.log(`\n📦 Total products imported: ${imported}\n`);

    // Verify import
    const countResult = await client.query('SELECT COUNT(*) FROM master_products');
    console.log(`✓ Database verification: ${countResult.rows[0].count} records in master_products table\n`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Import failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run import if this file is executed directly
if (require.main === module) {
  importMasterProducts()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nImport error:', error);
      process.exit(1);
    });
}

module.exports = importMasterProducts;
