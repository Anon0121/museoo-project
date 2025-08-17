const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing email functionality...');
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'museoweb1@gmail.com',
        pass: 'akrtgds yyprsfxyi'
      }
    });
    
    console.log('📧 Transporter created, testing connection...');
    
    // Verify connection
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email verification failed:', error);
          reject(error);
        } else {
          console.log('✅ Email verification successful');
          resolve();
        }
      });
    });
    
    // Test sending email
    console.log('📧 Attempting to send test email...');
    const info = await transporter.sendMail({
      from: 'museoweb1@gmail.com',
      to: 'museoweb1@gmail.com', // Send to self for testing
      subject: 'Test Email - Museum Donation System',
      text: 'This is a test email from the museum donation system.',
      html: '<h1>Test Email</h1><p>This is a test email from the museum donation system.</p>'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
  }
}

testEmail(); 