const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkProfile() {
  try {
    const result = await pool.query(`
      SELECT first_name, last_name, primary_email, mobile_phone, profile_complete
      FROM user_profiles
      WHERE active = true
    `);

    if (result.rows.length > 0) {
      const profile = result.rows[0];
      console.log('Current Profile:');
      console.log('  First Name:', profile.first_name || 'NULL');
      console.log('  Last Name:', profile.last_name || 'NULL');
      console.log('  Primary Email:', profile.primary_email || 'NULL');
      console.log('  Mobile Phone:', profile.mobile_phone || 'NULL');
      console.log('  Profile Complete:', profile.profile_complete);

      const essentialFields = ['first_name', 'last_name', 'primary_email', 'mobile_phone'];
      const missingFields = essentialFields.filter(field => !profile[field]);

      if (missingFields.length > 0) {
        console.log('\nMissing Essential Fields:', missingFields.join(', '));
        console.log('This is why profile_complete is false');
      } else {
        console.log('\nAll essential fields present - profile should be complete');
      }
    } else {
      console.log('No active user profile found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkProfile();