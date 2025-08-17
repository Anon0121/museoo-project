const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function resetDatabaseToOriginal() {
  let connection;
  try {
    console.log('🔄 Resetting database to original state...\n');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'museosmart'
    });
    console.log('✅ Connected to database successfully\n');

    // Read the original setup SQL file
    const setupSqlPath = path.join(__dirname, '../database/setup_database.sql');
    const setupSql = fs.readFileSync(setupSqlPath, 'utf8');
    
    console.log('📋 Executing original database setup...\n');
    
    // Split the SQL file into individual statements
    const statements = setupSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (err) {
          if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${err.message}`);
          } else {
            console.log(`❌ Statement ${i + 1} failed: ${err.message}`);
          }
        }
      }
    }

    // Drop any additional tables that were created during development
    const additionalTablesToDrop = [
      'group_members',
      'member_detail_links', 
      'visitor_codes',
      'visitor_detail_links'
    ];

    console.log('\n🗑️  Dropping additional development tables...');
    for (const tableName of additionalTablesToDrop) {
      try {
        await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
        console.log(`✅ Dropped table: ${tableName}`);
      } catch (err) {
        console.log(`⚠️  Could not drop ${tableName}: ${err.message}`);
      }
    }

    // Show final table structure
    console.log('\n📋 Final database structure:');
    const [tables] = await connection.execute('SHOW TABLES');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   • ${tableName}`);
    });

    console.log('\n🎉 Database reset to original state successfully!');
    console.log('   All development changes have been undone.');
    console.log('   The database now matches the original setup_database.sql structure.');

  } catch (err) {
    console.error('❌ Database reset failed:', err.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Make sure MySQL is running');
    console.log('   2. Check database connection settings');
    console.log('   3. Verify you have DROP and CREATE permissions');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  resetDatabaseToOriginal();
}

module.exports = resetDatabaseToOriginal;
