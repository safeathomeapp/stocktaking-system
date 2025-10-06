/**
 * COMPREHENSIVE SCHEMA REFACTORING
 *
 * This migration performs a complete cleanup of the product tables:
 *
 * 1. Rename products → venue_products (clearer naming)
 * 2. Remove redundant fields from venue_products (brand, size, etc.)
 * 3. Make master_product_id NOT NULL (enforce proper linking)
 * 4. Remove product_aliases table (redundant with venue_products.name)
 *
 * PHILOSOPHY:
 * - venue_products: "What does this venue call this product?"
 * - master_products: "What IS this product?" (all specifications)
 *
 * Usage: node migrations/refactor-to-venue-products.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting comprehensive schema refactoring...\n');
    await client.query('BEGIN');

    // Step 1: Check current state
    console.log('1️⃣ Analyzing current schema...');
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('products', 'venue_products', 'product_aliases')
      ORDER BY table_name
    `);

    const existingTables = tableCheck.rows.map(r => r.table_name);
    console.log('   Found tables:', existingTables.join(', '));

    // Step 2: Check for orphaned products (no master_product_id)
    if (existingTables.includes('products')) {
      console.log('\n2️⃣ Checking for orphaned products...');
      const orphanCheck = await client.query(`
        SELECT COUNT(*) as count
        FROM products
        WHERE master_product_id IS NULL
      `);

      const orphanCount = parseInt(orphanCheck.rows[0].count);
      console.log(`   Found ${orphanCount} products without master_product_id`);

      if (orphanCount > 0) {
        console.log('   ⚠️  WARNING: These products will need master_product_id before migration completes');
        const orphans = await client.query(`
          SELECT id, name, venue_id
          FROM products
          WHERE master_product_id IS NULL
          LIMIT 5
        `);
        console.log('   Sample orphaned products:');
        orphans.rows.forEach(p => {
          console.log(`      - ${p.name} (${p.id})`);
        });
      }
    }

    // Step 3: Rename products to venue_products
    if (existingTables.includes('products') && !existingTables.includes('venue_products')) {
      console.log('\n3️⃣ Renaming products → venue_products...');
      await client.query('ALTER TABLE products RENAME TO venue_products');
      console.log('   ✅ Table renamed');
    } else if (existingTables.includes('venue_products')) {
      console.log('\n3️⃣ Table already named venue_products, skipping rename');
    }

    // Step 4: Check current columns
    console.log('\n4️⃣ Checking venue_products schema...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'venue_products'
      ORDER BY ordinal_position
    `);

    const columnNames = columns.rows.map(c => c.column_name);
    console.log('   Current columns:', columnNames.join(', '));

    // Step 5: Remove redundant columns
    const columnsToRemove = ['brand', 'size', 'unit_type', 'barcode', 'area_id', 'expected_count', 'category'];
    const existingColumnsToRemove = columnsToRemove.filter(col => columnNames.includes(col));

    if (existingColumnsToRemove.length > 0) {
      console.log('\n5️⃣ Removing redundant columns...');
      for (const column of existingColumnsToRemove) {
        console.log(`   Dropping ${column}...`);
        await client.query(`ALTER TABLE venue_products DROP COLUMN IF EXISTS ${column}`);
      }
      console.log(`   ✅ Removed ${existingColumnsToRemove.length} columns`);
    } else {
      console.log('\n5️⃣ No redundant columns to remove');
    }

    // Step 6: Make master_product_id NOT NULL (if not already)
    console.log('\n6️⃣ Enforcing master_product_id NOT NULL...');
    const masterProductIdCheck = await client.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'venue_products'
      AND column_name = 'master_product_id'
    `);

    if (masterProductIdCheck.rows[0]?.is_nullable === 'YES') {
      // First, update any NULL values (if strategy determined)
      const nullCount = await client.query(`
        SELECT COUNT(*) FROM venue_products WHERE master_product_id IS NULL
      `);

      if (parseInt(nullCount.rows[0].count) > 0) {
        console.log(`   ⚠️  Found ${nullCount.rows[0].count} rows with NULL master_product_id`);
        console.log('   These rows cannot be migrated automatically.');
        console.log('   Skipping NOT NULL constraint for now.');
      } else {
        await client.query(`
          ALTER TABLE venue_products
          ALTER COLUMN master_product_id SET NOT NULL
        `);
        console.log('   ✅ master_product_id is now NOT NULL');
      }
    } else {
      console.log('   ✅ master_product_id already NOT NULL');
    }

    // Step 7: Add unique constraint on (venue_id, master_product_id)
    console.log('\n7️⃣ Adding unique constraint...');
    const constraintCheck = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'venue_products'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'venue_products_venue_master_unique'
    `);

    if (constraintCheck.rows.length === 0) {
      try {
        await client.query(`
          ALTER TABLE venue_products
          ADD CONSTRAINT venue_products_venue_master_unique
          UNIQUE (venue_id, master_product_id)
        `);
        console.log('   ✅ Unique constraint added');
      } catch (err) {
        if (err.code === '23505') {
          console.log('   ⚠️  Duplicate rows exist, cannot add unique constraint');
          console.log('   Run: SELECT venue_id, master_product_id, COUNT(*) FROM venue_products GROUP BY venue_id, master_product_id HAVING COUNT(*) > 1');
        } else {
          throw err;
        }
      }
    } else {
      console.log('   ✅ Unique constraint already exists');
    }

    // Step 8: Update foreign key constraints
    console.log('\n8️⃣ Updating foreign key constraints...');

    // Check stock_entries constraint
    const fkCheck = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints tc
      WHERE tc.table_name = 'stock_entries'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name LIKE '%product%'
    `);

    console.log(`   Found ${fkCheck.rows.length} foreign key constraints on stock_entries`);

    // The FK should automatically work after table rename, no action needed
    console.log('   ✅ Foreign keys still valid after rename');

    // Step 9: Drop product_aliases table
    if (existingTables.includes('product_aliases')) {
      console.log('\n9️⃣ Removing product_aliases table...');
      await client.query('DROP TABLE IF EXISTS product_aliases CASCADE');
      console.log('   ✅ product_aliases table removed');
    } else {
      console.log('\n9️⃣ product_aliases table already removed');
    }

    // Step 10: Create helpful indexes
    console.log('\n🔟 Creating performance indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_venue_products_venue_id
      ON venue_products(venue_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_venue_products_master_product_id
      ON venue_products(master_product_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_venue_products_name
      ON venue_products(name)
    `);
    console.log('   ✅ Indexes created');

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!\n');

    // Show final schema
    console.log('📋 Final venue_products schema:');
    const finalSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'venue_products'
      ORDER BY ordinal_position
    `);

    finalSchema.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`   ${col.column_name}: ${col.data_type} ${nullable}${def}`);
    });

    console.log('\n🎯 Summary:');
    console.log('   ✅ products renamed to venue_products');
    console.log('   ✅ Redundant fields removed (brand, size, unit_type, etc.)');
    console.log('   ✅ product_aliases table removed');
    console.log('   ✅ Indexes created for performance');
    console.log('\n📝 Next: Update application code to use new schema\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed, rolled back:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('🎉 Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { migrate };
