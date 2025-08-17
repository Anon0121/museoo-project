const mysql = require('mysql2/promise');

const checkDatabaseTables = async () => {
  let connection;
  
  try {
    console.log('🔍 Checking database tables for Event Registration System...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'museosmart'
    });
    
    console.log('✅ Connected to database');
    
    // Check if event_registrations table exists
    try {
      const [rows] = await connection.execute('DESCRIBE event_registrations');
      console.log('✅ event_registrations table exists');
      console.log('📋 Table structure:');
      rows.forEach(row => {
        console.log(`   • ${row.Field} - ${row.Type} ${row.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
      });
    } catch (error) {
      console.log('❌ event_registrations table does not exist');
    }
    
    // Check event_details table for capacity columns
    try {
      const [rows] = await connection.execute('DESCRIBE event_details');
      console.log('\n📋 event_details table structure:');
      rows.forEach(row => {
        console.log(`   • ${row.Field} - ${row.Type} ${row.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
      });
      
      const hasMaxCapacity = rows.some(row => row.Field === 'max_capacity');
      const hasCurrentRegistrations = rows.some(row => row.Field === 'current_registrations');
      
      if (hasMaxCapacity && hasCurrentRegistrations) {
        console.log('✅ Capacity columns exist in event_details table');
      } else {
        console.log('❌ Missing capacity columns in event_details table');
      }
    } catch (error) {
      console.log('❌ Error checking event_details table:', error.message);
    }
    
    // Check for indexes
    try {
      const [indexes] = await connection.execute('SHOW INDEX FROM event_registrations');
      console.log('\n📋 Indexes on event_registrations:');
      indexes.forEach(index => {
        console.log(`   • ${index.Key_name} on ${index.Column_name}`);
      });
    } catch (error) {
      console.log('❌ Error checking indexes:', error.message);
    }
    
    // Count records
    try {
      const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM event_registrations');
      console.log(`\n📊 Records in event_registrations: ${countResult[0].count}`);
    } catch (error) {
      console.log('❌ Error counting records:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking database tables:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

if (require.main === module) {
  checkDatabaseTables();
}

module.exports = checkDatabaseTables;

