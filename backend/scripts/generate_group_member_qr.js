const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generateGroupMemberQR() {
  try {
    console.log('👥 Generating Group Member QR Code...\n');
    
    // Sample group member data (you can modify these values)
    const memberData = {
      type: 'group_member',
      memberId: 123,
      bookingId: 456,
      email: 'jane.doe@example.com',
      visitDate: '2025-01-15',
      visitTime: '14:00 - 15:00',
      institution: 'University of Technology',
      groupLeader: 'John Smith',
      purpose: 'educational',
      detailsCompleted: true,
      firstName: 'Jane',
      lastName: 'Doe',
      gender: 'female',
      nationality: 'Filipino',
      address: '123 Main Street, Manila'
    };
    
    console.log('📱 Group Member QR Code Data:');
    console.log(JSON.stringify(memberData, null, 2));
    console.log(`\n📏 Data Length: ${JSON.stringify(memberData).length} characters`);
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(JSON.stringify(memberData), {
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
    const outputPath = path.join(__dirname, 'group_member_qr_code.png');
    fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
    
    console.log('\n✅ Group Member QR Code Generated!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log('\n📋 Instructions:');
    console.log('1. Open the Scanner tab in your admin panel');
    console.log('2. Click "Choose Image" (file upload)');
    console.log('3. Upload the group_member_qr_code.png file');
    console.log('4. The scanner should detect and process the QR code');
    console.log('\n🎯 Expected Result:');
    console.log('- Name: Jane Doe');
    console.log('- Email: jane.doe@example.com');
    console.log('- Institution: University of Technology');
    console.log('- Group Leader: John Smith');
    console.log('- Gender: female');
    console.log('- Nationality: Filipino');
    console.log('\n🔗 Group Member Form URL:');
    console.log(`http://localhost:5173/group-member/${memberData.memberId}/${memberData.bookingId}`);
    
  } catch (error) {
    console.error('❌ Error generating group member QR code:', error);
  }
}

// Run the function
generateGroupMemberQR();


