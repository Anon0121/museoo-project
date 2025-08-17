const mysql = require('mysql2/promise');
const pool = require('../db');

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Fixing database schema...\n');
    
    // Check if nationality column exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'museosmart' 
      AND TABLE_NAME = 'visitors' 
      AND COLUMN_NAME = 'nationality'
    `);
    
    if (columns.length === 0) {
      console.log('📝 Adding nationality column to visitors table...');
      
      // Add nationality column
      await pool.query(`
        ALTER TABLE visitors 
        ADD COLUMN nationality VARCHAR(50) NOT NULL DEFAULT 'local' 
        AFTER email
      `);
      
      console.log('✅ Nationality column added successfully!');
    } else {
      console.log('✅ Nationality column already exists!');
    }
    
    // Check if additional_visitors table exists
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'museosmart' 
      AND TABLE_NAME = 'additional_visitors'
    `);
    
    if (tables.length === 0) {
      console.log('📝 Creating additional_visitors table...');
      
      // Create additional_visitors table
      await pool.query(`
        CREATE TABLE additional_visitors (
          token_id VARCHAR(50) PRIMARY KEY,
          booking_id INT NOT NULL,
          email VARCHAR(100) NOT NULL,
          status ENUM('pending', 'completed', 'checked-in') DEFAULT 'pending',
          details JSON DEFAULT NULL,
          qr_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          details_completed_at TIMESTAMP NULL,
          checkin_time TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
        )
      `);
      
      // Add indexes
      await pool.query('CREATE INDEX idx_additional_visitors_token ON additional_visitors(token_id)');
      await pool.query('CREATE INDEX idx_additional_visitors_booking ON additional_visitors(booking_id)');
      await pool.query('CREATE INDEX idx_additional_visitors_email ON additional_visitors(email)');
      
      console.log('✅ Additional visitors table created successfully!');
    } else {
      console.log('✅ Additional visitors table already exists!');
    }
    
    console.log('\n🎉 Database schema fix completed!');
    
  } catch (err) {
    console.error('❌ Error fixing database schema:', err);
  } finally {
    await pool.end();
  }
}

// Run the function
fixDatabaseSchema();


