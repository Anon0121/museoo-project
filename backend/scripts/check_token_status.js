const mysql = require('mysql2/promise');
const pool = require('../db');

async function checkTokenStatus() {
  try {
    console.log('🔍 Checking detailed status of ADD-BOOK47-1...\n');
    
    // Get detailed information about the token
    const [tokenRows] = await pool.query(
      `SELECT 
        av.*,
        b.date as visit_date,
        b.time_slot,
        b.status as booking_status,
        b.created_at as booking_created,
        b.checkin_time as booking_checkin
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       WHERE av.token_id = ?`,
      ['ADD-BOOK47-1']
    );
    
    if (tokenRows.length === 0) {
      console.log('❌ Token not found!');
      return;
    }
    
    const tokenInfo = tokenRows[0];
    console.log('📋 Token Details:');
    console.log(`   Token ID: ${tokenInfo.token_id}`);
    console.log(`   Email: ${tokenInfo.email}`);
    console.log(`   Status: ${tokenInfo.status}`);
    console.log(`   Created: ${tokenInfo.created_at}`);
    console.log(`   Check-in Time: ${tokenInfo.checkin_time || 'Not set'}`);
    console.log(`   Booking Status: ${tokenInfo.booking_status}`);
    console.log(`   Visit Date: ${tokenInfo.visit_date}`);
    console.log(`   Time Slot: ${tokenInfo.time_slot}`);
    
    if (tokenInfo.details) {
      console.log('\n📝 Stored Details:');
      try {
        const details = JSON.parse(tokenInfo.details);
        console.log(`   First Name: ${details.firstName || 'N/A'}`);
        console.log(`   Last Name: ${details.lastName || 'N/A'}`);
        console.log(`   Gender: ${details.gender || 'N/A'}`);
        console.log(`   Nationality: ${details.nationality || 'N/A'}`);
        console.log(`   Address: ${details.address || 'N/A'}`);
      } catch (e) {
        console.log('   Details: Error parsing JSON');
      }
    } else {
      console.log('\n❌ No details stored!');
    }
    
    // Check if there's a corresponding record in visitors table
    const [visitorRows] = await pool.query(
      `SELECT * FROM visitors 
       WHERE booking_id = ? AND is_main_visitor = false
       ORDER BY created_at DESC`,
      [tokenInfo.booking_id]
    );
    
    console.log('\n👥 Corresponding Visitor Records:');
    if (visitorRows.length === 0) {
      console.log('   No visitor records found for this booking');
    } else {
      visitorRows.forEach((visitor, index) => {
        console.log(`   ${index + 1}. Visitor ID: ${visitor.visitor_id}`);
        console.log(`      Name: ${visitor.first_name} ${visitor.last_name}`);
        console.log(`      Email: ${visitor.email}`);
        console.log(`      Status: ${visitor.status}`);
        console.log(`      Created: ${visitor.created_at}`);
        console.log(`      Is Main: ${visitor.is_main_visitor ? 'Yes' : 'No'}`);
      });
    }
    
    console.log('\n🎯 Analysis:');
    if (tokenInfo.status === 'checked-in' && !tokenInfo.checkin_time) {
      console.log('⚠️  Status is "checked-in" but no check-in time recorded!');
      console.log('💡 This might be a data inconsistency');
    } else if (tokenInfo.status === 'checked-in' && tokenInfo.checkin_time) {
      console.log('✅ Token was properly checked in at:', tokenInfo.checkin_time);
    } else if (tokenInfo.status === 'completed') {
      console.log('✅ Token details completed, ready for check-in');
    } else {
      console.log('⚠️  Token needs details to be completed first');
    }
    
  } catch (err) {
    console.error('❌ Error checking token status:', err);
  } finally {
    await pool.end();
  }
}

// Run the check
checkTokenStatus();
