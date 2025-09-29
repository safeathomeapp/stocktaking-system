const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function streamlineUserProfile() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting User Profile Streamlining...');
    console.log('📅 Date:', new Date().toISOString());

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'streamline-user-profile.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📖 Executing SQL streamlining...');

    // Execute the SQL
    await client.query(sqlContent);

    console.log('✅ User Profile table streamlined successfully!');

    // Verify the updated table structure
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position;
    `);

    console.log(`\n📊 Updated Table Structure (${tableCheck.rows.length} columns):`);
    console.log('   Removed fields: date_of_birth, industry, emergency_contact_*');
    console.log('   Remaining fields:');
    tableCheck.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Check current user profile
    const userCheck = await client.query('SELECT id, first_name, last_name, preferred_name, profile_complete FROM user_profiles LIMIT 1');

    if (userCheck.rows.length > 0) {
      const user = userCheck.rows[0];
      console.log(`\n👤 Current User Profile:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Preferred: ${user.preferred_name}`);
      console.log(`   Profile Complete: ${user.profile_complete}`);
    }

    console.log('\n🎉 Streamlining completed successfully!');

  } catch (error) {
    console.error('❌ Streamlining failed:', error.message);
    console.error('📋 Full error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
if (require.main === module) {
  streamlineUserProfile()
    .then(() => {
      console.log('\n✨ User Profile streamlining complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Streamlining failed:', error.message);
      process.exit(1);
    });
}

module.exports = { streamlineUserProfile };