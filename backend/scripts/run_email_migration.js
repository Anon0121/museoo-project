const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🔧 Starting email column migration...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check if email column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'museosmart' 
      AND TABLE_NAME = 'system_user' 
      AND COLUMN_NAME = 'email'
    `);
    
    if (columns.length > 0) {
      console.log('✅ Email column already exists in system_user table');
    } else {
      console.log('📝 Adding email column to system_user table...');
      
      // Add email column
      await connection.execute(`
        ALTER TABLE system_user 
        ADD COLUMN email VARCHAR(100) UNIQUE NOT NULL DEFAULT 'admin@museum.com' AFTER lastname
      `);
      
      console.log('✅ Email column added successfully');
    }
    
    // Update existing admin user with proper email if needed
    const [adminUsers] = await connection.execute(`
      SELECT user_ID, email FROM system_user WHERE username = 'admin'
    `);
    
    if (adminUsers.length > 0 && adminUsers[0].email === 'admin@museum.com') {
      console.log('📝 Updating admin user email...');
      await connection.execute(`
        UPDATE system_user 
        SET email = 'admin@museum.com' 
        WHERE username = 'admin'
      `);
      console.log('✅ Admin user email updated');
    }
    
    // Verify the migration
    const [rows] = await connection.execute('DESCRIBE system_user');
    console.log('\n📋 Updated table structure:');
    rows.forEach(row => {
      console.log(`  - ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n✅ Email column migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
runMigration(); 