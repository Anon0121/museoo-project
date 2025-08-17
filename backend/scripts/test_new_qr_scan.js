const mysql = require('mysql2/promise');
const pool = require('../db');

async function testNewQrScan() {
  try {
    console.log('🔧 Testing new QR scan for ADD-BOOK45-2...\n');
    
    // Test the QR data from the console log
    const testQrData = {
      "type": "additional_visitor",
      "tokenId": "ADD-BOOK45-2",
      "bookingId": "45",
      "email": "julianafe.amboy56@gmail.com",
      "visitDate": "2025-10-22T16:00:00.000Z",
      "visitTime": "10:00 - 11:00",
      "groupLeader": "last tect"
    };
    
    console.log('📋 Test QR Data:');
    console.log(JSON.stringify(testQrData, null, 2));
    
    // Check if the token exists in database
    console.log('\n🔍 Checking if token exists in database...');
    const [tokenRows] = await pool.query(
      `SELECT av.*, b.date as visit_date, b.time_slot, b.status as booking_status
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       WHERE av.token_id = ?`,
      [testQrData.tokenId]
    );
    
    if (tokenRows.length === 0) {
      console.log('❌ Token not found in database!');
      console.log('💡 This means the companion form was not completed yet.');
      
      // Check if booking 45 exists
      const [bookingRows] = await pool.query(
        `SELECT * FROM bookings WHERE booking_id = 45`
      );
      
      if (bookingRows.length === 0) {
        console.log('\n❌ Booking ID 45 does not exist!');
      } else {
        console.log('\n✅ Booking ID 45 exists:');
        console.log(`   Status: ${bookingRows[0].status}`);
        console.log(`   Date: ${bookingRows[0].date}`);
        console.log(`   Time: ${bookingRows[0].time_slot}`);
        
        // Check for any additional visitors for this booking
        const [additionalRows] = await pool.query(
          `SELECT * FROM additional_visitors WHERE booking_id = 45`
        );
        
        if (additionalRows.length === 0) {
          console.log('❌ No additional visitors found for booking 45');
        } else {
          console.log(`✅ Found ${additionalRows.length} additional visitor(s):`);
          additionalRows.forEach((row, index) => {
            console.log(`   ${index + 1}. Token: ${row.token_id}`);
            console.log(`      Email: ${row.email}`);
            console.log(`      Status: ${row.status}`);
            console.log(`      Details: ${row.details ? 'Completed' : 'Not completed'}`);
          });
        }
      }
    } else {
      const tokenInfo = tokenRows[0];
      console.log('✅ Token found in database!');
      console.log(`   Status: ${tokenInfo.status}`);
      console.log(`   Email: ${tokenInfo.email}`);
      console.log(`   Booking Status: ${tokenInfo.booking_status}`);
      console.log(`   Details: ${tokenInfo.details ? 'Completed' : 'Not completed'}`);
      
      if (tokenInfo.status === 'pending') {
        console.log('\n⚠️  Token status is "pending" - companion needs to complete form');
        console.log('📝 The companion should:');
        console.log('   1. Check their email for the form link');
        console.log('   2. Click the link and fill out details');
        console.log('   3. Submit the form');
        console.log('   4. Then QR code will work for check-in');
      } else if (tokenInfo.status === 'completed') {
        console.log('\n✅ Token is ready for check-in!');
        console.log('🎫 QR code should work now');
        
        // Show the details that would be displayed
        if (tokenInfo.details) {
          const details = JSON.parse(tokenInfo.details);
          console.log('\n📋 Visitor Details that will be displayed:');
          console.log(`   Name: ${details.firstName} ${details.lastName}`);
          console.log(`   Email: ${tokenInfo.email}`);
          console.log(`   Gender: ${details.gender}`);
          console.log(`   Nationality: ${details.nationality}`);
          console.log(`   Address: ${details.address}`);
          console.log(`   Institution: ${details.institution}`);
          console.log(`   Group Leader: ${testQrData.groupLeader}`);
          console.log(`   Visit Date: ${tokenInfo.visit_date}`);
          console.log(`   Visit Time: ${tokenInfo.time_slot}`);
        }
      } else if (tokenInfo.status === 'checked-in') {
        console.log('\n⚠️  Token already checked in!');
        console.log('🚫 Cannot check in again');
      }
    }
    
    console.log('\n🔧 Frontend Fix Applied:');
    console.log('✅ Updated QR scanner to handle "additional_visitor" type');
    console.log('✅ Reduced scan error noise (NotFoundException errors hidden)');
    console.log('✅ Updated error messages to include new QR types');
    console.log('✅ Fixed visitor data mapping (json.visitor instead of json.member)');
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Try scanning the QR code again');
    console.log('   2. Should now work without type errors');
    console.log('   3. Will display visitor details if token is completed');
    
  } catch (err) {
    console.error('❌ Error testing new QR scan:', err);
  } finally {
    await pool.end();
  }
}

// Run the test
testNewQrScan();


