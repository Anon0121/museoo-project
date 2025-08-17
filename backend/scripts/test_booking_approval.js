const mysql = require('mysql2/promise');
const pool = require('../db');

async function testBookingApproval() {
  try {
    console.log('🧪 Testing booking approval functionality...\n');
    
    // Check if we have any pending bookings
    const [bookings] = await pool.query(`
      SELECT b.booking_id, b.first_name, b.last_name, b.type, b.status, b.date, b.time_slot,
             v.email, COUNT(av.token_id) as companion_count
      FROM bookings b
      LEFT JOIN visitors v ON b.booking_id = v.booking_id AND v.is_main_visitor = true
      LEFT JOIN additional_visitors av ON b.booking_id = av.booking_id
      WHERE b.status = 'pending'
      GROUP BY b.booking_id
      ORDER BY b.booking_id DESC
      LIMIT 5
    `);
    
    if (bookings.length === 0) {
      console.log('❌ No pending bookings found.');
      return;
    }
    
    console.log('📋 Found pending bookings:');
    bookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. Booking ID: ${booking.booking_id}`);
      console.log(`      Name: ${booking.first_name} ${booking.last_name}`);
      console.log(`      Email: ${booking.email || 'No email'}`);
      console.log(`      Type: ${booking.type}`);
      console.log(`      Date: ${booking.date} at ${booking.time_slot}`);
      console.log(`      Companions: ${booking.companion_count}`);
      console.log(`      Status: ${booking.status}`);
      console.log('');
    });
    
    // Check if the booking with ID 41 exists
    const [booking41] = await pool.query(`
      SELECT b.booking_id, b.first_name, b.last_name, b.type, b.status, b.date, b.time_slot,
             v.email, COUNT(av.token_id) as companion_count
      FROM bookings b
      LEFT JOIN visitors v ON b.booking_id = v.booking_id AND v.is_main_visitor = true
      LEFT JOIN additional_visitors av ON b.booking_id = av.booking_id
      WHERE b.booking_id = 41
      GROUP BY b.booking_id
    `);
    
    if (booking41.length > 0) {
      const booking = booking41[0];
      console.log('🎯 Booking ID 41 details:');
      console.log(`   Name: ${booking.first_name} ${booking.last_name}`);
      console.log(`   Email: ${booking.email || 'No email'}`);
      console.log(`   Type: ${booking.type}`);
      console.log(`   Date: ${booking.date} at ${booking.time_slot}`);
      console.log(`   Companions: ${booking.companion_count}`);
      console.log(`   Status: ${booking.status}`);
      
      if (!booking.email) {
        console.log('\n⚠️  WARNING: Booking 41 has no email address!');
        console.log('   This will cause the approval to fail when trying to send emails.');
      }
    } else {
      console.log('❌ Booking ID 41 not found.');
    }
    
    console.log('\n✅ Test completed!');
    console.log('📋 To fix approval issues:');
    console.log('   1. Make sure the booking has a valid email address');
    console.log('   2. Check that the visitor record exists');
    console.log('   3. Verify email credentials are correct');
    
  } catch (err) {
    console.error('❌ Error testing booking approval:', err);
  } finally {
    await pool.end();
  }
}

// Run the test
testBookingApproval();


