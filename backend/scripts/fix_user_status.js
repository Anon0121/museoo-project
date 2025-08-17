const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function fixUserStatus() {
  let connection;
  
  try {
    console.log('🔧 Fixing user status...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // First, let's see what the current status values are
    console.log('\n📋 Checking current status values...');
    const [statusCheck] = await connection.execute(`
      SELECT DISTINCT status FROM system_user
    `);
    console.log('Current status values:', statusCheck.map(s => s.status));
    
    // Check the table structure
    console.log('\n📋 Checking table structure...');
    const [columns] = await connection.execute(`
      DESCRIBE system_user
    `);
    const statusColumn = columns.find(col => col.Field === 'status');
    console.log('Status column:', statusColumn);
    
    // Show all users before fix
    console.log('\n📋 Users BEFORE fix:');
    const [usersBefore] = await connection.execute(`
      SELECT user_ID, username, firstname, lastname, role, status
      FROM system_user
      ORDER BY user_ID
    `);
    
    usersBefore.forEach(user => {
      const statusIcon = user.status === 'active' ? '✅' : '❌';
      console.log(`${statusIcon} ${user.username} | ${user.firstname} ${user.lastname} | ${user.role} | Status: "${user.status}"`);
    });
    
    // Fix 1: Update all users to 'active' status
    console.log('\n🔧 Fix 1: Setting all users to active status...');
    await connection.execute(`
      UPDATE system_user 
      SET status = 'active' 
      WHERE status != 'active' OR status IS NULL
    `);
    
    // Fix 2: Ensure the status column has the correct ENUM values
    console.log('\n🔧 Fix 2: Checking and fixing status column ENUM...');
    try {
      await connection.execute(`
        ALTER TABLE system_user 
        MODIFY COLUMN status ENUM('active', 'inactive') DEFAULT 'active'
      `);
      console.log('✅ Status column ENUM updated');
    } catch (err) {
      console.log('Status column ENUM already correct or error:', err.message);
    }
    
    // Fix 3: Double-check admin user specifically
    console.log('\n🔧 Fix 3: Ensuring admin user is active...');
    await connection.execute(`
      UPDATE system_user 
      SET status = 'active', role = 'admin'
      WHERE username = 'admin'
    `);
    
    // Show all users after fix
    console.log('\n📋 Users AFTER fix:');
    const [usersAfter] = await connection.execute(`
      SELECT user_ID, username, firstname, lastname, role, status
      FROM system_user
      ORDER BY user_ID
    `);
    
    usersAfter.forEach(user => {
      const statusIcon = user.status === 'active' ? '✅' : '❌';
      console.log(`${statusIcon} ${user.username} | ${user.firstname} ${user.lastname} | ${user.role} | Status: "${user.status}"`);
    });
    
    // Verify the fix worked
    const adminUser = usersAfter.find(u => u.username === 'admin');
    if (adminUser && adminUser.status === 'active') {
      console.log('\n✅ SUCCESS: Admin user is now active!');
    } else {
      console.log('\n❌ FAILED: Admin user still not active');
      console.log('Admin user data:', adminUser);
    }
    
    console.log('\n🔄 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Clear your browser cache');
    console.log('3. Log out and log back in');
    console.log('4. Check the Settings page again');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the fix
fixUserStatus(); 