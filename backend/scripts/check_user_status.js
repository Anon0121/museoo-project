const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function checkUserStatus() {
  let connection;
  
  try {
    console.log('🔍 Checking user status...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check all users and their status
    const [users] = await connection.execute(`
      SELECT user_ID, username, firstname, lastname, email, role, status, profile_photo
      FROM system_user
      ORDER BY user_ID
    `);
    
    console.log('\n📋 Current Users:');
    console.log('─'.repeat(80));
    users.forEach(user => {
      const statusIcon = user.status === 'active' ? '✅' : '❌';
      console.log(`${statusIcon} ID: ${user.user_ID} | Username: ${user.username} | Name: ${user.firstname} ${user.lastname} | Role: ${user.role} | Status: ${user.status}`);
    });
    
    // Check if admin user exists and is active
    const adminUser = users.find(u => u.username === 'admin');
    
    if (!adminUser) {
      console.log('\n❌ Admin user not found!');
      return;
    }
    
    if (adminUser.status !== 'active') {
      console.log(`\n⚠️  Admin user status is '${adminUser.status}', fixing to 'active'...`);
      
      await connection.execute(`
        UPDATE system_user 
        SET status = 'active' 
        WHERE username = 'admin'
      `);
      
      console.log('✅ Admin user status updated to active');
    } else {
      console.log('\n✅ Admin user is already active');
    }
    
    // Check for any other inactive users
    const inactiveUsers = users.filter(u => u.status !== 'active');
    if (inactiveUsers.length > 0) {
      console.log(`\n⚠️  Found ${inactiveUsers.length} inactive user(s):`);
      inactiveUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.firstname} ${user.lastname})`);
      });
      
      const fixAll = inactiveUsers.length > 1;
      if (fixAll) {
        console.log('\n🔧 Fixing all inactive users to active...');
        await connection.execute(`
          UPDATE system_user 
          SET status = 'active' 
          WHERE status != 'active'
        `);
        console.log('✅ All users activated');
      }
    }
    
    // Show final status
    const [finalUsers] = await connection.execute(`
      SELECT username, firstname, lastname, role, status
      FROM system_user
      ORDER BY user_ID
    `);
    
    console.log('\n📋 Final User Status:');
    console.log('─'.repeat(80));
    finalUsers.forEach(user => {
      const statusIcon = user.status === 'active' ? '✅' : '❌';
      console.log(`${statusIcon} ${user.username} | ${user.firstname} ${user.lastname} | ${user.role} | ${user.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check
checkUserStatus(); 