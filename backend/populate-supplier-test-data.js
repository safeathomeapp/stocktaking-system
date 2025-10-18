const { Pool } = require('pg');

// Explicit Railway database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:tMpkSRqsDdrbECsTJYEAfgDNBchJjCdi@caboose.proxy.rlwy.net:35214/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function populateTestData() {
  const client = await pool.connect();

  try {
    console.log('Connected to Railway PostgreSQL database\n');

    await client.query('BEGIN');

    // 1. Delete existing sample data
    console.log('Step 1: Clearing existing sample data...');
    await client.query('DELETE FROM supplier_item_list');
    await client.query('DELETE FROM suppliers');
    console.log('✓ Sample data cleared\n');

    // 2. Create test suppliers
    console.log('Step 2: Creating test suppliers...');

    const suppliers = [
      {
        name: 'Heineken UK',
        contact_person: 'Sarah Johnson',
        contact_email: 'sarah.johnson@heineken.co.uk',
        phone: '0207 555 1234',
        address: '3 Brewery Wharf, Leeds, LS10 1JF'
      },
      {
        name: 'Coca-Cola Europacific Partners',
        contact_person: 'Michael Brown',
        contact_email: 'm.brown@ccep.com',
        phone: '0121 555 5678',
        address: 'Charter Place, Uxbridge, UB8 1EZ'
      },
      {
        name: 'Matthew Clark',
        contact_person: 'Emma Wilson',
        contact_email: 'emma.wilson@matthewclark.co.uk',
        phone: '0117 555 9012',
        address: 'Parkway Court, Bristol, BS32 4QG'
      }
    ];

    const supplierIds = [];
    for (const sup of suppliers) {
      const result = await client.query(`
        INSERT INTO suppliers (sup_name, sup_contact_person, sup_email, sup_phone, sup_address, sup_active)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING sup_id
      `, [sup.name, sup.contact_person, sup.contact_email, sup.phone, sup.address]);

      supplierIds.push({ name: sup.name, id: result.rows[0].sup_id });
      console.log(`✓ Created supplier: ${sup.name}`);
    }
    console.log('');

    // 3. Create test products for each supplier
    console.log('Step 3: Creating test products...\n');

    // Heineken UK products
    const heinekenId = supplierIds.find(s => s.name === 'Heineken UK').id;
    const heinekenProducts = [
      { sku: 'HNK-500-24', name: 'Heineken Lager', description: '500ml Bottles', size: '500ml', cost: 18.50, case_size: 24 },
      { sku: 'FOS-440-24', name: 'Fosters Lager', description: '440ml Cans', size: '440ml', cost: 16.20, case_size: 24 },
      { sku: 'BUL-568-20', name: 'Bulmers Original Cider', description: '568ml Bottles', size: '568ml', cost: 22.40, case_size: 20 },
      { sku: 'STA-500-20', name: 'Strongbow Dark Fruit', description: '500ml Cans', size: '500ml', cost: 19.80, case_size: 20 },
      { sku: 'BIT-330-24', name: 'Birra Moretti', description: '330ml Bottles', size: '330ml', cost: 24.00, case_size: 24 },
      { sku: 'SOL-330-24', name: 'Sol Beer', description: '330ml Bottles', size: '330ml', cost: 21.60, case_size: 24 },
      { sku: 'DES-330-24', name: 'Desperados', description: '330ml Bottles', size: '330ml', cost: 23.40, case_size: 24 },
      { sku: 'OLD-500-12', name: 'Old Mout Cider', description: '500ml Bottles', size: '500ml', cost: 16.80, case_size: 12 }
    ];

    // Coca-Cola products
    const cokeId = supplierIds.find(s => s.name === 'Coca-Cola Europacific Partners').id;
    const cokeProducts = [
      { sku: 'CC-330-24', name: 'Coca-Cola', description: '330ml Cans', size: '330ml', cost: 12.50, case_size: 24 },
      { sku: 'CD-330-24', name: 'Diet Coke', description: '330ml Cans', size: '330ml', cost: 12.50, case_size: 24 },
      { sku: 'CZ-330-24', name: 'Coke Zero', description: '330ml Cans', size: '330ml', cost: 12.50, case_size: 24 },
      { sku: 'SP-330-24', name: 'Sprite', description: '330ml Cans', size: '330ml', cost: 11.80, case_size: 24 },
      { sku: 'FN-330-24', name: 'Fanta Orange', description: '330ml Cans', size: '330ml', cost: 11.80, case_size: 24 },
      { sku: 'AP-200-24', name: 'Appletiser', description: '200ml Bottles', size: '200ml', cost: 14.40, case_size: 24 },
      { sku: 'SC-275-24', name: 'Schweppes Tonic', description: '275ml Bottles', size: '275ml', cost: 13.20, case_size: 24 },
      { sku: 'SG-275-24', name: 'Schweppes Ginger Ale', description: '275ml Bottles', size: '275ml', cost: 13.20, case_size: 24 }
    ];

    // Matthew Clark products (wines and spirits)
    const mcId = supplierIds.find(s => s.name === 'Matthew Clark').id;
    const mcProducts = [
      { sku: 'SB-750-6', name: 'Sauvignon Blanc', description: '75cl Bottles', size: '750ml', cost: 28.50, case_size: 6 },
      { sku: 'PN-750-6', name: 'Pinot Grigio', description: '75cl Bottles', size: '750ml', cost: 26.40, case_size: 6 },
      { sku: 'MR-750-6', name: 'Merlot', description: '75cl Bottles', size: '750ml', cost: 27.60, case_size: 6 },
      { sku: 'CS-750-6', name: 'Cabernet Sauvignon', description: '75cl Bottles', size: '750ml', cost: 29.80, case_size: 6 },
      { sku: 'PR-750-6', name: 'Prosecco', description: '75cl Bottles', size: '750ml', cost: 42.00, case_size: 6 },
      { sku: 'SM-700-6', name: 'Smirnoff Vodka', description: '70cl Bottles', size: '700ml', cost: 65.40, case_size: 6 },
      { sku: 'GG-700-6', name: "Gordon's Gin", description: '70cl Bottles', size: '700ml', cost: 58.80, case_size: 6 },
      { sku: 'JD-700-6', name: "Jack Daniel's", description: '70cl Bottles', size: '700ml', cost: 78.00, case_size: 6 },
      { sku: 'CP-700-6', name: 'Captain Morgan Rum', description: '70cl Bottles', size: '700ml', cost: 62.40, case_size: 6 }
    ];

    // Insert all products
    let totalProducts = 0;

    console.log('Creating Heineken UK products:');
    for (const prod of heinekenProducts) {
      await client.query(`
        INSERT INTO supplier_item_list (
          supplier_id, supplier_sku, supplier_name, supplier_description,
          supplier_size, unit_cost, case_size, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      `, [heinekenId, prod.sku, prod.name, prod.description, prod.size, prod.cost, prod.case_size]);
      console.log(`  ✓ ${prod.name} - ${prod.sku}`);
      totalProducts++;
    }

    console.log('\nCreating Coca-Cola products:');
    for (const prod of cokeProducts) {
      await client.query(`
        INSERT INTO supplier_item_list (
          supplier_id, supplier_sku, supplier_name, supplier_description,
          supplier_size, unit_cost, case_size, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      `, [cokeId, prod.sku, prod.name, prod.description, prod.size, prod.cost, prod.case_size]);
      console.log(`  ✓ ${prod.name} - ${prod.sku}`);
      totalProducts++;
    }

    console.log('\nCreating Matthew Clark products:');
    for (const prod of mcProducts) {
      await client.query(`
        INSERT INTO supplier_item_list (
          supplier_id, supplier_sku, supplier_name, supplier_description,
          supplier_size, unit_cost, case_size, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      `, [mcId, prod.sku, prod.name, prod.description, prod.size, prod.cost, prod.case_size]);
      console.log(`  ✓ ${prod.name} - ${prod.sku}`);
      totalProducts++;
    }

    await client.query('COMMIT');

    console.log('\n========================================');
    console.log('✓ Test data populated successfully!');
    console.log('========================================');
    console.log(`Total Suppliers: ${suppliers.length}`);
    console.log(`Total Products: ${totalProducts}`);
    console.log('========================================\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

populateTestData()
  .then(() => {
    console.log('✓ Script completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err.message);
    process.exit(1);
  });
