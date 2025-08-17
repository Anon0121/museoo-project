const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

// Hash a password using bcrypt
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

async function hashExistingPasswords() {
  let connection;
  
  try {
    console.log('🔐 Starting password hashing migration...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Get all users with plain text passwords
    const [users] = await connection.execute(`
      SELECT user_ID, username, password 
      FROM system_user 
      WHERE password NOT LIKE '$2b$%' AND password NOT LIKE '$2a$%'
    `);
    
    if (users.length === 0) {
      console.log('✅ All passwords are already hashed!');
      return;
    }
    
    console.log(`📝 Found ${users.length} users with plain text passwords to hash...`);
    
    // Hash each password
    for (const user of users) {
      try {
        console.log(`  🔐 Hashing password for user: ${user.username}`);
        
        const hashedPassword = await hashPassword(user.password);
        
        await connection.execute(
          'UPDATE system_user SET password = ? WHERE user_ID = ?',
          [hashedPassword, user.user_ID]
        );
        
        console.log(`  ✅ Password hashed successfully for: ${user.username}`);
      } catch (error) {
        console.error(`  ❌ Error hashing password for ${user.username}:`, error.message);
      }
    }
    
    console.log('\n✅ Password hashing migration completed!');
    
    // Verify the migration
    const [remainingPlainText] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM system_user 
      WHERE password NOT LIKE '$2b$%' AND password NOT LIKE '$2a$%'
    `);
    
    if (remainingPlainText[0].count === 0) {
      console.log('🎉 All passwords are now properly hashed!');
    } else {
      console.log(`⚠️  ${remainingPlainText[0].count} passwords still need to be hashed.`);
    }
    
  } catch (error) {
    console.error('❌ Password hashing migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
hashExistingPasswords(); 