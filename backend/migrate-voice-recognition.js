const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrateVoiceRecognition() {
  try {
    console.log('🚀 Starting voice recognition database migration...');

    // Read the voice recognition schema SQL file
    const sqlFilePath = path.join(__dirname, 'voice-recognition-schema.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 Voice recognition schema loaded');

    // Execute the migration
    await pool.query(sql);

    console.log('✅ Voice recognition migration completed successfully!');

    // Verify the new tables were created
    const tableCheck = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('master_products', 'voice_recognition_log', 'product_aliases')
      ORDER BY table_name
    `);

    console.log('📊 New tables created:');
    tableCheck.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    // Check master_products sample data
    const sampleCount = await pool.query('SELECT COUNT(*) as count FROM master_products');
    console.log(`📦 Sample products loaded: ${sampleCount.rows[0].count}`);

    // Verify indexes were created
    const indexCheck = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('master_products', 'voice_recognition_log', 'product_aliases')
      AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `);

    console.log('⚡ Search indexes created:');
    indexCheck.rows.forEach(row => {
      console.log(`   ⚡ ${row.indexname}`);
    });

    // Test fuzzy search functions
    console.log('\n🧪 Testing fuzzy search functions...');

    const normalizeTest = await pool.query("SELECT normalize_for_search('Beck''s Beer 275ml') as result");
    console.log(`   📝 Normalize function: "${normalizeTest.rows[0].result}"`);

    const phoneticTest = await pool.query("SELECT calculate_phonetic_key('Chardonnay') as result");
    console.log(`   🔊 Phonetic function: "${phoneticTest.rows[0].result}"`);

    console.log('\n🎯 Voice recognition system ready for use!');
    console.log('Next steps:');
    console.log('   1. Import your CSV product data');
    console.log('   2. Test fuzzy search API endpoints');
    console.log('   3. Implement frontend voice component');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error migrating voice recognition system:', error);
    process.exit(1);
  }
}

migrateVoiceRecognition();