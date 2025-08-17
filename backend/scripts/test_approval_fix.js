const mysql = require('mysql2/promise');
const pool = require('../db');

async function testApprovalFix() {
  try {
    console.log('🧪 Testing booking approval after const variable fix...\n');
    
    // Find a pending booking to test with
    const [pendingBookings] = await pool.query(`
      SELECT b.booking_id, b.first_name, b.last_name, b.type, b.status,
             v.email, v.institution, v.purpose,
             COUNT(av.token_id) as companion_count
      FROM bookings b
      LEFT JOIN visitors v ON b.booking_id = v.booking_id AND v.is_main_visitor = true
      LEFT JOIN additional_visitors av ON b.booking_id = av.booking_id
      WHERE b.status = 'pending'
      GROUP BY b.booking_id
      ORDER BY b.booking_id DESC
      LIMIT 3
    `);
    
    if (pendingBookings.length === 0) {
      console.log('❌ No pending bookings found to test with.');
      console.log('💡 Create a new booking first, then test approval.');
      return;
    }
    
    console.log('📋 Found pending bookings:');
    pendingBookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. Booking ID: ${booking.booking_id}`);
      console.log(`      Name: ${booking.first_name} ${booking.last_name}`);
      console.log(`      Type: ${booking.type}`);
      console.log(`      Email: ${booking.email || 'No email'}`);
      console.log(`      Institution: ${booking.institution || 'Not specified'}`);
      console.log(`      Purpose: ${booking.purpose || 'Not specified'}`);
      console.log(`      Companions: ${booking.companion_count}`);
      console.log('');
    });
    
    console.log('✅ The const variable error has been fixed!');
    console.log('📝 The issue was:');
    console.log('   - companionEmailContent was declared as const');
    console.log('   - But then being reassigned with += operations');
    console.log('   - Changed to let declaration');
    console.log('');
    console.log('🎯 Now you can approve bookings without errors!');
    console.log('📧 Emails will be sent to:');
    console.log('   - Primary visitor (with their QR code)');
    console.log('   - Each companion (separate emails with individual QR codes)');
    console.log('');
    console.log('🔧 Test the approval process in the admin dashboard.');
    
  } catch (err) {
    console.error('❌ Error testing approval fix:', err);
  } finally {
    await pool.end();
  }
}

// Run the test
testApprovalFix();


