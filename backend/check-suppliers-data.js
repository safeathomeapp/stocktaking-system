const { Pool } = require('pg');

// Explicit Railway database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:tMpkSRqsDdrbECsTJYEAfgDNBchJjCdi@caboose.proxy.rlwy.net:35214/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkData() {
  const client = await pool.connect();

  try {
    console.log('Connected to Railway PostgreSQL database\n');

    // Check suppliers
    console.log('=== SUPPLIERS ===');
    const suppliers = await client.query('SELECT * FROM suppliers LIMIT 10');
    console.log(`Found ${suppliers.rows.length} suppliers:`);
    suppliers.rows.forEach(sup => {
      console.log(`- ID: ${sup.sup_id}, Name: ${sup.sup_name}, Contact: ${sup.sup_contact_person || 'N/A'}`);
    });

    console.log('\n=== SUPPLIER ITEM LIST ===');
    const items = await client.query(`
      SELECT sil.*, s.sup_name as supplier_name
      FROM supplier_item_list sil
      LEFT JOIN suppliers s ON sil.supplier_id = s.sup_id
      LIMIT 20
    `);
    console.log(`Found ${items.rows.length} supplier items:`);
    items.rows.forEach(item => {
      console.log(`- Supplier: ${item.supplier_name}, Product: ${item.supplier_name}, SKU: ${item.supplier_sku || 'N/A'}, Cost: £${item.unit_cost || 'N/A'}`);
    });

    console.log('\n=== SUMMARY ===');
    const supplierCount = await client.query('SELECT COUNT(*) FROM suppliers');
    const itemCount = await client.query('SELECT COUNT(*) FROM supplier_item_list');
    console.log(`Total Suppliers: ${supplierCount.rows[0].count}`);
    console.log(`Total Supplier Items: ${itemCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkData()
  .then(() => {
    console.log('\n✓ Check completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  });
