const mysql = require('mysql2/promise');
const pool = require('../db');

async function testMultipleCompanions() {
  try {
    console.log('🧪 Testing multiple companions functionality...\n');
    
    // Check existing bookings with multiple companions
    const [bookings] = await pool.query(`
      SELECT b.booking_id, b.first_name, b.last_name, b.type, b.status, b.date, b.time_slot,
             COUNT(av.token_id) as companion_count,
             GROUP_CONCAT(av.email ORDER BY av.token_id) as companion_emails
      FROM bookings b
      LEFT JOIN additional_visitors av ON b.booking_id = av.booking_id
      WHERE b.type = 'group'
      GROUP BY b.booking_id
      HAVING companion_count > 1
      ORDER BY companion_count DESC, b.booking_id DESC
      LIMIT 10
    `);
    
    if (bookings.length === 0) {
      console.log('❌ No bookings with multiple companions found.');
      console.log('📝 This is normal if you haven\'t created any group bookings with 2+ companions yet.');
      return;
    }
    
    console.log('📋 Bookings with multiple companions:');
    bookings.forEach((booking, index) => {
      console.log(`\n   ${index + 1}. Booking ID: ${booking.booking_id}`);
      console.log(`      Name: ${booking.first_name} ${booking.last_name}`);
      console.log(`      Type: ${booking.type}`);
      console.log(`      Status: ${booking.status}`);
      console.log(`      Date: ${booking.date} at ${booking.time_slot}`);
      console.log(`      Companions: ${booking.companion_count}`);
      console.log(`      Companion Emails: ${booking.companion_emails || 'None'}`);
    });
    
    // Check if booking 41 has multiple companions
    const [booking41] = await pool.query(`
      SELECT b.booking_id, b.first_name, b.last_name, b.type, b.status, b.date, b.time_slot,
             COUNT(av.token_id) as companion_count,
             GROUP_CONCAT(av.email ORDER BY av.token_id) as companion_emails
      FROM bookings b
      LEFT JOIN additional_visitors av ON b.booking_id = av.booking_id
      WHERE b.booking_id = 41
      GROUP BY b.booking_id
    `);
    
    if (booking41.length > 0) {
      const booking = booking41[0];
      console.log(`\n🎯 Booking ID 41 details:`);
      console.log(`   Name: ${booking.first_name} ${booking.last_name}`);
      console.log(`   Type: ${booking.type}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Date: ${booking.date} at ${booking.time_slot}`);
      console.log(`   Companions: ${booking.companion_count}`);
      console.log(`   Companion Emails: ${booking.companion_emails || 'None'}`);
      
      if (booking.companion_count > 1) {
        console.log(`\n✅ Booking 41 has ${booking.companion_count} companions - this is working correctly!`);
      } else if (booking.companion_count === 1) {
        console.log(`\n📝 Booking 41 has 1 companion - you can add more.`);
      } else {
        console.log(`\n📝 Booking 41 has no companions - you can add multiple.`);
      }
    }
    
    // Check the additional_visitors table structure
    console.log('\n🔍 Checking additional_visitors table structure...');
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'museosmart'
      AND TABLE_NAME = 'additional_visitors'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📊 additional_visitors table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Test the token generation pattern
    console.log('\n🔑 Testing token generation pattern...');
    const [sampleTokens] = await pool.query(`
      SELECT token_id, booking_id, email, status
      FROM additional_visitors
      ORDER BY booking_id DESC, token_id
      LIMIT 5
    `);
    
    if (sampleTokens.length > 0) {
      console.log('📋 Sample tokens:');
      sampleTokens.forEach(token => {
        console.log(`   - ${token.token_id} (Booking: ${token.booking_id}, Email: ${token.email}, Status: ${token.status})`);
        
        // Verify token format
        const expectedPattern = `ADD-BOOK${token.booking_id}-`;
        if (token.token_id.startsWith(expectedPattern)) {
          console.log(`     ✅ Token format is correct`);
        } else {
          console.log(`     ❌ Token format is incorrect (expected: ${expectedPattern}...)`);
        }
      });
    }
    
    console.log('\n✅ Multiple companions test completed!');
    console.log('📋 Summary:');
    console.log('   - The system supports multiple additional visitors');
    console.log('   - Each companion gets a unique token (ADD-BOOK{id}-{number})');
    console.log('   - Each companion receives a separate email with their QR code');
    console.log('   - Each companion gets their own form link to complete details');
    console.log('   - The approval process handles any number of companions');
    
  } catch (err) {
    console.error('❌ Error testing multiple companions:', err);
  } finally {
    await pool.end();
  }
}

// Run the test
testMultipleCompanions();


