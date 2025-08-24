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

// Send event registration approval email with QR code and unique ID
const sendEventApprovalEmail = async (registrationData) => {
  try {
    const transporter = createTransporter();
    
    const { 
      firstname, 
      lastname, 
      email, 
      event_title, 
      start_date, 
      time, 
      location, 
      qr_code, 
      participant_id 
    } = registrationData;
    
    const fullName = `${firstname} ${lastname}`;
    const eventDate = new Date(start_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const eventTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) : 'TBD';
    
    console.log('📧 Preparing elegant invitation email with QR code attachment for:', email);
    console.log('🔍 QR Code data length:', qr_code ? qr_code.length : 'No QR code');
    
    // Prepare attachments array
    let attachments = [];
    
    if (qr_code) {
      // Convert data URL to base64 buffer for attachment
      const base64Data = qr_code.replace(/^data:image\/png;base64,/, '');
      attachments.push({
        filename: `invitation_qr_code_${participant_id}.png`,
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'image/png'
      });
    }
    
    const mailOptions = {
      from: 'MuseoSmart <museoweb1@gmail.com>',
      to: email,
      subject: `🎫 You've Been Invited to: ${event_title}`,
      html: `
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Invitation</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
          <div style="max-width: 700px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
              <!-- Main Container -->
              <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                  
                  <!-- Elegant Header -->
                  <div style="background: linear-gradient(135deg, #2e2b41 0%, #AB8841 100%); padding: 50px 40px; text-align: center; color: white; position: relative;">
                      <div style="position: absolute; top: 20px; right: 20px; font-size: 24px; opacity: 0.3;">🎫</div>
                      <div style="font-size: 56px; margin-bottom: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">🎉</div>
                      <h1 style="margin: 0; font-size: 36px; font-weight: 300; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">You're Invited!</h1>
                      <p style="margin: 15px 0 0 0; font-size: 20px; opacity: 0.9; font-weight: 300; letter-spacing: 1px;">We're excited to have you join us</p>
                  </div>
                  
                  <!-- Main Content -->
                  <div style="padding: 50px 40px;">
                      
                      <!-- Personal Greeting -->
                      <div style="text-align: center; margin-bottom: 40px;">
                          <h2 style="color: #2e2b41; margin-bottom: 15px; font-size: 28px; font-weight: 400;">Dear ${fullName},</h2>
                          <p style="color: #666; font-size: 18px; margin: 0; line-height: 1.6;">It is with great pleasure that we extend this invitation to you. We've prepared something special and would be honored by your presence.</p>
                      </div>
                      
                      <!-- Event Details Card -->
                      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 3px solid #AB8841; border-radius: 20px; padding: 40px; margin: 40px 0; text-align: center; position: relative;">
                          <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #AB8841; color: white; padding: 10px 30px; border-radius: 25px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Event Details</div>
                          
                          <h3 style="color: #2e2b41; margin: 0 0 30px 0; font-size: 32px; font-weight: 500; line-height: 1.2;">${event_title}</h3>
                          
                          <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
                              <div style="background: white; padding: 25px; border-radius: 15px; min-width: 200px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
                                  <div style="font-size: 16px; color: #AB8841; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 600;">📅 Date & Time</div>
                                  <div style="font-size: 20px; color: #2e2b41; font-weight: 600; margin-bottom: 8px; line-height: 1.3;">${eventDate}</div>
                                  <div style="font-size: 18px; color: #666; font-weight: 500;">${eventTime}</div>
                              </div>
                              
                              <div style="background: white; padding: 25px; border-radius: 15px; min-width: 200px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
                                  <div style="font-size: 16px; color: #AB8841; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 600;">📍 Location</div>
                                  <div style="font-size: 18px; color: #2e2b41; font-weight: 500; line-height: 1.4;">${location}</div>
                              </div>
                          </div>
                      </div>
                      
                      
                      
                      <!-- Backup code section -->
                      <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border: 2px solid #ffc107; border-radius: 20px; padding: 35px; margin: 40px 0;">
                          <div style="text-align: center; margin-bottom: 25px;">
                              <div style="font-size: 32px; margin-bottom: 15px;">🔑</div>
                              <h3 style="color: #856404; margin: 0; font-size: 22px; font-weight: 500;">Backup Access Code</h3>
                              <p style="color: #856404; margin: 15px 0 0 0; font-size: 16px; line-height: 1.6;">In case your QR code doesn't work, you can use this exclusive access code at the entrance</p>
                          </div>
                          
                          <div style="background: white; padding: 30px; text-align: center; border-radius: 15px; border: 2px solid #ffc107; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                              <div style="font-size: 14px; color: #856404; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-weight: 600;">Your Exclusive Access Code</div>
                              <div style="font-size: 28px; color: #AB8841; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 3px; padding: 15px; background: #f8f9fa; border-radius: 10px; border: 1px solid #e0e0e0;">${participant_id}</div>
                              <p style="margin: 20px 0 0 0; font-size: 14px; color: #856404; line-height: 1.5;">
                                  Simply provide this code to our event staff for a quick manual check-in
                              </p>
                          </div>
                      </div>
                      
                      <!-- Important information -->
                      <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border: 2px solid #2196f3; border-radius: 20px; padding: 35px; margin: 40px 0;">
                          <div style="text-align: center; margin-bottom: 25px;">
                              <div style="font-size: 32px; margin-bottom: 15px;">ℹ️</div>
                              <h3 style="color: #1565c0; margin: 0; font-size: 22px; font-weight: 500;">Important Information</h3>
                          </div>
                          
                          <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                              <ul style="color: #1565c0; margin: 0; padding-left: 25px; font-size: 16px; line-height: 1.8;">
                                  <li style="margin-bottom: 12px;">Please arrive <strong>10 minutes early</strong> for a smooth check-in experience</li>
                                  <li style="margin-bottom: 12px;">Bring a valid photo ID for verification purposes</li>
                                  <li style="margin-bottom: 12px;">Save your QR code or note your access code for easy access</li>
                                  <li style="margin-bottom: 12px;">Dress appropriately for the event atmosphere</li>
                                  <li style="margin-bottom: 0;">Contact us if you need to cancel or have any questions</li>
                              </ul>
                          </div>
                      </div>
                      
                      <!-- Footer -->
                      <div style="text-align: center; margin-top: 50px; padding-top: 40px; border-top: 3px solid #f0f0f0;">
                          <p style="margin: 0 0 20px 0; font-size: 18px; color: #2e2b41; font-weight: 500;">We look forward to welcoming you to this special event!</p>
                          <p style="margin: 0 0 15px 0; color: #AB8841; font-size: 16px; font-weight: 500;">Best regards,</p>
                          <p style="margin: 0; color: #2e2b41; font-weight: 600; font-size: 18px;">The MuseoSmart Team</p>
                          
                          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 15px; border: 1px solid #e0e0e0;">
                              <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.5;">
                                  This is an automated invitation. Please do not reply to this email.<br>
                                  For questions, please contact our support team.
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </body>
      </html>
      `,
      attachments: attachments
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Elegant event invitation email sent with QR code attachment:', result.messageId);
    return result;
    
  } catch (error) {
    console.error('❌ Error sending elegant event invitation email:', error);
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
  sendEventApprovalEmail,
  sendEventReminderEmail
};

