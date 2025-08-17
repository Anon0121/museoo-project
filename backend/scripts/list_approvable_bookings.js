const mysql = require('mysql2/promise');
const pool = require('../db');

async function listApprovableBookings() {
  try {
    console.log('📋 Listing all bookings that can be approved...\n');
    
    // Get all bookings with their status
    const [bookings] = await pool.query(`
      SELECT b.booking_id, b.first_name, b.last_name, b.type, b.status, b.date, b.time_slot,
             v.email, COUNT(av.token_id) as companion_count
      FROM bookings b
      LEFT JOIN visitors v ON b.booking_id = v.booking_id AND v.is_main_visitor = true
      LEFT JOIN additional_visitors av ON b.booking_id = av.booking_id
      GROUP BY b.booking_id
      ORDER BY b.booking_id DESC
      LIMIT 20
    `);
    
    if (bookings.length === 0) {
      console.log('❌ No bookings found in the database.');
      return;
    }
    
    console.log('📊 All bookings:');
    console.log('ID  | Name                | Type      | Status    | Date       | Time        | Email                    | Companions');
    console.log('----|---------------------|-----------|-----------|------------|-------------|--------------------------|-----------');
    
    bookings.forEach((booking) => {
      const id = booking.booking_id.toString().padStart(2);
      const name = `${booking.first_name} ${booking.last_name}`.padEnd(19);
      const type = booking.type.padEnd(9);
      const status = booking.status.padEnd(9);
      const date = new Date(booking.date).toLocaleDateString().padEnd(10);
      const time = booking.time_slot.padEnd(11);
      const email = (booking.email || 'No email').padEnd(24);
      const companions = booking.companion_count;
      
      console.log(`${id}  | ${name} | ${type} | ${status} | ${date} | ${time} | ${email} | ${companions}`);
    });
    
    // Show pending bookings specifically
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    
    console.log(`\n✅ Pending bookings (${pendingBookings.length}):`);
    if (pendingBookings.length > 0) {
      pendingBookings.forEach((booking) => {
        console.log(`   📝 Booking ID: ${booking.booking_id} - ${booking.first_name} ${booking.last_name} (${booking.email || 'No email'})`);
      });
    } else {
      console.log('   No pending bookings found.');
    }
    
    // Show approved bookings
    const approvedBookings = bookings.filter(b => b.status === 'approved');
    console.log(`\n✅ Approved bookings (${approvedBookings.length}):`);
    if (approvedBookings.length > 0) {
      approvedBookings.forEach((booking) => {
        console.log(`   ✅ Booking ID: ${booking.booking_id} - ${booking.first_name} ${booking.last_name}`);
      });
    }
    
    console.log('\n💡 To approve a booking:');
    console.log('   1. Look for bookings with "pending" status');
    console.log('   2. Make sure they have a valid email address');
    console.log('   3. Use the "Approve" button in the admin dashboard');
    
  } catch (err) {
    console.error('❌ Error listing bookings:', err);
  } finally {
    await pool.end();
  }
}

// Run the function
listApprovableBookings();


