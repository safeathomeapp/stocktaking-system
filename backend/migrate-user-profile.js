const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateUserProfile() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting User Profile Migration...');
    console.log('📅 Date:', new Date().toISOString());

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-user-profile-table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📖 Executing SQL migration...');

    // Execute the SQL
    await client.query(sqlContent);

    console.log('✅ User Profile table created successfully!');

    // Verify the table exists and check structure
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position;
    `);

    console.log(`\n📊 Table Structure (${tableCheck.rows.length} columns):`);
    tableCheck.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Check if default user was inserted
    const userCheck = await client.query('SELECT id, first_name, last_name, preferred_name, profile_complete FROM user_profiles LIMIT 1');

    if (userCheck.rows.length > 0) {
      const user = userCheck.rows[0];
      console.log(`\n👤 Default User Created:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Preferred: ${user.preferred_name}`);
      console.log(`   Profile Complete: ${user.profile_complete}`);
    }

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('📋 Full error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper function to check current user profile
async function checkUserProfile() {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        id, first_name, last_name, preferred_name,
        primary_email, mobile_phone,
        city, county, country,
        profile_complete, active,
        created_at
      FROM user_profiles
      WHERE active = true
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      console.log('\n📋 Current Active User Profile:');
      const user = result.rows[0];
      Object.keys(user).forEach(key => {
        console.log(`   ${key}: ${user[key]}`);
      });
    } else {
      console.log('\n⚠️  No active user profile found');
    }

  } catch (error) {
    console.error('❌ Error checking user profile:', error.message);
  } finally {
    client.release();
  }
}

// Main execution
if (require.main === module) {
  migrateUserProfile()
    .then(() => checkUserProfile())
    .then(() => {
      console.log('\n✨ User Profile migration complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { migrateUserProfile, checkUserProfile };