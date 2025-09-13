const express = require('express');
const pool = require('../db');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');
const { authenticateToken } = require('../middleware/auth');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

const SLOT_CAPACITY = 30;
const TIME_SLOTS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
];

// Function to send emails for walk-in bookings
async function sendWalkInBookingEmails(bookingId, mainVisitor, companionTokens, date, time) {
  try {
    // Create email transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'museoweb1@gmail.com',
        pass: 'akrtgds yyprsfxyi'
      }
    });

    // Send email to main visitor
    if (mainVisitor.email) {
      const isWalkInScheduling = mainVisitor.firstName === 'Walk-in';
      const emailSubject = isWalkInScheduling ? '🎫 Your Walk-In Museum Visit - Complete Your Profile' : '🎫 Your Museum Visit QR Code - Complete Your Profile';
      const emailHtml = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🎫 Museum Visit Confirmed!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">${isWalkInScheduling ? 'Your walk-in visit has been scheduled' : 'Your walk-in booking has been auto-approved'}</p>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #2e2b41; margin-bottom: 20px;">Hello ${mainVisitor.firstName === 'Walk-in' ? '' : mainVisitor.firstName + '!'}</h2>
                
                <p>Your museum visit has been <strong>scheduled</strong> for <strong>${date}</strong> at <strong>${time}</strong>.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #AB8841;">
                    <h3 style="color: #AB8841; margin-top: 0;">📋 Complete Your Profile</h3>
                    <p>To get your QR code and complete your booking, please click the link below and fill in your details:</p>
                    <a href="http://localhost:3000/complete-profile/${bookingId}" style="display: inline-block; background: #AB8841; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Complete Profile</a>
                </div>
                
                <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #2e2b41;">📅 Visit Details</h4>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p><strong>Booking ID:</strong> ${bookingId}</p>
                    <p><strong>Status:</strong> ✅ Scheduled</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">Please complete your profile as soon as possible to receive your QR code.</p>
            </div>
        </body>
        </html>
      `;
      
      const mailOptions = {
        from: 'museoweb1@gmail.com',
        to: mainVisitor.email,
        subject: emailSubject,
        html: emailHtml
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to main visitor: ${mainVisitor.email}`);
    }

    // Send emails to additional visitors
    for (const companion of companionTokens) {
      if (companion.email) {
        const mailOptions = {
          from: 'museoweb1@gmail.com',
          to: companion.email,
          subject: '🎫 Your Museum Visit QR Code - Complete Your Profile',
          html: `
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">🎫 Museum Visit QR Code</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Complete your profile to get your QR code</p>
                </div>
                
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #2e2b41; margin-bottom: 20px;">Hello!</h2>
                    
                    <p>You have been added to a museum visit scheduled for <strong>${date}</strong> at <strong>${time}</strong>.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #AB8841;">
                        <h3 style="color: #AB8841; margin-top: 0;">📋 Complete Your Profile</h3>
                        <p>To get your QR code and complete your booking, please click the link below and fill in your details:</p>
                        <a href="http://localhost:3000/complete-profile/${companion.tokenId}" style="display: inline-block; background: #AB8841; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Complete Profile</a>
                    </div>
                    
                    <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #2e2b41;">📅 Visit Details</h4>
                        <p><strong>Date:</strong> ${date}</p>
                        <p><strong>Time:</strong> ${time}</p>
                        <p><strong>Token ID:</strong> ${companion.tokenId}</p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">Please complete your profile as soon as possible to receive your QR code.</p>
                </div>
            </body>
            </html>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to additional visitor: ${companion.email}`);
      }
    }
  } catch (error) {
    console.error('❌ Error sending walk-in booking emails:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// Get slots for a date
router.get('/', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  try {
    // Get all bookings for the date
    const [rows] = await pool.query(
      `SELECT time_slot, SUM(total_visitors) AS booked
       FROM bookings
       WHERE date = ?
       GROUP BY time_slot`,
      [date]
    );
    const slotMap = {};
    rows.forEach(row => {
      slotMap[row.time_slot] = row.booked;
    });
    const slots = TIME_SLOTS.map(time => ({
      time,
      booked: slotMap[time] ? Number(slotMap[time]) : 0,
      capacity: SLOT_CAPACITY
    }));
    res.json(slots);
  } catch (err) {
    console.error('Error fetching slots:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Book a slot (group or individual)
router.post('/book', async (req, res) => {
  const { type, mainVisitor, groupMembers, companions, totalVisitors, date, time } = req.body;
  if (!date || !time || !mainVisitor || !totalVisitors) return res.status(400).json({ error: 'Missing data' });

  // Validate visitor limits for group walk-in bookings
  if (type === 'group-walkin') {
    const additionalVisitors = groupMembers?.length || companions?.length || 0;
    if (additionalVisitors > 29) {
      return res.status(400).json({ error: 'Maximum 29 additional visitors allowed for group walk-in bookings' });
    }
    if (totalVisitors > 30) { // 1 main visitor + 29 additional = 30 total
      return res.status(400).json({ error: 'Maximum 30 total visitors allowed for group walk-in bookings' });
    }
  }

  const conn = await pool.getConnection();
  try {
    // Check slot capacity
    const [rows] = await conn.query(
      `SELECT SUM(total_visitors) AS booked FROM bookings WHERE date = ? AND time_slot = ?`,
      [date, time]
    );
    const booked = rows[0].booked ? Number(rows[0].booked) : 0;
    if (booked + totalVisitors > SLOT_CAPACITY) {
      conn.release();
      return res.status(400).json({ error: 'Slot full' });
    }

    // Determine initial status based on booking type
    const initialStatus = (type === 'individual walk-in' || type === 'group walk-in') ? 'approved' : 'pending';
    
    // Insert booking
    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (first_name, last_name, type, status, date, time_slot, total_visitors) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        mainVisitor.firstName,
        mainVisitor.lastName,
        type, // Use the exact type passed (individual walk-in, group walk-in, etc.)
        initialStatus,
        date,
        time,
        totalVisitors
      ]
    );
    const bookingId = bookingResult.insertId;

    // Insert main visitor with complete information
    let mainVisitorId = null;
    const visitorStatus = (type === 'individual-walkin' || type === 'group-walkin') ? 'approved' : 'pending';
    const [mainVisitorResult] = await conn.query(
      `INSERT INTO visitors (booking_id, first_name, last_name, gender, address, email, visitor_type, purpose, institution, status, is_main_visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [bookingId, mainVisitor.firstName, mainVisitor.lastName, mainVisitor.gender || '', mainVisitor.address || '', mainVisitor.email, mainVisitor.visitorType || 'local', mainVisitor.purpose || 'other', mainVisitor.institution || null, visitorStatus]
    );
    mainVisitorId = mainVisitorResult.insertId;

    // Handle group members (additional visitors) - insert directly into visitors table
    let companionTokens = [];
    const membersToProcess = groupMembers || companions || [];
    
    if ((type === 'group' || type === 'group-walkin') && Array.isArray(membersToProcess)) {
      for (let i = 0; i < membersToProcess.length; i++) {
        const member = membersToProcess[i];
        
        // Insert group member directly into visitors table
        const [memberResult] = await conn.query(
          `INSERT INTO visitors (booking_id, first_name, last_name, gender, address, email, visitor_type, purpose, institution, status, is_main_visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false)`,
          [bookingId, member.firstName || '', member.lastName || '', member.gender || '', member.address || '', member.email, member.visitorType || 'local', member.purpose || 'other', member.institution || null, visitorStatus]
        );
        
        companionTokens.push({
          visitorId: memberResult.insertId,
          email: member.email
        });
      }
    }

    // Handle walk-in types - create tokens with 24-hour expiration
    if (type === 'walk-in scheduling' || type === 'ind-walkin' || type === 'group-walkin') {
      // Calculate expiration time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      if (type === 'walk-in scheduling') {
        // Walk-in scheduling - create visitor record directly in visitors table
        // No need for tokens since it's a direct walk-in
        console.log('✅ Walk-in scheduling: Visitor record already created in visitors table');
      } else if (type === 'group-walkin') {
        // Group walk-in - all visitors already created in visitors table above
        console.log('✅ Group walk-in: All visitor records already created in visitors table');
      } else if (type === 'group') {
        // Regular group booking - create tokens for additional visitors to complete their forms
        for (let i = 0; i < membersToProcess.length; i++) {
          const member = membersToProcess[i];
          const tokenId = `GROUP-${bookingId}-${i + 1}`;
          
          // Create token for additional visitor form
          await conn.query(
            `INSERT INTO additional_visitors (token_id, booking_id, email, expires_at) VALUES (?, ?, ?, ?)`,
            [tokenId, bookingId, member.email, expiresAt]
          );
          
          companionTokens.push({
            tokenId,
            email: member.email
          });
        }
      }
    }

    conn.release();
    try { await logActivity(req, 'booking.create', { bookingId, date, time, totalVisitors, companions: companionTokens.length }); } catch {}
    
    // Send emails for walk-in bookings immediately (only for auto-approved types)
    if (type === 'individual walk-in' || type === 'group walk-in') {
      console.log(`Walk-in booking detected: ${type}`);
      console.log(`Main visitor email: ${mainVisitor.email}`);
      console.log(`Additional visitors: ${companionTokens.length}`);
      console.log(`Booking ID: ${bookingId}`);
      console.log(`Date: ${date}, Time: ${time}`);
      try {
        await sendWalkInBookingEmails(bookingId, mainVisitor, companionTokens, date, time);
        console.log('✅ Walk-in booking emails sent successfully');
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        console.error('Error details:', emailError.message);
        // Don't fail the booking if email fails
      }
    } else if (type === 'ind-walkin') {
      console.log(`Individual walk-in booking detected: ${type}`);
      console.log(`Main visitor email: ${mainVisitor.email}`);
      console.log(`Booking ID: ${bookingId}`);
      console.log(`Date: ${date}, Time: ${time}`);
      // For ind-walkin, visitor is already in visitors table, no additional email needed
    } else {
      console.log(`Regular booking type: ${type} - no immediate email sent`);
    }
    
    res.json({ 
      success: true, 
      bookingId, 
      visitorIds: mainVisitorId ? [mainVisitorId] : [], 
      companionTokens 
    });
  } catch (err) {
    conn.release();
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all bookings
router.get('/all', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        b.*,
        v.first_name,
        v.last_name,
        v.email,
        v.gender,
        v.address,
        v.visitor_type,
        v.purpose,
        v.institution
       FROM bookings b
       LEFT JOIN visitors v ON b.booking_id = v.booking_id AND v.is_main_visitor = 1
       ORDER BY b.date DESC, b.time_slot`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Approve a booking
router.put('/bookings/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    // Create email transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'museoweb1@gmail.com',
        pass: 'akrtgds yyprsfxyi'
      }
    });

    // 1. Approve the booking
    await pool.query(
      `UPDATE bookings SET status = 'approved' WHERE booking_id = ?`,
      [id]
    );

    // 2. Get booking information
    const [bookingRows] = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = ?`,
      [id]
    );
    const booking = bookingRows[0];

    // Check if this is a walk-in type booking
    const isWalkInScheduling = booking.type === 'walk-in scheduling';
    const isIndWalkin = booking.type === 'ind-walkin';
    const isGroupWalkin = booking.type === 'group-walkin';
    
    console.log('🎫 Booking type:', booking.type);
    console.log('📋 Is walk-in scheduling:', isWalkInScheduling);
    console.log('👤 Is individual walk-in:', isIndWalkin);
    console.log('👥 Is group walk-in:', isGroupWalkin);

    // 3. Get main visitor's email, name, and institution
    let mainVisitor = null;
    
    if (isGroupWalkin) {
      // For group walk-in, get the primary visitor from visitors table
      const [groupWalkinRows] = await pool.query(
        `SELECT visitor_id, email, first_name, last_name, institution FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
        [id]
      );
      if (groupWalkinRows.length > 0) {
        mainVisitor = groupWalkinRows[0];
      }
    } else {
      // For other booking types, get from visitors table
      const [visitorRows] = await pool.query(
        `SELECT visitor_id, email, first_name, last_name, institution FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
        [id]
      );
      if (visitorRows.length > 0) {
        mainVisitor = visitorRows[0];
      }
    }
    
    if (!mainVisitor || !mainVisitor.email) {
      return res.json({ success: true, message: 'Booking approved, but no email sent (no visitor email found).' });
    }

    // 4. Check booking type first
    const [bookingType] = await pool.query(
      `SELECT type FROM bookings WHERE booking_id = ?`,
      [id]
    );
    const hasWalkInTokens = bookingType[0]?.type?.includes('walk-in') || false;

    // 5. Get companions (if any) - check both tables based on booking type
    let companionRows = [];
    
    if (hasWalkInTokens) {
      // For walk-in bookings, get from visitors table
      const [visitorCompanions] = await pool.query(
        `SELECT visitor_id as token_id, email FROM visitors WHERE booking_id = ? AND is_main_visitor = 0`,
        [id]
      );
      companionRows = visitorCompanions;
    } else {
      // For regular group bookings, get from additional_visitors table (tokens)
      const [tokenCompanions] = await pool.query(
        `SELECT token_id, email FROM additional_visitors WHERE booking_id = ?`,
        [id]
      );
      
      // If no tokens exist, create them now (for existing bookings)
      if (tokenCompanions.length === 0) {
        console.log('🔄 No tokens found, creating them for booking approval...');
        
        // Get additional visitors from visitors table
        const [additionalVisitors] = await pool.query(
          `SELECT email FROM visitors WHERE booking_id = ? AND is_main_visitor = 0`,
          [id]
        );
        
        // Create tokens for each additional visitor
        for (let i = 0; i < additionalVisitors.length; i++) {
          const visitor = additionalVisitors[i];
          const tokenId = `GROUP-${id}-${i + 1}`;
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
          
          await pool.query(
            `INSERT INTO additional_visitors (token_id, booking_id, email, expires_at) VALUES (?, ?, ?, ?)`,
            [tokenId, id, visitor.email, expiresAt]
          );
          
          console.log(`✅ Created token ${tokenId} for ${visitor.email}`);
        }
        
        // Re-query to get the newly created tokens
        const [newTokenCompanions] = await pool.query(
          `SELECT token_id, email FROM additional_visitors WHERE booking_id = ?`,
          [id]
        );
        companionRows = newTokenCompanions;
      } else {
        companionRows = tokenCompanions;
      }
    }

    // 5. Generate QR codes and prepare email content
    let emailContent = `Hi ${mainVisitor.first_name},\n\nYour museum visit is confirmed!\n\n`;
    let attachments = [];

    // Generate primary visitor QR code
    const checkinUrl = `http://localhost:3000/api/visit/checkin/${id}`;
    const qrDataUrl = await QRCode.toDataURL(checkinUrl);
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    attachments.push({
      filename: 'primary_visitor_qr.png',
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'image/png'
    });

    // Get primary visitor ID for backup code
    const [primaryVisitorRows] = await pool.query(
      `SELECT visitor_id FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
      [id]
    );
    
    const primaryVisitorId = primaryVisitorRows[0]?.visitor_id;

    emailContent += `📋 **Primary Visitor QR Code**: Please present this QR code at the museum for check-in.\n\n`;
    emailContent += `🔑 **Backup Code**: ${primaryVisitorId} (use if QR code doesn't work)\n\n`;

    // Create HTML version for primary visitor
    let emailHtml = `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎫 Museum Visit Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your booking has been approved</p>
        </div>
        
        <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${mainVisitor.first_name},</h2>
            <p style="font-size: 16px; margin-bottom: 25px;">Your museum visit is confirmed! We're excited to welcome you.</p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <h3 style="margin: 0 0 15px 0; color: #007bff;">📋 Your QR Code</h3>
                <p style="margin: 0; font-size: 14px;">Your QR code is attached to this email. Please present it at the museum entrance for check-in.</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <h3 style="margin: 0 0 15px 0; color: #856404;">🔑 Backup Code</h3>
                <p style="margin: 0 0 10px 0; font-size: 14px;">If your QR code doesn't work, use this backup code:</p>
                <div style="background: #f8f9fa; padding: 15px; text-align: center; margin: 10px 0; border-radius: 5px;">
                    <h2 style="color: #AB8841; font-size: 24px; margin: 0; letter-spacing: 3px; font-family: monospace;">${primaryVisitorId}</h2>
                </div>
                <p style="margin: 0; font-size: 12px; color: #856404;">
                    <strong>Important:</strong> This backup code expires in 24 hours. Use only if QR code scanning fails.
                </p>
            </div>
    `;

    // Generate companion QR codes if this is a group booking
    if (companionRows.length > 0) {
      emailContent += `👥 **Companions**: ${companionRows.length} additional visitor(s)\n\n`;
      emailContent += `📧 **Separate emails will be sent to each companion with their individual QR codes and form links.**\n\n`;
      
      // Add companion section to HTML email
      emailHtml += `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #856404;">👥 Group Visit Information</h3>
                <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Companions:</strong> ${companionRows.length} additional visitor(s)</p>
                <p style="margin: 0; font-size: 14px; color: #856404;">📧 Separate emails have been sent to each companion with their individual QR codes and form links.</p>
            </div>
      `;
      
      for (let i = 0; i < companionRows.length; i++) {
        const companion = companionRows[i];
        
        // Generate QR code data for companion
        const qrData = {
          type: 'additional_visitor',
          tokenId: companion.token_id, // Use tokenId for pre-generated QR codes
          bookingId: id,
          email: companion.email,
          visitDate: booking.date,
          visitTime: booking.time_slot,
          groupLeader: `${mainVisitor.first_name} ${mainVisitor.last_name}`
        };

        // Generate QR code image
        const companionQrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
        const companionBase64Data = companionQrDataUrl.replace(/^data:image\/png;base64,/, '');
        
        // Generate companion form link
        const companionFormUrl = `http://localhost:5173/additional-visitor?token=${companion.token_id}`;
        
        // Send separate email to each companion
        let companionEmailContent = `Hi,\n\nYou have been invited to join a museum visit!\n\n`;
        companionEmailContent += `📅 **Visit Details**:\n`;
        companionEmailContent += `   Date: ${booking.date}\n`;
        companionEmailContent += `   Time: ${booking.time_slot}\n`;
        companionEmailContent += `   Group Leader: ${mainVisitor.first_name} ${mainVisitor.last_name}\n\n`;
        companionEmailContent += `📋 **Your QR Code**: Attached to this email\n`;
        companionEmailContent += `🔑 **Backup Code**: ${companion.token_id} (use if QR code doesn't work)\n\n`;
        companionEmailContent += `🔗 **Complete Your Details**:\n`;
        companionEmailContent += `   Click here: ${companionFormUrl}\n\n`;
        companionEmailContent += `📝 **Important**: Please complete your details using the link above before your visit.\n\n`;
        companionEmailContent += `Thank you!\nMuseoSmart Team`;

        // Create HTML version with clickable link
        let companionEmailHtml = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>🎫 Museum Visit Invitation</h2>
            <p>Hi,</p>
            <p>You have been invited to join a museum visit!</p>
            
            <h3>📅 Visit Details:</h3>
            <ul>
                <li><strong>Date:</strong> ${booking.date}</li>
                <li><strong>Time:</strong> ${booking.time_slot}</li>
                <li><strong>Group Leader:</strong> ${mainVisitor.first_name} ${mainVisitor.last_name}</li>
            </ul>
            
            <h3>📋 Your QR Code</h3>
            <p>Your QR code is attached to this email.</p>
            
            <h3>🔑 Backup Code</h3>
            <p>If your QR code doesn't work, use this backup code:</p>
            <div style="background: #f8f9fa; padding: 15px; text-align: center; margin: 10px 0; border-radius: 5px;">
                <h2 style="color: #AB8841; font-size: 24px; margin: 0; letter-spacing: 3px; font-family: monospace;">${companion.visitor_id}</h2>
            </div>
            
            <h3>🔗 Complete Your Details</h3>
            <p>Please click the link below to complete your information:</p>
            <p style="margin: 20px 0;">
                <a href="${companionFormUrl}" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    📝 Complete My Details
                </a>
            </p>
            
            <p><strong>Important:</strong> Please complete your details using the link above before your visit.</p>
            
            <p>Thank you!<br>MuseoSmart Team</p>
        </body>
        </html>
        `;

        const companionAttachments = [{
          filename: `companion_${i + 1}_qr.png`,
          content: Buffer.from(companionBase64Data, 'base64'),
          contentType: 'image/png'
        }];

        // Backup code is already included in the email content above
        
        // Update companion HTML email to include backup code
        companionEmailHtml = companionEmailHtml.replace(
          '<p>Thank you!<br>MuseoSmart Team</p>',
          `<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">🔑 Backup Code</h4>
            <p style="margin: 0 0 10px 0; font-size: 14px;">If your QR code doesn't work, use this backup code:</p>
            <div style="background: #f8f9fa; padding: 10px; text-align: center; margin: 10px 0; border-radius: 5px;">
                <h2 style="color: #AB8841; font-size: 20px; margin: 0; letter-spacing: 2px; font-family: monospace;">${companion.token_id}</h2>
            </div>
            <p style="margin: 0; font-size: 12px; color: #856404;">
                <strong>Important:</strong> This backup code is shared for the entire group. Use only if QR code scanning fails.
            </p>
          </div>
          <p>Thank you!<br>MuseoSmart Team</p>`
        );

        // Send email to companion
        try {
          await transporter.sendMail({
            from: 'MuseoSmart <museoweb1@gmail.com>',
            to: companion.email,
            subject: 'Complete Your Museum Visit Details 🎫',
            text: companionEmailContent,
            html: companionEmailHtml,
            attachments: companionAttachments
          });
          console.log(`✅ Companion email sent to: ${companion.email}`);
        } catch (emailError) {
          console.log(`⚠️ Companion email failed for ${companion.email}:`, emailError.message);
          // Continue processing other companions
        }

        emailContent += `👤 **Companion ${i + 1} (${companion.email})**: Email sent with QR code and form link.\n`;
      }
      
      emailContent += `\n📝 **Note**: Each companion has received their own email with individual QR code and form link.\n\n`;
    }

    emailContent += `📅 **Visit Details**:\n`;
    emailContent += `   Date: ${booking.date}\n`;
    emailContent += `   Time: ${booking.time_slot}\n`;
    emailContent += `   Total Visitors: ${booking.total_visitors}\n\n`;
    emailContent += `📍 **Location**: Museum entrance\n`;
    emailContent += `⏰ **Please arrive 10 minutes before your scheduled time.**\n\n`;
    emailContent += `Thank you for choosing our museum!\n\n`;
    emailContent += `Best regards,\nMuseoSmart Team`;

    // Complete the HTML email
    emailHtml += `
            <div style="background: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 5px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #155724;">📅 Visit Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #c3e6c3;"><strong>Date:</strong></td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #c3e6c3;">${booking.date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #c3e6c3;"><strong>Time:</strong></td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #c3e6c3;">${booking.time_slot}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #c3e6c3;"><strong>Total Visitors:</strong></td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #c3e6c3;">${booking.total_visitors}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Location:</strong></td>
                        <td style="padding: 8px 0;">Museum entrance</td>
                    </tr>
                </table>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>⏰ Important:</strong> Please arrive 10 minutes before your scheduled time.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 10px 0; font-size: 16px;">Thank you for choosing our museum!</p>
                <p style="margin: 0; color: #666;">Best regards,<br><strong>MuseoSmart Team</strong></p>
            </div>
        </div>
    </body>
    </html>
    `;

    // 6. Send email based on booking type
    if (isWalkInScheduling || isIndWalkin) {
      // For individual walk-in, we don't need to find a token - the visitor is already in the visitors table
      if (isIndWalkin) {
        // Get form link for registration using visitor_id
        const walkInFormUrl = `http://localhost:5173/walkin-visitor?visitorId=${mainVisitor.visitor_id}`;
      
        // For individual walk-in, send single email with QR code, backup code, and form link
        // Generate QR code for immediate use
        const qrData = {
          type: 'walkin_visitor',
          visitorId: mainVisitor.visitor_id,
          bookingId: id,
          email: mainVisitor.email,
          visitDate: booking.date,
          visitTime: booking.time_slot,
          visitorName: `${mainVisitor.first_name} ${mainVisitor.last_name}`
        };
        
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
        
        // Create comprehensive email with QR code attachment
        const comprehensiveWalkInEmailHtml = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #AB8841 0%, #8B6B21 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🎫 Your Walk-In Visit is Ready!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Complete your registration and get your QR code</p>
            </div>
            
            <div style="padding: 30px; background: #faf7f1;">
                <h2 style="color: #2e2b41; margin-bottom: 20px;">Hello ${mainVisitor.first_name}!</h2>
                
                <p style="color: #2e2b41;">Your walk-in museum visit has been <strong>approved</strong> for <strong>${booking.date}</strong> at <strong>${booking.time_slot}</strong>.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #AB8841;">
                    <h3 style="color: #AB8841; margin-top: 0;">📋 Complete Your Registration</h3>
                    <p style="color: #2e2b41;">Please click the link below to complete your registration and get your QR code:</p>
                    <a href="${walkInFormUrl}" style="display: inline-block; background: #AB8841; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; transition: background-color 0.3s;">Complete My Registration</a>
                </div>
                
                <div style="background: #f5f4f7; border: 1px solid #2e2b41; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #2e2b41;">📅 Visit Details</h4>
                    <p style="color: #2e2b41;"><strong>Date:</strong> ${booking.date}</p>
                    <p style="color: #2e2b41;"><strong>Time:</strong> ${booking.time_slot}</p>
                    <p style="color: #2e2b41;"><strong>Booking ID:</strong> ${id}</p>
                    <p style="color: #2e2b41;"><strong>Status:</strong> ✅ Approved</p>
                </div>
                
                <div style="background: #fdf6e3; border: 1px solid #AB8841; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #8B6B21;">⏰ Important Notice</h4>
                    <p style="margin: 0; font-size: 14px; color: #8B6B21;">
                        <strong>24-Hour Expiration:</strong> This registration link will expire in 24 hours. Please complete your profile within this time.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #AB8841;">
                    <p style="margin: 0 0 10px 0; font-size: 16px; color: #2e2b41;">Please complete your registration as soon as possible.</p>
                    <p style="margin: 0; color: #AB8841;">Best regards,<br><strong>MuseoSmart Team</strong></p>
                </div>
            </div>
        </body>
        </html>
      `;
        
        // Send single email with QR code attachment and form link
        await transporter.sendMail({
          from: 'MuseoSmart <museoweb1@gmail.com>',
          to: mainVisitor.email,
          subject: '🎫 Your Walk-In Museum Visit - Complete Registration',
          html: comprehensiveWalkInEmailHtml,
          attachments: [{
            filename: 'walkin_qr_code.png',
            content: Buffer.from(base64Data, 'base64'),
            contentType: 'image/png'
          }]
        });
        
        console.log('✅ Single comprehensive individual walk-in email sent with QR code and form link');
      } else if (isWalkInScheduling) {
        // For walk-in scheduling, we need to find the walk-in token
        const walkInToken = companionRows.find(companion => 
          companion.token_id.startsWith('WALKIN-') || 
          companion.token_id.startsWith('INDWALKIN-')
        );
        
        if (walkInToken) {
          // Get form link for registration using token
          const walkInFormUrl = `http://localhost:5173/walkin-visitor?token=${walkInToken.token_id}`;
          
          // Generate QR code for immediate use
          const qrData = {
            type: 'walkin_visitor',
            tokenId: walkInToken.token_id,
            bookingId: id,
            email: mainVisitor.email,
            visitDate: booking.date,
            visitTime: booking.time_slot,
            visitorName: `${mainVisitor.first_name} ${mainVisitor.last_name}`
          };
          
          const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
          const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
          
          // Create comprehensive email with QR code attachment
          const comprehensiveWalkInEmailHtml = `
          <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #AB8841 0%, #8B6B21 100%); padding: 30px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 28px;">🎫 Your Walk-In Visit is Ready!</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px;">Complete your registration and get your QR code</p>
              </div>
              
              <div style="padding: 30px; background: #faf7f1;">
                  <h2 style="color: #2e2b41; margin-bottom: 20px;">Hello ${mainVisitor.first_name}!</h2>
                  
                  <p style="color: #2e2b41;">Your walk-in museum visit has been <strong>approved</strong> for <strong>${booking.date}</strong> at <strong>${booking.time_slot}</strong>.</p>
                  
                  <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #AB8841;">
                      <h3 style="color: #AB8841; margin-top: 0;">📋 Complete Your Registration</h3>
                      <p style="color: #2e2b41;">Please click the link below to complete your registration and get your QR code:</p>
                      <a href="${walkInFormUrl}" style="display: inline-block; background: #AB8841; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; transition: background-color 0.3s;">Complete My Registration</a>
                  </div>
                  
                  <div style="background: #f5f4f7; border: 1px solid #2e2b41; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <h4 style="margin-top: 0; color: #2e2b41;">📅 Visit Details</h4>
                      <p style="color: #2e2b41;"><strong>Date:</strong> ${booking.date}</p>
                      <p style="color: #2e2b41;"><strong>Time:</strong> ${booking.time_slot}</p>
                      <p style="color: #2e2b41;"><strong>Booking ID:</strong> ${id}</p>
                      <p style="color: #2e2b41;"><strong>Status:</strong> ✅ Approved</p>
                  </div>
                  
                  <div style="background: #fdf6e3; border: 1px solid #AB8841; border-radius: 5px; padding: 15px; margin: 20px 0;">
                      <h4 style="margin-top: 0; color: #8B6B21;">⏰ Important Notice</h4>
                      <p style="margin: 0; font-size: 14px; color: #8B6B21;">
                          <strong>24-Hour Expiration:</strong> This registration link will expire in 24 hours. Please complete your profile within this time.
                      </p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #AB8841;">
                      <p style="margin: 0 0 10px 0; font-size: 16px; color: #2e2b41;">Please complete your registration as soon as possible.</p>
                      <p style="margin: 0; color: #AB8841;">Best regards,<br><strong>MuseoSmart Team</strong></p>
                  </div>
              </div>
          </body>
          </html>
        `;
          
          // Send single email with QR code attachment and form link
          await transporter.sendMail({
            from: 'MuseoSmart <museoweb1@gmail.com>',
            to: mainVisitor.email,
            subject: '🎫 Your Walk-In Museum Visit - Complete Registration',
            html: comprehensiveWalkInEmailHtml,
            attachments: [{
              filename: 'walkin_qr_code.png',
              content: Buffer.from(base64Data, 'base64'),
              contentType: 'image/png'
            }]
          });
          
          console.log('✅ Single comprehensive walk-in scheduling email sent with QR code and form link');
        } else {
          console.log('⚠️ No walk-in token found for walk-in scheduling visitor');
        }
      }
    } else if (isGroupWalkin) {
      console.log('🎯 Processing group walk-in booking...');
      console.log('📧 Main visitor:', mainVisitor);
      console.log('👥 Companion rows:', companionRows.length);
      
      // UNIQUE GROUP WALK-IN LOGIC: Only primary visitor gets email with form link
      // Additional visitors will get QR codes directly when primary visitor completes form
      
      // For group walk-in, we already have mainVisitor from the visitors table
      if (mainVisitor && mainVisitor.visitor_id) {
        // Generate QR code for primary visitor
        const qrData = {
          type: 'walkin_visitor',
          visitorId: mainVisitor.visitor_id,
          bookingId: id,
          email: mainVisitor.email,
          visitDate: booking.date,
          visitTime: booking.time_slot,
          visitorName: `${mainVisitor.first_name} ${mainVisitor.last_name}`
        };
        
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
        
        // Generate backup code
        const backupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // For group walk-in, use visitor_id for the leader form
        const primaryFormUrl = `http://localhost:5173/group-walkin-leader?visitorId=${mainVisitor.visitor_id}`;
        
        const groupWalkInPrimaryEmailHtml = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #AB8841 0%, #8B6B21 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🎫 Your Group Walk-In Visit is Approved!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Complete your group leader registration to get QR codes for everyone</p>
            </div>
            
            <div style="padding: 30px; background: #faf7f1;">
                <h2 style="color: #2e2b41; margin-bottom: 20px;">Hello Group Leader!</h2>
                
                <p style="color: #2e2b41;">Your group walk-in museum visit has been <strong>approved</strong> for <strong>${booking.date}</strong> at <strong>${booking.time_slot}</strong>.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #AB8841;">
                    <h3 style="color: #AB8841; margin-top: 0;">📋 Complete Your Group Leader Registration</h3>
                    <p style="color: #2e2b41;">As the group leader, please complete your registration with ALL details including institution and purpose of visit. This information will be shared with all group members.</p>
                    <a href="${primaryFormUrl}" style="display: inline-block; background: #AB8841; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; transition: background-color 0.3s;">Complete Group Leader Registration</a>
                </div>
                
                <div style="background: #f5f4f7; border: 1px solid #2e2b41; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #2e2b41;">📅 Visit Details</h4>
                    <p style="color: #2e2b41;"><strong>Date:</strong> ${booking.date}</p>
                    <p style="color: #2e2b41;"><strong>Time:</strong> ${booking.time_slot}</p>
                    <p style="color: #2e2b41;"><strong>Booking ID:</strong> ${id}</p>
                    <p style="color: #2e2b41;"><strong>Group Size:</strong> ${companionRows.length} visitors</p>
                    <p style="color: #2e2b41;"><strong>Status:</strong> ✅ Approved</p>
                </div>
                
                <div style="background: #e8f4fd; border: 1px solid #AB8841; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #2e2b41;">👥 Group Information</h4>
                    <p style="margin: 0; font-size: 14px; color: #2e2b41;">
                        <strong>Important:</strong> After you complete your registration, all group members will automatically receive their QR codes via email. They will only need to provide their basic details (name, gender, address) - institution and purpose will be inherited from your information.
                    </p>
                </div>
                
                <div style="background: #fdf6e3; border: 1px solid #AB8841; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #8B6B21;">⏰ Important Notice</h4>
                    <p style="margin: 0; font-size: 14px; color: #8B6B21;">
                        <strong>24-Hour Expiration:</strong> This link will expire in 24 hours. Please complete your profile within this time to receive your QR code and send QR codes to group members.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #AB8841;">
                    <p style="margin: 0 0 10px 0; font-size: 16px; color: #2e2b41;">Please complete your profile as soon as possible to receive your QR code and send QR codes to group members.</p>
                    <p style="margin: 0; color: #AB8841;">Best regards,<br><strong>MuseoSmart Team</strong></p>
                </div>
            </div>
        </body>
        </html>
        `;
        
        await transporter.sendMail({
          from: 'MuseoSmart <museoweb1@gmail.com>',
          to: mainVisitor.email,
          subject: '🎫 Your Group Walk-In Museum Visit - Complete Group Leader Registration',
          html: groupWalkInPrimaryEmailHtml,
          attachments: [{
            filename: 'group_leader_qr_code.png',
            content: Buffer.from(base64Data, 'base64'),
            contentType: 'image/png'
          }]
        });
        
        // Store QR code and backup code in database
        await pool.query(
          `UPDATE visitors SET qr_code = ?, backup_code = ? WHERE visitor_id = ?`,
          [base64Data, backupCode, mainVisitor.visitor_id]
        );
        
        console.log('✅ Group walk-in leader email sent with QR code and form link');
        console.log('📧 Email sent to:', mainVisitor.email);
        console.log('🔗 Form URL:', primaryFormUrl);
      } else {
        console.log('❌ No mainVisitor or visitor_id found for group walk-in');
      }
    } else {
      // Send regular booking email
      try {
        await transporter.sendMail({
          from: 'MuseoSmart <museoweb1@gmail.com>',
          to: mainVisitor.email,
          subject: 'Your Museum Visit is Confirmed! 🎫',
          text: emailContent,
          html: emailHtml,
          attachments: attachments
        });
        console.log('✅ Main visitor email sent successfully');
      } catch (emailError) {
        console.log('⚠️ Email sending failed, but booking approved:', emailError.message);
        // Continue with success response even if email fails
      }
    }

    try { await logActivity(req, 'booking.approve', { bookingId: id, emailSent: true, companions: companionRows.length }); } catch {}
    res.json({ 
      success: true, 
      message: (isWalkInScheduling || isIndWalkin || isGroupWalkin) ? 
        'Walk-in booking approved and email sent with profile completion link (24-hour expiration)!' : 
        `Booking approved and email sent! ${companionRows.length > 0 ? `Generated ${companionRows.length} companion QR codes.` : ''}` 
    });
  } catch (err) {
    console.error('Error approving booking:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Cancel a booking
router.put('/bookings/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?`,
      [id]
    );
    try { await logActivity(req, 'booking.cancel', { bookingId: id }); } catch {}
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Reject a booking (distinct from cancel for audit semantics)
router.put('/bookings/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    // Use existing enum 'cancelled' to represent rejection in DB
    await pool.query(
      `UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?`,
      [id]
    );
    try { await logActivity(req, 'booking.reject', { bookingId: id }); } catch {}
    res.json({ success: true, message: 'Booking rejected successfully' });
  } catch (err) {
    console.error('Error rejecting booking:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a booking
router.delete('/bookings/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `DELETE FROM bookings WHERE booking_id = ?`,
      [id]
    );
    try { await logActivity(req, 'booking.delete', { bookingId: id }); } catch {}
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Check-in endpoint for QR code scanning
router.get('/visit/checkin/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Get booking information
    const [bookingRows] = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = ?`,
      [id]
    );
    
    if (bookingRows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookingRows[0];
    
    console.log('Booking found:', {
      booking_id: booking.booking_id,
      status: booking.status,
      first_name: booking.first_name,
      last_name: booking.last_name
    });
    
    // Check if booking is valid for check-in
    if (booking.status === 'cancelled') {
      return res.status(400).json({ 
        error: 'Booking has been cancelled', 
        status: booking.status 
      });
    }
    
    if (booking.status === 'checked-in') {
      return res.status(400).json({ 
        error: 'Visitor has already been checked in', 
        status: booking.status 
      });
    }
    
    // Get visitor information
    const [visitorRows] = await pool.query(
      `SELECT * FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
      [id]
    );
    
    let visitor = null;
    if (visitorRows.length > 0) {
      visitor = visitorRows[0];
      console.log('🔍 Primary visitor data from database:', {
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        email: visitor.email,
        gender: visitor.gender,
        visitor_type: visitor.visitor_type,
        address: visitor.address,
        institution: visitor.institution,
        purpose: visitor.purpose,
        is_main_visitor: visitor.is_main_visitor
      });
    } else {
      console.log('❌ No primary visitor found for booking ID:', id);
    }
    
    // Update visitor status and check-in time
    if (visitor) {
      await pool.query(
        `UPDATE visitors SET status = 'visited', checkin_time = NOW() WHERE visitor_id = ?`,
        [visitor.visitor_id]
      );
    }
    
    // Check if all visitors for this booking are checked in
    const [allVisitors] = await pool.query(
      `SELECT 
        COUNT(*) as total_visitors,
        COUNT(CASE WHEN status = 'visited' THEN 1 END) as checked_in_visitors
      FROM visitors 
      WHERE booking_id = ?`,
      [id]
    );
    
    const visitorCount = allVisitors[0];
    
    // If all visitors are checked in, update booking status to 'checked-in'
    if (visitorCount.total_visitors > 0 && visitorCount.checked_in_visitors >= visitorCount.total_visitors) {
      await pool.query(
        `UPDATE bookings SET status = 'checked-in', checkin_time = NOW() WHERE booking_id = ?`,
        [id]
      );
    }
    
    try { await logActivity(req, 'visitor.checkin', { bookingId: id, visitorId: visitor?.visitor_id }); } catch {}
    
    // Get the actual check-in time that was just set
    const [checkinTimeResult] = await pool.query(
      `SELECT checkin_time FROM visitors WHERE visitor_id = ?`,
      [visitor.visitor_id]
    );
    
    const actualCheckinTime = checkinTimeResult[0]?.checkin_time;
    
    res.json({
      success: true,
      message: 'Primary visitor checked in successfully!',
      visitor: visitor ? {
        firstName: visitor.first_name,
        lastName: visitor.last_name,
        email: visitor.email,
        gender: visitor.gender,
        visitorType: visitor.visitor_type,
        visitorCategory: 'primary_visitor',
        address: visitor.address,
        institution: visitor.institution || 'N/A',
        purpose: visitor.purpose || 'N/A',
        visitDate: booking.date,
        visitTime: booking.time_slot,
        checkin_time: actualCheckinTime ? actualCheckinTime.toISOString() : new Date().toISOString()
      } : null
    });
    
  } catch (err) {
    console.error('Error during check-in:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Unified QR scanning endpoint for group members and legacy primary visitors
router.post('/visit/qr-scan', async (req, res) => {
  const { qrData } = req.body;
  
  if (!qrData) {
    return res.status(400).json({ 
      success: false, 
      error: 'QR data is required' 
    });
  }

  try {
    const qrInfo = JSON.parse(qrData);
    
    if (qrInfo.type === 'additional_visitor') {
      // UNIFIED LOGIC FOR ALL VISITORS (now using visitors table)
      const { visitorId, tokenId } = qrInfo;
      
      console.log('🎯 Processing Additional Visitor QR Code:', { visitorId, tokenId });
      console.log('🔍 QR Code Data:', qrInfo);
      
      let visitorRows;
      
      if (visitorId) {
        // New QR codes with visitorId - fetch complete visitor data
        [visitorRows] = await pool.query(
          `SELECT 
            v.visitor_id,
            v.first_name,
            v.last_name,
            v.gender,
            v.address,
            v.email,
            v.visitor_type,
            v.purpose,
            v.institution,
            v.status,
            v.checkin_time,
            v.is_main_visitor,
            b.date as visit_date, 
            b.time_slot, 
            b.status as booking_status
           FROM visitors v
           JOIN bookings b ON v.booking_id = b.booking_id
           WHERE v.visitor_id = ? AND v.is_main_visitor = false`,
          [visitorId]
        );
      } else if (tokenId) {
        // Legacy QR codes with tokenId - find visitor by email from token
        const [tokenRows] = await pool.query(
          `SELECT email FROM additional_visitors WHERE token_id = ?`,
          [tokenId]
        );
        
        if (tokenRows.length === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Token not found or expired' 
          });
        }
        
        const tokenEmail = tokenRows[0].email;
        
        [visitorRows] = await pool.query(
          `SELECT 
            v.visitor_id,
            v.first_name,
            v.last_name,
            v.gender,
            v.address,
            v.email,
            v.visitor_type,
            v.purpose,
            v.institution,
            v.status,
            v.checkin_time,
            v.is_main_visitor,
            b.date as visit_date, 
            b.time_slot, 
            b.status as booking_status
           FROM visitors v
           JOIN bookings b ON v.booking_id = b.booking_id
           WHERE v.email = ? AND v.is_main_visitor = false
           ORDER BY v.visitor_id DESC LIMIT 1`,
          [tokenEmail]
        );
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid QR code format' 
        });
      }
      
      if (visitorRows.length === 0) {
        console.log('❌ No visitor found with the given criteria');
        return res.status(404).json({ 
          success: false, 
          error: 'Additional visitor not found' 
        });
      }
      
      console.log('✅ Found visitor record:', visitorRows.length, 'records');
      
      const visitor = visitorRows[0];
      console.log('📋 Visitor Info:', {
        visitor_id: visitor.visitor_id,
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        gender: visitor.gender,
        address: visitor.address,
        visitor_type: visitor.visitor_type,
        institution: visitor.institution,
        purpose: visitor.purpose,
        status: visitor.status,
        booking_status: visitor.booking_status,
        email: visitor.email
      });
      
      // Check if booking is valid
      if (visitor.booking_status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          error: 'This booking has been cancelled and cannot be checked in.',
          status: visitor.booking_status 
        });
      }
      
      // Check if QR code has already been used (PREVENT RE-SCANNING)
      if (visitor.qr_used === 1 || visitor.qr_used === true) {
        return res.status(400).json({ 
          success: false, 
          error: 'This QR code has already been used and cannot be scanned again.',
          qrUsed: true
        });
      }
      
      // Check if already checked in (PREVENT RE-SCANNING)
      if (visitor.status === 'visited') {
        return res.status(400).json({ 
          success: false, 
          error: 'This visitor has already been checked in.',
          status: visitor.status,
          alreadyCheckedIn: true
        });
      }
      
      // STEP 1: Update visitors table with check-in time and mark QR as used
      console.log('⏰ Setting check-in time for additional visitor and marking QR as used...');
      await pool.query(
        `UPDATE visitors 
         SET status = 'visited', checkin_time = NOW(), qr_used = TRUE
         WHERE visitor_id = ?`,
        [visitor.visitor_id]
      );
      
      // STEP 2: Get the actual check-in time that was just set
      const [checkinTimeResult] = await pool.query(
        `SELECT checkin_time FROM visitors WHERE visitor_id = ?`,
        [visitor.visitor_id]
      );
      
      const actualCheckinTime = checkinTimeResult[0].checkin_time;
      console.log('📅 Actual check-in time:', actualCheckinTime);
      
      // STEP 3: Check if all visitors are checked in (for booking status)
      const [allVisitors] = await pool.query(
        `SELECT 
          COUNT(*) as total_visitors,
          COUNT(CASE WHEN status = 'visited' THEN 1 END) as checked_in_visitors
        FROM visitors 
        WHERE booking_id = ?`,
        [visitor.booking_id]
      );
      
      const visitorCount = allVisitors[0];
      console.log('📊 Visitor Count:', {
        total: visitorCount.total_visitors,
        checkedIn: visitorCount.checked_in_visitors
      });
      
      // If all visitors are checked in, update booking status
      if (visitorCount.total_visitors > 0 && visitorCount.checked_in_visitors >= visitorCount.total_visitors) {
        await pool.query(
          `UPDATE bookings SET status = 'checked-in' WHERE booking_id = ?`,
          [visitor.booking_id]
        );
        console.log('✅ All visitors checked in - updated booking status');
      }
      
      // STEP 4: Log activity
      try { 
        await logActivity(req, 'visitor.checkin', { visitorId: visitor.visitor_id, bookingId: visitor.booking_id }); 
      } catch (error) {
        console.log('⚠️ Activity logging failed:', error.message);
      }
      
      // STEP 5: Return success response
      res.json({
        success: true,
        message: 'Additional visitor checked in successfully!',
        visitor: {
          firstName: visitor.first_name,
          lastName: visitor.last_name,
          email: visitor.email,
          gender: visitor.gender,
          visitorType: visitor.visitor_type,
          visitorCategory: 'additional_visitor',
          address: visitor.address,
          institution: visitor.institution || 'N/A',
          purpose: visitor.purpose || 'N/A',
          visitDate: visitor.visit_date,
          visitTime: visitor.time_slot,
          checkin_time: actualCheckinTime ? actualCheckinTime.toISOString() : new Date().toISOString()
        }
      });
      
      console.log('🎉 Additional visitor check-in completed successfully!');
      
    } else if (qrInfo.type === 'primary_visitor') {
      // Handle legacy primary visitor QR code
      const { visitorId } = qrInfo;
      
      // Get visitor information
      const [visitorRows] = await pool.query(
        `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status
         FROM visitors v
         JOIN bookings b ON v.booking_id = b.booking_id
         WHERE v.visitor_id = ? AND v.is_main_visitor = true`,
        [visitorId]
      );
      
      if (visitorRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Primary visitor not found' 
        });
      }
      
      const visitor = visitorRows[0];
      console.log('🔍 Primary visitor data from database:', {
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        email: visitor.email,
        gender: visitor.gender,
        visitor_type: visitor.visitor_type,
        address: visitor.address,
        institution: visitor.institution,
        purpose: visitor.purpose,
        visit_date: visitor.visit_date,
        time_slot: visitor.time_slot
      });
      
      // Check if booking is valid
      if (visitor.booking_status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          error: 'This booking has been cancelled and cannot be checked in.',
          status: visitor.booking_status 
        });
      }
      
      // Check if QR code has already been used (PREVENT RE-SCANNING)
      if (visitor.qr_used === 1 || visitor.qr_used === true) {
        return res.status(400).json({ 
          success: false, 
          error: 'This QR code has already been used and cannot be scanned again.',
          qrUsed: true
        });
      }
      
      if (visitor.status === 'visited') {
        return res.status(400).json({ 
          success: false, 
          error: 'This visitor has already been checked in.',
          status: visitor.status 
        });
      }
      
      // Update visitor status to visited, set check-in time, and mark QR as used
      await pool.query(
        `UPDATE visitors SET status = 'visited', checkin_time = NOW(), qr_used = TRUE WHERE visitor_id = ?`,
        [visitorId]
      );
      
      // Check if all visitors for this booking are checked in
      const [allVisitors] = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = 1) as main_visitors,
          (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = 1 AND status = 'visited') as main_checked_in,
          (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = 0) as additional_visitors,
          (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = 0 AND status = 'visited') as additional_checked_in
        `,
        [visitor.booking_id, visitor.booking_id, visitor.booking_id, visitor.booking_id]
      );
      
      const visitorCount = allVisitors[0];
      const totalVisitors = visitorCount.main_visitors + visitorCount.additional_visitors;
      const checkedInVisitors = visitorCount.main_checked_in + visitorCount.additional_checked_in;
      
      // If all visitors are checked in, update booking status to 'checked-in'
      if (totalVisitors > 0 && checkedInVisitors >= totalVisitors) {
        await pool.query(
          `UPDATE bookings SET status = 'checked-in', checkin_time = NOW() WHERE booking_id = ?`,
          [visitor.booking_id]
        );
      }
      
      try { await logActivity(req, 'visitor.checkin', { bookingId: visitor.booking_id, visitorId }); } catch {}
      
      // Get the actual check-in time from the database
      const [checkinTimeResult] = await pool.query(
        `SELECT checkin_time FROM visitors WHERE visitor_id = ?`,
        [visitorId]
      );
      
      const actualCheckinTime = checkinTimeResult[0].checkin_time;
      
      const responseData = {
        success: true,
        message: 'Primary visitor checked in successfully!',
        visitor: {
          firstName: visitor.first_name,
          lastName: visitor.last_name,
          email: visitor.email,
          gender: visitor.gender,
          visitorType: visitor.visitor_type,
          visitorCategory: 'primary_visitor',
          address: visitor.address,
          institution: visitor.institution || 'N/A',
          purpose: visitor.purpose || 'N/A',
          visitDate: visitor.visit_date,
          visitTime: visitor.time_slot,
          checkin_time: actualCheckinTime ? actualCheckinTime.toISOString() : new Date().toISOString()
        }
      };
      
      console.log('🔍 Primary visitor response data:', responseData);
      
      res.json(responseData);
      
         } else if (qrInfo.type === 'walkin_visitor') {
           // Handle walk-in visitor QR code
           const { visitorId } = qrInfo;
           
           console.log('🎯 Processing Walk-in Visitor QR Code:', visitorId);
           
           // Determine which check-in endpoint to use based on visitor type
           let checkinUrl;
           if (visitorId.toString().startsWith('GROUP-') || visitorId.toString().includes('WALKIN-')) {
             // Additional visitor or group walk-in - use walkin-visitors endpoint
             checkinUrl = `${req.protocol}://${req.get('host')}/api/walkin-visitors/${visitorId}/checkin`;
           } else {
             // Individual walk-in visitor - use individual-walkin endpoint
             checkinUrl = `${req.protocol}://${req.get('host')}/api/individual-walkin/${visitorId}/checkin`;
           }
           console.log('🌐 Walk-in check-in URL:', checkinUrl);
           
           const checkinResponse = await fetch(checkinUrl, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             }
           });
           
           console.log('📡 Walk-in check-in response status:', checkinResponse.status);
           
           if (!checkinResponse.ok) {
             const errorData = await checkinResponse.json();
             console.error('❌ Walk-in check-in failed:', errorData);
             return res.status(checkinResponse.status).json({
               success: false,
               error: errorData.error || 'Failed to check in walk-in visitor'
             });
           }
           
           const checkinData = await checkinResponse.json();
           console.log('✅ Walk-in check-in success:', checkinData);
           
           res.json({
             success: true,
             message: checkinData.message,
             visitor: checkinData.visitor
           });
           
         } else if (qrInfo.type === 'group_walkin_visitor') {
           // Handle group walk-in visitor QR code
           const { tokenId } = qrInfo;
           
           console.log('🎯 Processing Group Walk-in Visitor QR Code:', tokenId);
           
           // Use the new group-walkin-visitors endpoint
           const checkinUrl = `${req.protocol}://${req.get('host')}/api/group-walkin-visitors/${tokenId}/checkin`;
           console.log('🌐 Group walk-in check-in URL:', checkinUrl);
           
           const checkinResponse = await fetch(checkinUrl, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             }
           });
           
           console.log('📡 Group walk-in check-in response status:', checkinResponse.status);
           
           if (!checkinResponse.ok) {
             const errorData = await checkinResponse.json();
             console.error('❌ Group walk-in check-in failed:', errorData);
             return res.status(checkinResponse.status).json({
               success: false,
               error: errorData.message || 'Failed to check in group walk-in visitor'
             });
           }
           
           const checkinData = await checkinResponse.json();
           console.log('✅ Group walk-in check-in success:', checkinData);
           
           res.json({
             success: true,
             message: checkinData.message,
             visitor: checkinData.visitor
           });
           
         } else {
       return res.status(400).json({ 
         success: false, 
         error: 'Invalid QR code type. Expected "additional_visitor", "primary_visitor", "walkin_visitor", or "group_walkin_visitor".' 
       });
     }
    
  } catch (err) {
    console.error('Error processing QR scan:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process QR code: ' + err.message 
    });
  }
});

module.exports = router;
