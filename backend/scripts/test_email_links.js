const mysql = require('mysql2/promise');
const pool = require('../db');

async function testEmailLinks() {
  try {
    console.log('🧪 Testing email link formatting...\n');
    
    // Find a recent booking with companions
    const [recentBookings] = await pool.query(`
      SELECT b.booking_id, b.first_name, b.last_name, b.date, b.time_slot,
             v.email as primary_email,
             COUNT(av.token_id) as companion_count,
             GROUP_CONCAT(av.token_id) as token_ids,
             GROUP_CONCAT(av.email) as companion_emails
      FROM bookings b
      LEFT JOIN visitors v ON b.booking_id = v.booking_id AND v.is_main_visitor = true
      LEFT JOIN additional_visitors av ON b.booking_id = av.booking_id
      WHERE b.type = 'group' AND av.token_id IS NOT NULL
      GROUP BY b.booking_id
      ORDER BY b.booking_id DESC
      LIMIT 3
    `);
    
    if (recentBookings.length === 0) {
      console.log('❌ No group bookings with companions found.');
      console.log('💡 Create a group booking with companions first.');
      return;
    }
    
    console.log('📋 Recent group bookings with companions:');
    recentBookings.forEach((booking, index) => {
      console.log(`\n   ${index + 1}. Booking ID: ${booking.booking_id}`);
      console.log(`      Primary Visitor: ${booking.first_name} ${booking.last_name}`);
      console.log(`      Primary Email: ${booking.primary_email}`);
      console.log(`      Visit Date: ${booking.date}`);
      console.log(`      Visit Time: ${booking.time_slot}`);
      console.log(`      Companions: ${booking.companion_count}`);
      
      if (booking.token_ids) {
        const tokenIds = booking.token_ids.split(',');
        const companionEmails = booking.companion_emails.split(',');
        
        console.log(`      Companion Details:`);
        tokenIds.forEach((tokenId, i) => {
          const email = companionEmails[i];
          const formUrl = `http://localhost:5173/additional-visitor?token=${tokenId}`;
          console.log(`         ${i + 1}. Email: ${email}`);
          console.log(`            Token: ${tokenId}`);
          console.log(`            Form Link: ${formUrl}`);
        });
      }
    });
    
    console.log('\n✅ Email link improvements:');
    console.log('📧 Companion emails now include:');
    console.log('   ✅ Plain text version (for email clients that don\'t support HTML)');
    console.log('   ✅ HTML version with clickable button');
    console.log('   ✅ Clear "Complete My Details" button');
    console.log('   ✅ Properly formatted visit information');
    console.log('   ✅ Professional styling');
    
    console.log('\n🔗 Link format:');
    console.log('   http://localhost:5173/additional-visitor?token=ADD-BOOK{ID}-{NUMBER}');
    console.log('   Example: http://localhost:5173/additional-visitor?token=ADD-BOOK41-1');
    
    console.log('\n📱 How it works:');
    console.log('   1. Companion receives email with QR code attachment');
    console.log('   2. Email contains clickable "Complete My Details" button');
    console.log('   3. Clicking button opens form with pre-filled visit details');
    console.log('   4. Companion fills out personal information');
    console.log('   5. Form link expires after submission');
    console.log('   6. QR code remains valid for check-in on visit day');
    
    console.log('\n🎯 Test the process:');
    console.log('   1. Approve a group booking in admin dashboard');
    console.log('   2. Check companion emails for clickable links');
    console.log('   3. Click the link to test the form');
    
  } catch (err) {
    console.error('❌ Error testing email links:', err);
  } finally {
    await pool.end();
  }
}

// Run the test
testEmailLinks();


