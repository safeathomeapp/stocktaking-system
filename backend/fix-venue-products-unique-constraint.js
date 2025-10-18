const { Pool } = require('pg');

// Explicit Railway database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:tMpkSRqsDdrbECsTJYEAfgDNBchJjCdi@caboose.proxy.rlwy.net:35214/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixConstraint() {
  const client = await pool.connect();

  try {
    console.log('Connected to Railway PostgreSQL database');
    console.log('\nFixing venue_products unique constraint...\n');

    await client.query('BEGIN');

    // Check if old constraint exists
    const oldConstraint = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'venue_products'
      AND constraint_name = 'venue_products_venue_master_unique'
    `);

    if (oldConstraint.rows.length > 0) {
      console.log('✓ Found old constraint: venue_products_venue_master_unique');
      console.log('  Definition: UNIQUE (venue_id, master_product_id)');
      console.log('  This prevents the same product in different areas!\n');

      // Drop old constraint
      console.log('Dropping old constraint...');
      await client.query(`
        ALTER TABLE venue_products
        DROP CONSTRAINT venue_products_venue_master_unique
      `);
      console.log('✓ Old constraint dropped\n');
    } else {
      console.log('ℹ Old constraint not found (may have been already removed)\n');
    }

    // Check if new constraint already exists
    const newConstraint = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'venue_products'
      AND constraint_name = 'venue_products_venue_master_area_unique'
    `);

    if (newConstraint.rows.length > 0) {
      console.log('ℹ New constraint already exists: venue_products_venue_master_area_unique\n');
    } else {
      // Add new constraint
      console.log('Adding new constraint: venue_products_venue_master_area_unique');
      console.log('  Definition: UNIQUE (venue_id, master_product_id, area_id)');
      console.log('  This allows the same product in different areas!\n');

      await client.query(`
        ALTER TABLE venue_products
        ADD CONSTRAINT venue_products_venue_master_area_unique
        UNIQUE (venue_id, master_product_id, area_id)
      `);
      console.log('✓ New constraint added\n');
    }

    await client.query('COMMIT');

    console.log('✓ Constraint migration completed successfully!');
    console.log('\nNow you can add the same product to different areas in the same venue.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixConstraint()
  .then(() => {
    console.log('\n✓ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  });
