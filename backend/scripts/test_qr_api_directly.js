const mysql = require('mysql2/promise');
const pool = require('../db');

async function testQrApiDirectly() {
  try {
    console.log('🔧 Testing QR scan API endpoint directly...\n');
    
    // Test the exact QR data from the image
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
    
    // Simulate the API call that the frontend would make
    console.log('\n🔍 Simulating API call to /api/slots/visit/qr-scan...');
    
    // First, check if the token exists
    const [tokenRows] = await pool.query(
      `SELECT av.*, b.date as visit_date, b.time_slot, b.status as booking_status
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       WHERE av.token_id = ?`,
      [testQrData.tokenId]
    );
    
    if (tokenRows.length === 0) {
      console.log('❌ Token not found in database!');
      return;
    }
    
    const tokenInfo = tokenRows[0];
    console.log('✅ Token found in database!');
    console.log(`   Status: ${tokenInfo.status}`);
    console.log(`   Email: ${tokenInfo.email}`);
    console.log(`   Booking Status: ${tokenInfo.booking_status}`);
    
    if (tokenInfo.status === 'pending') {
      console.log('\n⚠️  Token status is "pending" - companion needs to complete form');
      console.log('📝 This would return an error: "Visitor details must be completed before check-in."');
    } else if (tokenInfo.status === 'completed') {
      console.log('\n✅ Token is ready for check-in!');
      console.log('🎫 This should work successfully');
      
      // Show what the API would return
      if (tokenInfo.details) {
        const details = JSON.parse(tokenInfo.details);
        console.log('\n📋 API Response that should be returned:');
        console.log(JSON.stringify({
          success: true,
          message: 'Additional visitor checked in successfully!',
          visitor: {
            firstName: details.firstName,
            lastName: details.lastName,
            email: tokenInfo.email,
            gender: details.gender,
            nationality: details.nationality,
            address: details.address,
            institution: details.institution || 'N/A',
            groupLeader: testQrData.groupLeader || 'N/A',
            visitDate: tokenInfo.visit_date,
            visitTime: tokenInfo.time_slot,
            checkin_time: new Date().toISOString()
          }
        }, null, 2));
      }
    } else if (tokenInfo.status === 'checked-in') {
      console.log('\n⚠️  Token already checked in!');
      console.log('📝 This would return an error: "This visitor has already been checked in."');
    }
    
    console.log('\n🔍 Testing JSON parsing...');
    const qrDataString = JSON.stringify(testQrData);
    console.log('QR data as string:', qrDataString);
    
    try {
      const parsedData = JSON.parse(qrDataString);
      console.log('✅ JSON parsing successful!');
      console.log('Parsed data type:', parsedData.type);
      console.log('Parsed token ID:', parsedData.tokenId);
    } catch (parseError) {
      console.log('❌ JSON parsing failed:', parseError.message);
    }
    
    console.log('\n🎯 Frontend Debugging Steps:');
    console.log('1. Check browser console for the debug logs we added');
    console.log('2. Look for "Raw decoded text" and "Parsed QR data" logs');
    console.log('3. Check if JSON.parse() is working correctly');
    console.log('4. Verify the QR data type is being detected properly');
    
  } catch (err) {
    console.error('❌ Error testing QR API:', err);
  } finally {
    await pool.end();
  }
}

// Run the test
testQrApiDirectly();


