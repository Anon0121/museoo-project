const mysql = require('mysql2/promise');
const pool = require('../db');

async function addLinkExpiration() {
  try {
    console.log('🔧 Adding link expiration functionality...\n');
    
    // Add link_expires_at column if it doesn't exist
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'museosmart' 
      AND TABLE_NAME = 'additional_visitors' 
      AND COLUMN_NAME = 'link_expires_at'
    `);
    
    if (columns.length === 0) {
      console.log('📝 Adding link_expires_at column to additional_visitors table...');
      
      await pool.query(`
        ALTER TABLE additional_visitors 
        ADD COLUMN link_expires_at TIMESTAMP NULL DEFAULT NULL
        AFTER details_completed_at
      `);
      
      console.log('✅ Link expiration column added successfully!');
    } else {
      console.log('✅ Link expiration column already exists!');
    }
    
    console.log('\n🎉 Link expiration functionality is ready!');
    console.log('📋 How it works:');
    console.log('   - Links are active until details are submitted');
    console.log('   - After submission, link_expires_at is set to current time');
    console.log('   - Expired links show "Link has expired" message');
    console.log('   - QR codes still work for check-in regardless of link expiration');
    
  } catch (err) {
    console.error('❌ Error adding link expiration:', err);
  } finally {
    await pool.end();
  }
}

// Run the function
addLinkExpiration();


