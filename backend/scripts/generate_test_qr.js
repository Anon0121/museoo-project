const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generateTestQR() {
  try {
    console.log('🧪 Generating Test QR Code...\n');
    
    // Test data for a group member
    const testData = JSON.stringify({
      type: 'group_member',
      memberId: 999,
      bookingId: 999,
      email: 'test@example.com',
      visitDate: '2025-01-15',
      visitTime: '09:00 - 10:00',
      institution: 'Test University',
      groupLeader: 'Test Leader',
      purpose: 'visit',
      detailsCompleted: true,
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male',
      nationality: 'Filipino',
      address: 'Test Address'
    });
    
    console.log('📱 Test QR Code Data:');
    console.log(testData);
    console.log(`\n📏 Data Length: ${testData.length} characters`);
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(testData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Save to file
    const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
    const outputPath = path.join(__dirname, 'test_qr_code.png');
    fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
    
    console.log('\n✅ Test QR Code Generated!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log('\n📋 Instructions:');
    console.log('1. Open the Scanner tab in your admin panel');
    console.log('2. Click "Choose Image" (file upload)');
    console.log('3. Upload the test_qr_code.png file');
    console.log('4. The scanner should detect and process the QR code');
    console.log('\n🎯 Expected Result:');
    console.log('- Name: John Doe');
    console.log('- Email: test@example.com');
    console.log('- Institution: Test University');
    console.log('- Group Leader: Test Leader');
    console.log('- Details Completed: Yes');
    
  } catch (err) {
    console.error('❌ Error generating test QR code:', err);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  generateTestQR()
    .then(() => {
      console.log('\n🔌 Test QR code generation completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Test failed:', err);
      process.exit(1);
    });
}

module.exports = generateTestQR;
