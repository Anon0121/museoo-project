const QRCode = require('qrcode');

async function testQrGeneration() {
  try {
    console.log('🔧 Testing QR code generation...\n');
    
    // Test the exact QR data that should be in the QR code
    const testQrData = {
      type: 'additional_visitor',
      tokenId: 'ADD-BOOK45-2',
      bookingId: '45',
      email: 'julianafe.amboy56@gmail.com',
      visitDate: '2025-10-22T16:00:00.000Z',
      visitTime: '10:00 - 11:00',
      groupLeader: 'last tect'
    };
    
    console.log('📋 Original QR Data:');
    console.log(JSON.stringify(testQrData, null, 2));
    
    // Convert to JSON string (same as backend)
    const qrDataString = JSON.stringify(testQrData);
    console.log('\n📋 QR Data as JSON String:');
    console.log(qrDataString);
    console.log('String length:', qrDataString.length);
    
    // Generate QR code
    console.log('\n🎫 Generating QR code...');
    const qrDataUrl = await QRCode.toDataURL(qrDataString);
    console.log('QR code generated successfully!');
    console.log('QR code URL length:', qrDataUrl.length);
    
    // Test parsing the string back
    console.log('\n🔍 Testing JSON parsing of the string:');
    try {
      const parsedData = JSON.parse(qrDataString);
      console.log('✅ JSON parsing successful!');
      console.log('Parsed data:', parsedData);
      console.log('Type:', parsedData.type);
      console.log('Token ID:', parsedData.tokenId);
    } catch (parseError) {
      console.log('❌ JSON parsing failed:', parseError.message);
    }
    
    // Test with the exact data from the image
    console.log('\n🔍 Testing with exact data from the image:');
    const imageData = '{"type":"additional_visitor", "tokenId": "ADD-BOOK45-2", "bookingId":"45","email":"julianafe.amboy56@gmail.com","visitDate":"2025-10-22T16:00:00.000Z", "visitTime":"10:00 - 11:00", "groupLeader":"last tect"}';
    console.log('Image data:', imageData);
    console.log('Image data length:', imageData.length);
    
    try {
      const parsedImageData = JSON.parse(imageData);
      console.log('✅ Image data JSON parsing successful!');
      console.log('Parsed image data:', parsedImageData);
    } catch (parseError) {
      console.log('❌ Image data JSON parsing failed:', parseError.message);
    }
    
    console.log('\n🎯 Possible Issues:');
    console.log('1. QR code might contain hidden characters');
    console.log('2. QR code might be truncated during scanning');
    console.log('3. QR code might have encoding issues');
    console.log('4. Scanner might be adding extra characters');
    
    console.log('\n💡 Solution:');
    console.log('1. Try the "Test Real QR Data" button in the scanner');
    console.log('2. Check browser console for debug logs');
    console.log('3. Compare the scanned data with the expected data');
    
  } catch (err) {
    console.error('❌ Error testing QR generation:', err);
  }
}

// Run the test
testQrGeneration();


