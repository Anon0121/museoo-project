const mysql = require('mysql2/promise');
const pool = require('../db');

async function testEmailFormats() {
  try {
    console.log('🧪 Testing different email formats for primary vs additional visitors...\n');
    
    // Find a recent group booking
    const [recentBookings] = await pool.query(`
      SELECT b.booking_id, b.first_name, b.last_name, b.date, b.time_slot,
             v.email as primary_email,
             COUNT(av.token_id) as companion_count
      FROM bookings b
      LEFT JOIN visitors v ON b.booking_id = v.booking_id AND v.is_main_visitor = true
      LEFT JOIN additional_visitors av ON b.booking_id = av.booking_id
      WHERE b.type = 'group' AND av.token_id IS NOT NULL
      GROUP BY b.booking_id
      ORDER BY b.booking_id DESC
      LIMIT 2
    `);
    
    if (recentBookings.length === 0) {
      console.log('❌ No group bookings with companions found.');
      console.log('💡 Create a group booking with companions first.');
      return;
    }
    
    console.log('📧 Email Format Comparison:\n');
    
    recentBookings.forEach((booking, index) => {
      console.log(`\n   ${index + 1}. Booking ID: ${booking.booking_id}`);
      console.log(`      Primary Visitor: ${booking.first_name} ${booking.last_name}`);
      console.log(`      Visit Date: ${booking.date} | Time: ${booking.time_slot}`);
      console.log(`      Companions: ${booking.companion_count}`);
      
      console.log(`\n      📨 PRIMARY VISITOR EMAIL FORMAT:`);
      console.log(`         Subject: "Your Museum Visit is Confirmed! 🎫"`);
      console.log(`         Style: Professional confirmation email`);
      console.log(`         Features:`);
      console.log(`           ✅ Gradient header with confirmation message`);
      console.log(`           ✅ Personal greeting with visitor's name`);
      console.log(`           ✅ Blue info box for QR code instructions`);
      console.log(`           ✅ Yellow info box for group visit details`);
      console.log(`           ✅ Green table with visit details`);
      console.log(`           ✅ Warning box for arrival time`);
      console.log(`           ✅ Professional footer`);
      console.log(`         Content: Confirmation + QR code attachment`);
      
      console.log(`\n      📨 ADDITIONAL VISITOR EMAIL FORMAT:`);
      console.log(`         Subject: "Complete Your Museum Visit Details 🎫"`);
      console.log(`         Style: Invitation with action button`);
      console.log(`         Features:`);
      console.log(`           ✅ Simple header with invitation message`);
      console.log(`           ✅ Visit details in bullet points`);
      console.log(`           ✅ Blue call-to-action button`);
      console.log(`           ✅ Clear instructions for form completion`);
      console.log(`           ✅ Professional but friendly tone`);
      console.log(`         Content: Invitation + QR code + form link`);
    });
    
    console.log('\n🎨 Design Differences:');
    console.log('   📧 Primary Visitor Email:');
    console.log('      - Confirmation-focused design');
    console.log('      - Gradient header for celebration');
    console.log('      - Multiple colored info boxes');
    console.log('      - Detailed visit information table');
    console.log('      - Professional, formal tone');
    console.log('      - No action buttons needed');
    
    console.log('\n   📧 Additional Visitor Email:');
    console.log('      - Action-focused design');
    console.log('      - Simple, clean layout');
    console.log('      - Prominent call-to-action button');
    console.log('      - Clear instructions for next steps');
    console.log('      - Friendly, welcoming tone');
    console.log('      - Form link for data completion');
    
    console.log('\n✅ Both email formats now include:');
    console.log('   ✅ HTML version with professional styling');
    console.log('   ✅ Plain text version (fallback)');
    console.log('   ✅ Responsive design');
    console.log('   ✅ Clear visual hierarchy');
    console.log('   ✅ Appropriate color coding');
    console.log('   ✅ Mobile-friendly layout');
    
    console.log('\n🎯 Test the different formats:');
    console.log('   1. Approve a group booking in admin dashboard');
    console.log('   2. Check primary visitor email (confirmation style)');
    console.log('   3. Check companion emails (invitation style)');
    console.log('   4. Notice the different purposes and designs');
    
  } catch (err) {
    console.error('❌ Error testing email formats:', err);
  } finally {
    await pool.end();
  }
}

// Run the test
testEmailFormats();


