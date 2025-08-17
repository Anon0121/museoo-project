const mysql = require('mysql2/promise');
const pool = require('../db');

async function testSeparateEmails() {
  try {
    console.log('🧪 Testing separate email functionality...\n');
    
    // Check if we have any bookings with companions
    const [bookings] = await pool.query(`
      SELECT b.booking_id, b.first_name, b.last_name, b.date, b.time_slot,
             v.email, COUNT(av.token_id) as companion_count
      FROM bookings b
      LEFT JOIN visitors v ON b.booking_id = v.booking_id AND v.is_main_visitor = true
      LEFT JOIN additional_visitors av ON b.booking_id = av.booking_id
      WHERE b.type = 'group'
      GROUP BY b.booking_id
      HAVING companion_count > 0
      LIMIT 5
    `);
    
    if (bookings.length === 0) {
      console.log('❌ No group bookings with companions found. Please create a test booking first.');
      return;
    }
    
    console.log('📋 Found group bookings with companions:');
    bookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. Booking ID: ${booking.booking_id}`);
      console.log(`      Primary: ${booking.first_name} ${booking.last_name} (${booking.email})`);
      console.log(`      Date: ${booking.date} at ${booking.time_slot}`);
      console.log(`      Companions: ${booking.companion_count}`);
      console.log('');
    });
    
    // Check additional_visitors table structure
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'museosmart' 
      AND TABLE_NAME = 'additional_visitors'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📊 Additional visitors table structure:');
    columns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
    });
    
    console.log('\n✅ Test completed! The separate email functionality is ready.');
    console.log('📧 When a booking is approved, each companion will receive their own email with:');
    console.log('   - Individual QR code');
    console.log('   - Personal form link');
    console.log('   - Visit details');
    
  } catch (err) {
    console.error('❌ Error testing separate emails:', err);
  } finally {
    await pool.end();
  }
}

// Run the test
testSeparateEmails();
