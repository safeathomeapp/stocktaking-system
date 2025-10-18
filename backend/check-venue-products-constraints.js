const { Pool } = require('pg');

// Explicit Railway database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:tMpkSRqsDdrbECsTJYEAfgDNBchJjCdi@caboose.proxy.rlwy.net:35214/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkConstraints() {
  const client = await pool.connect();

  try {
    console.log('Connected to Railway PostgreSQL database');
    console.log('\nChecking venue_products table constraints...\n');

    // Check all constraints on venue_products table
    const constraints = await client.query(`
      SELECT
        con.conname as constraint_name,
        con.contype as constraint_type,
        CASE con.contype
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'u' THEN 'UNIQUE'
          WHEN 'f' THEN 'FOREIGN KEY'
          WHEN 'c' THEN 'CHECK'
          ELSE con.contype::text
        END as type_description,
        pg_get_constraintdef(con.oid) as definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = connamespace
      WHERE rel.relname = 'venue_products'
      ORDER BY con.contype, con.conname
    `);

    console.log('Current constraints on venue_products table:');
    console.log('================================================\n');

    constraints.rows.forEach(row => {
      console.log(`Constraint: ${row.constraint_name}`);
      console.log(`Type: ${row.type_description}`);
      console.log(`Definition: ${row.definition}`);
      console.log('---');
    });

    console.log(`\nTotal constraints: ${constraints.rows.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkConstraints()
  .then(() => {
    console.log('\n✓ Check completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  });
