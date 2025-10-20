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
    console.log('Checking invoice-related tables:\n');

    // Check for invoices table
    const invoicesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'invoices'
      );
    `);

    if (invoicesCheck.rows[0].exists) {
      console.log('=== INVOICES TABLE ===');
      const invoicesSchema = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'invoices'
        ORDER BY ordinal_position
      `);
      invoicesSchema.rows.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('❌ invoices table does not exist');
    }

    console.log('\n');

    // Check for invoice_line_items table
    const lineItemsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'invoice_line_items'
      );
    `);

    if (lineItemsCheck.rows[0].exists) {
      console.log('=== INVOICE_LINE_ITEMS TABLE ===');
      const lineItemsSchema = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'invoice_line_items'
        ORDER BY ordinal_position
      `);
      lineItemsSchema.rows.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('❌ invoice_line_items table does not exist');
    }

    console.log('\n');

    // Check supplier_item_list
    console.log('=== SUPPLIER_ITEM_LIST TABLE ===');
    const supplierItemsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'supplier_item_list'
      ORDER BY ordinal_position
    `);
    supplierItemsSchema.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n');

    // Check master_products
    console.log('=== MASTER_PRODUCTS TABLE ===');
    const masterProductsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'master_products'
      ORDER BY ordinal_position
    `);
    masterProductsSchema.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n');

    // Check suppliers
    console.log('=== SUPPLIERS TABLE ===');
    const suppliersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'suppliers'
      ORDER BY ordinal_position
    `);
    suppliersSchema.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
