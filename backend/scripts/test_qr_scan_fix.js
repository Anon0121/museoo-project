const mysql = require('mysql2/promise');
const pool = require('../db');

async function testQrScanFix() {
  try {
    console.log('🔧 Testing QR scan fix for ADD-BOOK47-1...\n');
    
    // Test the specific QR data from the user's screenshot
    const qrData = {
      type: 'additional_visitor',
      tokenId: 'ADD-BOOK47-1',
      bookingId: '47',
      email: 'julianafe.amboy56@gmail.com',
      visitDate: '2025-08-28T16:00:00.000Z',
      visitTime: '11:00 - 12:00',
      groupLeader: 'test su12e shesh'
    };
    
    console.log('📋 QR Data to test:');
    console.log(JSON.stringify(qrData, null, 2));
    
    // Check if token exists in database
    const [tokenRows] = await pool.query(
      `SELECT av.*, b.date as visit_date, b.time_slot, b.status as booking_status
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       WHERE av.token_id = ?`,
      ['ADD-BOOK47-1']
    );
    
    if (tokenRows.length === 0) {
      console.log('❌ Token ADD-BOOK47-1 not found in database!');
      console.log('💡 This explains the 400 error - the backend can\'t find the token');
      return;
    }
    
    const tokenInfo = tokenRows[0];
    console.log('✅ Token found:');
    console.log(`   Token ID: ${tokenInfo.token_id}`);
    console.log(`   Email: ${tokenInfo.email}`);
    console.log(`   Status: ${tokenInfo.status}`);
    console.log(`   Booking Status: ${tokenInfo.booking_status}`);
    
    if (tokenInfo.status === 'checked-in') {
      console.log('\n⚠️  Token already checked in!');
      console.log('💡 This would cause a 400 error: "This visitor has already been checked in."');
    } else if (tokenInfo.status !== 'completed') {
      console.log('\n⚠️  Token details not completed!');
      console.log('💡 This would cause a 400 error: "Visitor details must be completed before check-in."');
    } else {
      console.log('\n✅ Token is ready for check-in!');
      console.log('💡 The QR scan should work properly');
    }
    
    // Test JSON parsing
    const qrDataString = JSON.stringify(qrData);
    console.log('\n🔍 Testing JSON parsing...');
    console.log('QR data as string:', qrDataString);
    
    try {
      const parsed = JSON.parse(qrDataString);
      console.log('✅ JSON parsing successful!');
      console.log(`Parsed data type: ${parsed.type}`);
      console.log(`Parsed token ID: ${parsed.tokenId}`);
    } catch (parseError) {
      console.log('❌ JSON parsing failed:', parseError.message);
    }
    
    console.log('\n🎯 Possible Issues:');
    console.log('1. Token not found in database');
    console.log('2. Token already checked in');
    console.log('3. Token details not completed');
    console.log('4. Booking is cancelled');
    console.log('5. JSON parsing issue in frontend');
    
  } catch (err) {
    console.error('❌ Error testing QR scan fix:', err);
  } finally {
    await pool.end();
  }
}

// Run the test
testQrScanFix();
