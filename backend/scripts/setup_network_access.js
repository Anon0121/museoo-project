const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupNetworkAccess() {
  console.log('🔧 Setting up MySQL network access...\n');

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

    // Check current bind_address
    const [bindResult] = await connection.execute("SHOW VARIABLES LIKE 'bind_address'");
    console.log(`🌐 Current bind_address: ${bindResult[0]?.Value || 'Not set (defaults to localhost)'}`);

    // Check current users
    const [userResult] = await connection.execute("SELECT User, Host FROM mysql.user WHERE User = ?", [process.env.DB_USER || 'root']);
    console.log('👤 Current MySQL users:');
    userResult.forEach(row => {
      console.log(`  - ${row.User}@${row.Host}`);
    });

    // Grant network access
    console.log('\n🔧 Granting network access...');
    
    try {
      // Grant access from any IP address
      await connection.execute("GRANT ALL PRIVILEGES ON museosmart.* TO ?@'%' IDENTIFIED BY ?", 
        [process.env.DB_USER || 'root', process.env.DB_PASSWORD || '']);
      console.log('✅ Granted network access to database');
    } catch (error) {
      if (error.code === 'ER_GRANT_PLUGIN') {
        // MySQL 8.0+ uses different syntax
        console.log('⚠️  MySQL 8.0+ detected, using alternative method...');
        await connection.execute("CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?", 
          [process.env.DB_USER || 'root', process.env.DB_PASSWORD || '']);
        await connection.execute("GRANT ALL PRIVILEGES ON museosmart.* TO ?@'%'", 
          [process.env.DB_USER || 'root']);
        console.log('✅ Created user and granted network access');
      } else {
        throw error;
      }
    }

    // Flush privileges
    await connection.execute("FLUSH PRIVILEGES");
    console.log('✅ Flushed privileges');

    // Verify the changes
    const [newUserResult] = await connection.execute("SELECT User, Host FROM mysql.user WHERE User = ?", [process.env.DB_USER || 'root']);
    console.log('\n👤 Updated MySQL users:');
    newUserResult.forEach(row => {
      console.log(`  - ${row.User}@${row.Host}`);
    });

    connection.release();
    await pool.end();

    console.log('\n✅ Network access setup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Edit MySQL my.ini file to set bind-address = 0.0.0.0');
    console.log('2. Restart MySQL service');
    console.log('3. Test network access');

  } catch (error) {
    console.error('❌ Error setting up network access:', error.message);
    console.log('\n🔧 Manual steps required:');
    console.log('1. Connect to MySQL as root');
    console.log('2. Run: GRANT ALL PRIVILEGES ON museosmart.* TO \'root\'@\'%\' IDENTIFIED BY \'your_password\';');
    console.log('3. Run: FLUSH PRIVILEGES;');
    console.log('4. Edit my.ini: bind-address = 0.0.0.0');
    console.log('5. Restart MySQL service');
  }
}

setupNetworkAccess().catch(console.error);
