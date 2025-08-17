const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generateAdditionalVisitorQR() {
  try {
    console.log('👥 Generating Additional Visitor QR Code (Token-based)...\n');
    
    // Sample additional visitor data (token-based)
    const tokenData = {
      type: 'additional_visitor',
      tokenId: 'ADD-BOOK123-1',
      bookingId: 123,
      email: 'juan.delacruz@example.com',
      visitDate: '2025-01-15',
      visitTime: '14:00 - 15:00',
      groupLeader: 'John Smith'
    };
    
    console.log('📱 Additional Visitor QR Code Data:');
    console.log(JSON.stringify(tokenData, null, 2));
    console.log(`\n📏 Data Length: ${JSON.stringify(tokenData).length} characters`);
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(JSON.stringify(tokenData), {
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
    const outputPath = path.join(__dirname, 'additional_visitor_qr_code.png');
    fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
    
    console.log('\n✅ Additional Visitor QR Code Generated!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log('\n📋 Instructions:');
    console.log('1. Open the Scanner tab in your admin panel');
    console.log('2. Click "Choose Image" (file upload)');
    console.log('3. Upload the additional_visitor_qr_code.png file');
    console.log('4. The scanner should detect and process the QR code');
    console.log('\n🎯 Expected Result:');
    console.log('- Token ID: ADD-BOOK123-1');
    console.log('- Email: juan.delacruz@example.com');
    console.log('- Visit Date: 2025-01-15');
    console.log('- Visit Time: 14:00 - 15:00');
    console.log('- Group Leader: John Smith');
    console.log('\n⚠️  Note: This QR will only work if:');
    console.log('   • The token exists in the database');
    console.log('   • Visitor details have been completed');
    console.log('   • The booking is still valid');
    console.log('\n🔗 Additional Visitor Form URL:');
    console.log(`http://localhost:5173/additional-visitor?token=${tokenData.tokenId}`);
    
  } catch (error) {
    console.error('❌ Error generating additional visitor QR code:', error);
  }
}

// Run the function
generateAdditionalVisitorQR();


