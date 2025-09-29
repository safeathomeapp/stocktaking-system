const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function furtherStreamlineUserProfile() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting Further User Profile Streamlining...');
    console.log('📅 Date:', new Date().toISOString());

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'further-streamline-profile.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📖 Executing further SQL streamlining...');

    // Execute the SQL
    await client.query(sqlContent);

    console.log('✅ User Profile table further streamlined successfully!');

    // Verify the updated table structure
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position;
    `);

    console.log(`\n📊 Updated Table Structure (${tableCheck.rows.length} columns):`);
    console.log('   Additional removed fields: tiktok_handle, snapchat_handle, profile_picture_url, preferred_name');
    console.log('   Remaining fields:');
    tableCheck.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Check current user profile
    const userCheck = await client.query('SELECT id, first_name, last_name, profile_complete FROM user_profiles LIMIT 1');

    if (userCheck.rows.length > 0) {
      const user = userCheck.rows[0];
      console.log(`\n👤 Current User Profile:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Profile Complete: ${user.profile_complete}`);
    }

    console.log('\n🎉 Further streamlining completed successfully!');

  } catch (error) {
    console.error('❌ Further streamlining failed:', error.message);
    console.error('📋 Full error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
if (require.main === module) {
  furtherStreamlineUserProfile()
    .then(() => {
      console.log('\n✨ Further User Profile streamlining complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Further streamlining failed:', error.message);
      process.exit(1);
    });
}

module.exports = { furtherStreamlineUserProfile };