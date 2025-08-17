const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'museoweb1@gmail.com',
      pass: 'akrtgds yyprsfxyi'
    }
  });
};

// Send event registration confirmation email
const sendEventRegistrationEmail = async (registrationData) => {
  try {
    const transporter = createTransporter();
    
    const { fullName, email, event, qrCode } = registrationData;
    
    const mailOptions = {
      from: 'MuseoSmart <museoweb1@gmail.com>',
      to: email,
      subject: `Event Registration Confirmation - ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8B6B21, #D4AF37); padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Event Registration Confirmed!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${fullName},</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for registering for our event! Your registration has been confirmed.
            </p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B6B21;">
              <h3 style="color: #8B6B21; margin-top: 0;">Event Details</h3>
              <p style="margin: 5px 0;"><strong>Event:</strong> ${event.title}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${event.time}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${event.location}</p>
            </div>
            
            ${qrCode ? `
            <div style="text-align: center; margin: 20px 0;">
              <h3 style="color: #333;">Your QR Code for Check-in</h3>
              <p style="color: #666; margin-bottom: 15px;">
                <strong>IMPORTANT:</strong> Save this QR code on your phone or print it. You must present this at the event entrance for verification.
              </p>
              <img src="${qrCode}" alt="Registration QR Code" style="max-width: 250px; border: 3px solid #8B6B21; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <p style="color: #666; font-size: 14px; margin-top: 10px;">
                <strong>Registration ID:</strong> ${registrationData.registrationId || 'N/A'}
              </p>
            </div>
            ` : ''}
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #0066cc; margin-top: 0;">Check-in Instructions</h4>
              <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
                <li><strong>Arrive 10 minutes early</strong> to allow time for check-in</li>
                <li><strong>Present your QR code</strong> to the event staff</li>
                <li><strong>Bring a valid ID</strong> for additional verification if needed</li>
                <li><strong>Keep this email</strong> as backup confirmation</li>
              </ul>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin-top: 0;">Event Reminders</h4>
              <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
                <li>Check the event location and parking information</li>
                <li>Dress appropriately for the event</li>
                <li>If you cannot attend, please cancel your registration</li>
                <li>For questions, contact us at info@museum.com</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              We look forward to seeing you at the event!
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Best regards,<br>
              <strong>Cagayan de Oro City Museum Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>Registration ID: ${registrationData.registrationId || 'N/A'}</p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Event registration email sent with QR code:', result.messageId);
    return result;
    
  } catch (error) {
    console.error('❌ Error sending event registration email:', error);
    throw error;
  }
};

// Send event reminder email
const sendEventReminderEmail = async (registrationData) => {
  try {
    const transporter = createTransporter();
    
    const { fullName, email, event, qrCode } = registrationData;
    
    const mailOptions = {
      from: 'MuseoSmart <museoweb1@gmail.com>',
      to: email,
      subject: `Event Reminder - ${event.title} Tomorrow`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8B6B21, #D4AF37); padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Event Reminder</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${fullName},</h2>
            <p style="color: #666; line-height: 1.6;">
              This is a friendly reminder that you have an event tomorrow!
            </p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B6B21;">
              <h3 style="color: #8B6B21; margin-top: 0;">Event Details</h3>
              <p style="margin: 5px 0;"><strong>Event:</strong> ${event.title}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${event.time}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${event.location}</p>
            </div>
            
            ${qrCode ? `
            <div style="text-align: center; margin: 20px 0;">
              <h3 style="color: #333;">Your QR Code</h3>
              <p style="color: #666; margin-bottom: 15px;">
                Don't forget to bring your QR code for check-in:
              </p>
              <img src="${qrCode}" alt="Registration QR Code" style="max-width: 200px; border: 2px solid #ddd; border-radius: 8px;">
            </div>
            ` : ''}
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin-top: 0;">Reminder Checklist</h4>
              <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
                <li>Set your alarm for tomorrow</li>
                <li>Plan your route to the venue</li>
                <li>Bring your QR code or registration confirmation</li>
                <li>Bring a valid ID</li>
                <li>Arrive 10 minutes early</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              We're excited to see you tomorrow!
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Best regards,<br>
              <strong>Cagayan de Oro City Museum Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Event reminder email sent:', result.messageId);
    return result;
    
  } catch (error) {
    console.error('❌ Error sending event reminder email:', error);
    throw error;
  }
};

module.exports = {
  sendEventRegistrationEmail,
  sendEventReminderEmail
};

