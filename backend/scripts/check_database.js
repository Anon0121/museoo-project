const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function checkDatabase() {
  let connection;
  
  try {
    console.log('🔍 Checking current database structure...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to museosmart database');
    
    // Get all tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📊 Current tables in database:');
    
    if (tables.length === 0) {
      console.log('  ❌ No tables found in database');
    } else {
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`  ${index + 1}. ✅ ${tableName}`);
      });
    }
    
    // Check system_user table specifically
    if (tables.some(table => Object.values(table)[0] === 'system_user')) {
      console.log('\n👤 system_user table details:');
      
      // Show table structure
      const [structure] = await connection.execute('DESCRIBE system_user');
      console.log('  📋 Table structure:');
      structure.forEach(field => {
        console.log(`    - ${field.Field}: ${field.Type} ${field.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // Show user count
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM system_user');
      console.log(`  📊 Total users: ${userCount[0].count}`);
      
      // Show admin user
      const [adminUser] = await connection.execute(`
        SELECT user_ID, username, firstname, lastname, email, role, status 
        FROM system_user WHERE username = 'admin'
      `);
      
      if (adminUser.length > 0) {
        console.log('  👑 Admin user:');
        console.log(`    - Username: ${adminUser[0].username}`);
        console.log(`    - Email: ${adminUser[0].email || 'N/A'}`);
        console.log(`    - Role: ${adminUser[0].role}`);
        console.log(`    - Status: ${adminUser[0].status}`);
      } else {
        console.log('  ❌ Admin user not found');
      }
    } else {
      console.log('\n❌ system_user table not found');
    }
    
    // Expected tables list
    const expectedTables = [
      'system_user',
      'bookings', 
      'visitors',
      'activities',
      'event_details',
      'exhibit_details',
      'images',
      'archives',
      'donations',
      'donation_details',
      'cultural_objects',
      'object_details'
    ];
    
    const existingTables = tables.map(table => Object.values(table)[0]);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    const extraTables = existingTables.filter(table => !expectedTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing expected tables:');
      missingTables.forEach(table => console.log(`  ❌ ${table}`));
    }
    
    if (extraTables.length > 0) {
      console.log('\n📝 Extra tables found:');
      extraTables.forEach(table => console.log(`  ℹ️  ${table}`));
    }
    
    if (missingTables.length === 0 && extraTables.length === 0) {
      console.log('\n🎉 Database structure is complete!');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Database "museosmart" does not exist. Run setup_complete_database.js to create it.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check
checkDatabase(); 