const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function debugLogin() {
  let connection;
  
  try {
    console.log('🔍 Debugging login process...');
    
    // Step 1: Connect to database
    console.log('\n1️⃣ Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');
    
    // Step 2: Check if admin user exists
    console.log('\n2️⃣ Checking admin user...');
    const [adminUsers] = await connection.execute(`
      SELECT user_ID, username, firstname, lastname, email, role, status, password
      FROM system_user WHERE username = 'admin'
    `);
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin user found!');
      return;
    }
    
    const admin = adminUsers[0];
    console.log('✅ Admin user found:');
    console.log(`  - Username: ${admin.username}`);
    console.log(`  - Role: ${admin.role} (type: ${typeof admin.role})`);
    console.log(`  - Status: ${admin.status}`);
    console.log(`  - Password length: ${admin.password ? admin.password.length : 'NULL'}`);
    console.log(`  - Password starts with: ${admin.password ? admin.password.substring(0, 10) + '...' : 'NULL'}`);
    
    // Step 3: Test password verification
    console.log('\n3️⃣ Testing password verification...');
    const testPassword = 'admin123';
    
    if (!admin.password) {
      console.log('❌ Password is NULL or empty');
      return;
    }
    
    try {
      const isPasswordValid = await bcrypt.compare(testPassword, admin.password);
      console.log(`✅ Password verification result: ${isPasswordValid ? 'VALID' : 'INVALID'}`);
      
      if (!isPasswordValid) {
        console.log('❌ Password is incorrect');
        return;
      }
    } catch (error) {
      console.log('❌ Error during password verification:', error.message);
      return;
    }
    
    // Step 4: Check role value
    console.log('\n4️⃣ Checking role value...');
    if (admin.role === 'admin') {
      console.log('✅ Role is correctly set to "admin"');
    } else {
      console.log(`❌ Role is "${admin.role}", should be "admin"`);
      return;
    }
    
    // Step 5: Check status
    console.log('\n5️⃣ Checking status...');
    if (admin.status === 'active') {
      console.log('✅ Status is "active"');
    } else {
      console.log(`❌ Status is "${admin.status}", should be "active"`);
      return;
    }
    
    // Step 6: Simulate login process
    console.log('\n6️⃣ Simulating login process...');
    console.log('✅ All checks passed! Login should work.');
    console.log('\n📋 Expected session data:');
    console.log(`  - id: ${admin.user_ID}`);
    console.log(`  - username: ${admin.username}`);
    console.log(`  - firstname: ${admin.firstname}`);
    console.log(`  - lastname: ${admin.lastname}`);
    console.log(`  - role: ${admin.role}`);
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the debug
debugLogin(); 