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

async function setupProfilePhoto() {
  let connection;
  
  try {
    console.log('🔧 Setting up profile photo functionality...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check if profile_photo column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'museosmart' 
      AND TABLE_NAME = 'system_user' 
      AND COLUMN_NAME = 'profile_photo'
    `);
    
    if (columns.length > 0) {
      console.log('✅ profile_photo column already exists');
    } else {
      console.log('📝 Adding profile_photo column...');
      
      // Add profile_photo column
      await connection.execute(`
        ALTER TABLE system_user 
        ADD COLUMN profile_photo VARCHAR(500) NULL AFTER email
      `);
      
      console.log('✅ profile_photo column added successfully');
    }
    
    // Create uploads/profiles directory
    const profilesDir = path.join(__dirname, 'uploads', 'profiles');
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
      console.log('✅ Created uploads/profiles directory');
    } else {
      console.log('✅ uploads/profiles directory already exists');
    }
    
    // Verify the setup
    const [rows] = await connection.execute('DESCRIBE system_user');
    console.log('\n📋 Updated table structure:');
    rows.forEach(row => {
      console.log(`  - ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n✅ Profile photo setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
setupProfilePhoto(); 