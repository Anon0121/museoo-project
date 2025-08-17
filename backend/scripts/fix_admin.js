const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function fixAdmin() {
  let connection;
  
  try {
    console.log('🔧 Fixing admin user...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');
    
    // Generate proper hash for 'admin123'
    console.log('🔐 Generating password hash...');
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Password hashed');
    
    // Update admin user
    console.log('📝 Updating admin user...');
    const [result] = await connection.execute(`
      UPDATE system_user 
      SET password = ?, role = 'admin', email = 'admin@museum.com', status = 'active'
      WHERE username = 'admin'
    `, [hashedPassword]);
    
    if (result.affectedRows === 0) {
      console.log('❌ Admin user not found, creating new one...');
      
      // Create new admin user
      await connection.execute(`
        INSERT INTO system_user (username, firstname, lastname, email, password, role, status) 
        VALUES ('admin', 'Admin', 'User', 'admin@museum.com', ?, 'admin', 'active')
      `, [hashedPassword]);
      
      console.log('✅ New admin user created');
    } else {
      console.log('✅ Admin user updated');
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying admin user...');
    const [adminUsers] = await connection.execute(`
      SELECT username, role, status, 
             CASE 
               WHEN password LIKE '$2b$%' THEN 'HASHED'
               ELSE 'NOT_HASHED'
             END as password_type
      FROM system_user WHERE username = 'admin'
    `);
    
    if (adminUsers.length > 0) {
      const admin = adminUsers[0];
      console.log('✅ Admin user verified:');
      console.log(`  - Username: ${admin.username}`);
      console.log(`  - Role: ${admin.role}`);
      console.log(`  - Status: ${admin.status}`);
      console.log(`  - Password: ${admin.password_type}`);
      
      // Test password
      const testPassword = 'admin123';
      const isPasswordValid = await bcrypt.compare(testPassword, hashedPassword);
      console.log(`  - Password test: ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (isPasswordValid && admin.role === 'admin' && admin.status === 'active') {
        console.log('\n🎉 Admin user is ready for login!');
        console.log('📋 Login credentials:');
        console.log('  - Username: admin');
        console.log('  - Password: admin123');
      } else {
        console.log('\n❌ Admin user still has issues');
      }
    } else {
      console.log('❌ Admin user not found after fix');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the fix
fixAdmin(); 