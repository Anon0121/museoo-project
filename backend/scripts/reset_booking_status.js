const mysql = require('mysql2/promise');
const pool = require('../db');

async function resetBookingStatus() {
  const bookingId = 41; // Change this to the booking ID you want to reset
  
  try {
    console.log(`🔄 Resetting booking ${bookingId} status to pending...\n`);
    
    // Check current status
    const [currentBooking] = await pool.query(
      `SELECT booking_id, first_name, last_name, status FROM bookings WHERE booking_id = ?`,
      [bookingId]
    );
    
    if (currentBooking.length === 0) {
      console.log(`❌ Booking ${bookingId} not found.`);
      return;
    }
    
    const booking = currentBooking[0];
    console.log(`📋 Current status: ${booking.status}`);
    console.log(`👤 Booking: ${booking.first_name} ${booking.last_name}`);
    
    if (booking.status === 'pending') {
      console.log(`✅ Booking ${bookingId} is already pending.`);
      return;
    }
    
    // Reset to pending
    await pool.query(
      `UPDATE bookings SET status = 'pending' WHERE booking_id = ?`,
      [bookingId]
    );
    
    // Reset visitor status
    await pool.query(
      `UPDATE visitors SET status = 'pending' WHERE booking_id = ?`,
      [bookingId]
    );
    
    // Reset additional visitors status
    await pool.query(
      `UPDATE additional_visitors SET status = 'pending', link_expires_at = NULL WHERE booking_id = ?`,
      [bookingId]
    );
    
    console.log(`✅ Booking ${bookingId} has been reset to pending status.`);
    console.log(`📝 You can now approve it again.`);
    
  } catch (err) {
    console.error('❌ Error resetting booking status:', err);
  } finally {
    await pool.end();
  }
}

// Run the function
resetBookingStatus();


