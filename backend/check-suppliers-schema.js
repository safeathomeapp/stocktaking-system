const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:tMpkSRqsDdrbECsTJYEAfgDNBchJjCdi@caboose.proxy.rlwy.net:35214/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkSchema() {
  const client = await pool.connect();

  try {
    console.log('Checking suppliers table schema:\n');

    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'suppliers'
      ORDER BY ordinal_position
    `);

    console.log('Columns in suppliers table:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    console.log('\nChecking supplier_item_list table schema:\n');

    const result2 = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'supplier_item_list'
      ORDER BY ordinal_position
    `);

    console.log('Columns in supplier_item_list table:');
    result2.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
