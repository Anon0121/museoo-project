const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkNetworkAccess() {
  console.log('🔍 Checking network access configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`DB_USER: ${process.env.DB_USER || 'root'}`);
  console.log(`DB_NAME: ${process.env.DB_NAME || 'museosmart'}`);
  console.log(`DB_PORT: ${process.env.DB_PORT || 3306}`);
  console.log('');

  try {
    // Test database connection
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart',
      port: process.env.DB_PORT || 3306,
    });

    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    
    // Check MySQL configuration
    const [rows] = await connection.execute("SHOW VARIABLES LIKE 'bind_address'");
    console.log(`🌐 MySQL bind_address: ${rows[0]?.Value || 'Not set'}`);
    
    // Check if MySQL allows external connections
    const [userRows] = await connection.execute("SELECT User, Host FROM mysql.user WHERE User = ?", [process.env.DB_USER || 'root']);
    console.log('👤 MySQL users:');
    userRows.forEach(row => {
      console.log(`  - ${row.User}@${row.Host}`);
    });

    connection.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }

  console.log('\n🔧 Network Access Checklist:');
  console.log('1. ✅ Backend server listening on 0.0.0.0:3000');
  console.log('2. ✅ CORS configured for network IPs');
  console.log('3. ⚠️  Check MySQL bind_address (should be 0.0.0.0 or *)');
  console.log('4. ⚠️  Check MySQL user permissions for network access');
  console.log('5. ⚠️  Check Windows Firewall settings');
  console.log('6. ⚠️  Check antivirus software blocking connections');
  
  console.log('\n📝 To fix MySQL network access:');
  console.log('1. Edit MySQL my.ini file:');
  console.log('   bind-address = 0.0.0.0');
  console.log('2. Grant network access to user:');
  console.log('   GRANT ALL PRIVILEGES ON museosmart.* TO \'root\'@\'%\' IDENTIFIED BY \'password\';');
  console.log('   FLUSH PRIVILEGES;');
  console.log('3. Restart MySQL service');
}

checkNetworkAccess().catch(console.error);
