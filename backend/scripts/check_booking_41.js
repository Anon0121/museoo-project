const mysql = require('mysql2/promise');
const pool = require('../db');

async function checkBooking41() {
  try {
    console.log('🔍 Checking booking ID 41...\n');
    
    // Check if booking 41 exists
    const [bookings] = await pool.query(`
      SELECT * FROM bookings WHERE booking_id = 41
    `);
    
    if (bookings.length === 0) {
      console.log('❌ Booking ID 41 does not exist in the database.');
      return;
    }
    
    const booking = bookings[0];
    console.log('✅ Booking ID 41 found:');
    console.log(`   Name: ${booking.first_name} ${booking.last_name}`);
    console.log(`   Type: ${booking.type}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Date: ${booking.date}`);
    console.log(`   Time: ${booking.time_slot}`);
    console.log(`   Total Visitors: ${booking.total_visitors}`);
    console.log(`   Created: ${booking.created_at}`);
    
    // Check if there's a visitor record
    const [visitors] = await pool.query(`
      SELECT * FROM visitors WHERE booking_id = 41
    `);
    
    console.log(`\n👥 Visitors for booking 41: ${visitors.length}`);
    visitors.forEach((visitor, index) => {
      console.log(`   ${index + 1}. ${visitor.first_name} ${visitor.last_name}`);
      console.log(`      Email: ${visitor.email}`);
      console.log(`      Is Main: ${visitor.is_main_visitor ? 'Yes' : 'No'}`);
      console.log(`      Status: ${visitor.status}`);
    });
    
    // Check if there are additional visitors
    const [additionalVisitors] = await pool.query(`
      SELECT * FROM additional_visitors WHERE booking_id = 41
    `);
    
    console.log(`\n🎫 Additional visitors for booking 41: ${additionalVisitors.length}`);
    additionalVisitors.forEach((av, index) => {
      console.log(`   ${index + 1}. Token: ${av.token_id}`);
      console.log(`      Email: ${av.email}`);
      console.log(`      Status: ${av.status}`);
    });
    
    // Check if booking can be approved
    if (booking.status === 'pending') {
      console.log('\n✅ Booking 41 can be approved (status is pending)');
      
      if (visitors.length === 0) {
        console.log('⚠️  WARNING: No visitor records found! This will cause approval to fail.');
      } else {
        const mainVisitor = visitors.find(v => v.is_main_visitor);
        if (!mainVisitor) {
          console.log('⚠️  WARNING: No main visitor found! This will cause approval to fail.');
        } else if (!mainVisitor.email) {
          console.log('⚠️  WARNING: Main visitor has no email! This will cause approval to fail.');
        } else {
          console.log('✅ Booking 41 should be able to be approved successfully.');
        }
      }
    } else {
      console.log(`\n❌ Booking 41 cannot be approved (status is ${booking.status})`);
    }
    
  } catch (err) {
    console.error('❌ Error checking booking 41:', err);
  } finally {
    await pool.end();
  }
}

// Run the check
checkBooking41();


