/**
 * REMOVE VOICE RECOGNITION
 *
 * This migration removes all voice recognition infrastructure:
 * - Drops voice_recognition_log table
 * - Removes phonetic search functions
 *
 * Voice recognition has been replaced with keyboard-based fuzzy search.
 *
 * Usage: node migrations/remove-voice-recognition.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🚀 Removing voice recognition infrastructure...\n');
    await client.query('BEGIN');

    // Step 1: Check if voice_recognition_log table exists
    console.log('1️⃣ Checking for voice_recognition_log table...');
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'voice_recognition_log'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('   Found voice_recognition_log table');

      // Check how many records exist
      const countResult = await client.query('SELECT COUNT(*) FROM voice_recognition_log');
      console.log(`   Table contains ${countResult.rows[0].count} records`);

      // Drop the table
      console.log('   Dropping voice_recognition_log table...');
      await client.query('DROP TABLE IF EXISTS voice_recognition_log CASCADE');
      console.log('   ✅ Table dropped');
    } else {
      console.log('   ✅ Table does not exist (already removed)');
    }

    // Step 2: Remove phonetic search function if it exists
    console.log('\n2️⃣ Removing phonetic search functions...');
    await client.query('DROP FUNCTION IF EXISTS calculate_phonetic_key CASCADE');
    console.log('   ✅ Phonetic functions removed');

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Voice recognition infrastructure removed successfully!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed, rolled back:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('🎉 Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { migrate };
