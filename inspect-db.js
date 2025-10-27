#!/usr/bin/env node

const { Pool } = require('pg');
const readline = require('readline');

// Database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'stocktaking_local',
  user: 'postgres',
  password: ''
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getAllTables() {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    return result.rows.map(row => row.table_name);
  } catch (err) {
    console.error('Error fetching tables:', err.message);
    return [];
  }
}

async function getTableColumns(tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    return result.rows;
  } catch (err) {
    console.error('Error fetching columns:', err.message);
    return [];
  }
}

async function getTableData(tableName) {
  try {
    const result = await pool.query(`SELECT * FROM ${tableName} LIMIT 10`);
    return result.rows;
  } catch (err) {
    console.error('Error fetching data:', err.message);
    return [];
  }
}

async function getTableCount(tableName) {
  try {
    const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return result.rows[0].count;
  } catch (err) {
    console.error('Error fetching count:', err.message);
    return 0;
  }
}

function displayTableInfo(tableName, columns, data, count) {
  console.clear();
  console.log('\n' + '='.repeat(80));
  console.log(`📊 TABLE: ${tableName.toUpperCase()}`);
  console.log('='.repeat(80));

  // Display columns
  console.log('\n📋 COLUMNS:');
  console.log('-'.repeat(80));
  columns.forEach(col => {
    const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
    const defaultVal = col.column_default ? ` DEFAULT: ${col.column_default}` : '';
    console.log(`  • ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
  });

  // Display record count
  console.log('\n📈 RECORD COUNT:');
  console.log('-'.repeat(80));
  console.log(`  Total records: ${count}`);

  // Display first 10 records
  if (data.length > 0) {
    console.log('\n📄 FIRST 10 RECORDS:');
    console.log('-'.repeat(80));
    console.table(data);
  } else {
    console.log('\n⚠️  No data in this table');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

async function promptForTable(tables) {
  return new Promise((resolve) => {
    console.clear();
    console.log('\n📚 AVAILABLE TABLES:\n');
    tables.forEach((table, index) => {
      console.log(`  ${(index + 1).toString().padStart(2)}. ${table}`);
    });

    rl.question('\n🔍 Enter table number (or "q" to quit): ', (answer) => {
      if (answer.toLowerCase() === 'q') {
        resolve(null);
      } else {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < tables.length) {
          resolve(tables[index]);
        } else {
          console.log('❌ Invalid selection');
          setTimeout(() => promptForTable(tables).then(resolve), 1000);
        }
      }
    });
  });
}

async function main() {
  console.log('\n🗄️  DATABASE INSPECTOR - Stock Taking System\n');

  const tables = await getAllTables();

  if (tables.length === 0) {
    console.error('❌ No tables found. Is the database running?');
    rl.close();
    pool.end();
    return;
  }

  let continueInspecting = true;

  while (continueInspecting) {
    const selectedTable = await promptForTable(tables);

    if (!selectedTable) {
      console.log('👋 Goodbye!\n');
      continueInspecting = false;
    } else {
      const columns = await getTableColumns(selectedTable);
      const data = await getTableData(selectedTable);
      const count = await getTableCount(selectedTable);

      displayTableInfo(selectedTable, columns, data, count);

      rl.question('Press Enter to continue...', () => {
        // Continue loop
      });
    }
  }

  rl.close();
  pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  rl.close();
  pool.end();
  process.exit(1);
});
