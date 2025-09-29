const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateSupplierMappings() {
  console.log('🔄 Setting up supplier mapping tables...');

  try {
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'create-supplier-mappings-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📦 Creating supplier mapping tables...');
    await pool.query(sql);

    console.log('✅ Supplier mapping tables created successfully!');

    // Show what was created
    const suppliers = await pool.query('SELECT name, type, description FROM suppliers ORDER BY name');
    console.log('\n📋 Available suppliers:');
    suppliers.rows.forEach(supplier => {
      console.log(`   ${supplier.name} (${supplier.type}): ${supplier.description}`);
    });

    // Show parsing rules
    const rules = await pool.query(`
      SELECT s.name as supplier_name, pr.rule_name, pr.target_field
      FROM parsing_rules pr
      JOIN suppliers s ON pr.supplier_id = s.id
      ORDER BY s.name, pr.priority
    `);

    console.log('\n📊 Parsing rules:');
    rules.rows.forEach(rule => {
      console.log(`   ${rule.supplier_name}: ${rule.rule_name} → ${rule.target_field}`);
    });

    console.log('\n🎯 Example Bookers data processing:');
    console.log('   POST /api/suppliers/bookers/process');
    console.log('   Body: {');
    console.log('     "invoiceData": [');
    console.log('       {');
    console.log('         "internal_code": "BK123456",');
    console.log('         "description": "Coca Cola Can",');
    console.log('         "pack": "24",');
    console.log('         "size": "330ml",');
    console.log('         "qty": "2",');
    console.log('         "price": "18.50",');
    console.log('         "value": "37.00"');
    console.log('       }');
    console.log('     ]');
    console.log('   }');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateSupplierMappings()
    .then(() => {
      console.log('\n🎉 Supplier mapping system ready!');
      console.log('You can now process Bookers invoices, CSV imports, and other supplier data.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateSupplierMappings;