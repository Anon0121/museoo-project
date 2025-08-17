const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function testAdminLogin() {
  let connection;
  
  try {
    console.log('🔍 Testing admin login...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check admin user
    const [adminUsers] = await connection.execute(`
      SELECT user_ID, username, firstname, lastname, email, role, status, 
             CASE 
               WHEN password LIKE '$2b$%' THEN 'HASHED'
               ELSE 'PLAIN_TEXT'
             END as password_type,
             LENGTH(password) as password_length
      FROM system_user WHERE username = 'admin'
    `);
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin user found!');
      return;
    }
    
    const admin = adminUsers[0];
    console.log('\n👤 Admin user details:');
    console.log(`  - Username: ${admin.username}`);
    console.log(`  - First Name: ${admin.firstname}`);
    console.log(`  - Last Name: ${admin.lastname}`);
    console.log(`  - Email: ${admin.email}`);
    console.log(`  - Role: ${admin.role} (type: ${typeof admin.role})`);
    console.log(`  - Status: ${admin.status}`);
    console.log(`  - Password: ${admin.password_type}`);
    console.log(`  - Password Length: ${admin.password_length}`);
    
    // Test password verification
    console.log('\n🔐 Testing password verification...');
    
    const testPassword = 'admin123';
    let isPasswordValid = false;
    
    if (!admin.password) {
      console.log('  ❌ Password field is NULL or empty');
    } else if (admin.password_type === 'HASHED') {
      try {
        isPasswordValid = await bcrypt.compare(testPassword, admin.password);
        console.log(`  - Testing '${testPassword}' against hashed password: ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);
      } catch (error) {
        console.log(`  ❌ Error comparing password: ${error.message}`);
      }
    } else {
      isPasswordValid = (admin.password === testPassword);
      console.log(`  - Testing '${testPassword}' against plain text password: ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);
    }
    
    // Check if role is correct
    console.log('\n🎭 Role check:');
    if (admin.role === 'admin') {
      console.log('  ✅ Role is correctly set to "admin"');
    } else if (admin.role === 1) {
      console.log('  ⚠️  Role is still number (1), should be string ("admin")');
    } else {
      console.log(`  ❌ Role is "${admin.role}", should be "admin"`);
    }
    
    // Summary
    console.log('\n📋 Summary:');
    if (isPasswordValid && admin.role === 'admin' && admin.status === 'active') {
      console.log('  ✅ Admin login should work!');
    } else {
      console.log('  ❌ Admin login will fail. Issues:');
      if (!isPasswordValid) console.log('    - Password verification failed');
      if (admin.role !== 'admin') console.log('    - Role is not "admin"');
      if (admin.status !== 'active') console.log('    - Status is not "active"');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testAdminLogin(); 