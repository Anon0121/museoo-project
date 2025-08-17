const mysql = require('mysql2/promise');
require('dotenv').config();

async function grantNetworkAccess() {
  console.log('🔧 Granting network access to MySQL user...\n');

  try {
    // Connect to MySQL
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart',
      port: process.env.DB_PORT || 3306,
    });

    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL successfully');

    // Grant network access using direct SQL
    console.log('🔧 Granting network access...');
    
    try {
      // For MariaDB/MySQL 5.7 and earlier
      await connection.execute("GRANT ALL PRIVILEGES ON museosmart.* TO 'root'@'%' IDENTIFIED BY ''");
      console.log('✅ Granted network access using IDENTIFIED BY method');
    } catch (error) {
      if (error.code === 'ER_GRANT_PLUGIN') {
        // For MySQL 8.0+ and MariaDB 10.2+
        console.log('⚠️  Using MySQL 8.0+ syntax...');
        await connection.execute("CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY ''");
        await connection.execute("GRANT ALL PRIVILEGES ON museosmart.* TO 'root'@'%'");
        console.log('✅ Created user and granted network access');
      } else {
        throw error;
      }
    }

    // Flush privileges
    await connection.execute("FLUSH PRIVILEGES");
    console.log('✅ Flushed privileges');

    // Verify the changes
    const [userResult] = await connection.execute("SELECT User, Host FROM mysql.user WHERE User = 'root'");
    console.log('\n👤 Updated MySQL users:');
    userResult.forEach(row => {
      console.log(`  - ${row.User}@${row.Host}`);
    });

    connection.release();
    await pool.end();

    console.log('\n✅ Network access setup completed!');
    console.log('\n🎉 Your MySQL is now configured for network access!');

  } catch (error) {
    console.error('❌ Error granting network access:', error.message);
    console.log('\n🔧 Manual steps required:');
    console.log('1. Connect to MySQL as root');
    console.log('2. Run: CREATE USER IF NOT EXISTS \'root\'@\'%\' IDENTIFIED BY \'\';');
    console.log('3. Run: GRANT ALL PRIVILEGES ON museosmart.* TO \'root\'@\'%\';');
    console.log('4. Run: FLUSH PRIVILEGES;');
  }
}

grantNetworkAccess().catch(console.error);
