const express = require('express');
const pool = require('../db');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');
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
  const { type, mainVisitor, companions, totalVisitors, date, time } = req.body;
  if (!date || !time || !mainVisitor || !totalVisitors) return res.status(400).json({ error: 'Missing data' });

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

    // Insert booking
    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (first_name, last_name, type, status, date, time_slot, total_visitors) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        mainVisitor.firstName,
        mainVisitor.lastName,
        type === 'group' ? 'group' : 'individual',
        'pending',
        date,
        time,
        totalVisitors
      ]
    );
    const bookingId = bookingResult.insertId;

    // Insert main visitor
    const [mainVisitorResult] = await conn.query(
      `INSERT INTO visitors (booking_id, first_name, last_name, gender, address, email, nationality, purpose, institution, status, is_main_visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [bookingId, mainVisitor.firstName, mainVisitor.lastName, mainVisitor.gender, mainVisitor.address, mainVisitor.email, mainVisitor.nationality, mainVisitor.purpose || 'other', mainVisitor.institution || null, 'pending']
    );
    const mainVisitorId = mainVisitorResult.insertId;

    // Handle companions (only emails provided)
    let companionTokens = [];
    if (type === 'group' && Array.isArray(companions)) {
      for (let i = 0; i < companions.length; i++) {
        const companion = companions[i];
        
        // Generate unique token
        const tokenId = `ADD-BOOK${bookingId}-${i + 1}`;
        
        // Insert companion token record
        await conn.query(
          `INSERT INTO additional_visitors (token_id, booking_id, email) VALUES (?, ?, ?)`,
          [tokenId, bookingId, companion.email]
        );
        
        companionTokens.push({
          tokenId,
          email: companion.email
        });
      }
    }

    conn.release();
    try { await logActivity(req, 'booking.create', { bookingId, date, time, totalVisitors, companions: companionTokens.length }); } catch {}
    res.json({ 
      success: true, 
      bookingId, 
      visitorIds: [mainVisitorId], 
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
      `SELECT * FROM bookings ORDER BY date DESC, time_slot`
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

    // 3. Get main visitor's email, name, and institution
    const [visitorRows] = await pool.query(
      `SELECT email, first_name, last_name, institution FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
      [id]
    );
    if (!visitorRows.length || !visitorRows[0].email) {
      return res.json({ success: true, message: 'Booking approved, but no email sent (no visitor email found).' });
    }
    const mainVisitor = visitorRows[0];

    // 4. Get companions (if any)
    const [companionRows] = await pool.query(
      `SELECT token_id, email FROM additional_visitors WHERE booking_id = ?`,
      [id]
    );

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

    emailContent += `📋 **Primary Visitor QR Code**: Please present this QR code at the museum for check-in.\n\n`;

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
        
        // Generate QR code data for companion (token-based)
        const qrData = {
          type: 'additional_visitor',
          tokenId: companion.token_id,
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

        // Send email to companion
        await transporter.sendMail({
          from: 'MuseoSmart <museoweb1@gmail.com>',
          to: companion.email,
          subject: 'Complete Your Museum Visit Details 🎫',
          text: companionEmailContent,
          html: companionEmailHtml,
          attachments: companionAttachments
        });

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

    // 6. Send email with all QR codes
    await transporter.sendMail({
      from: 'MuseoSmart <museoweb1@gmail.com>',
      to: mainVisitor.email,
      subject: 'Your Museum Visit is Confirmed! 🎫',
      text: emailContent,
      html: emailHtml,
      attachments: attachments
    });

    try { await logActivity(req, 'booking.approve', { bookingId: id, emailSent: true, companions: companionRows.length }); } catch {}
    res.json({ 
      success: true, 
      message: `Booking approved and email sent! ${companionRows.length > 0 ? `Generated ${companionRows.length} companion QR codes.` : ''}` 
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
router.delete('/bookings/:id', async (req, res) => {
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
    }
    
    // Update visitor status
    if (visitor) {
      await pool.query(
        `UPDATE visitors SET status = 'visited' WHERE visitor_id = ?`,
        [visitor.visitor_id]
      );
    }
    
    // Check if all visitors for this booking are checked in
    const [allVisitors] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = true) as main_visitors,
        (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = true AND status = 'visited') as main_checked_in,
        (SELECT COUNT(*) FROM additional_visitors WHERE booking_id = ?) as additional_visitors,
        (SELECT COUNT(*) FROM additional_visitors WHERE booking_id = ? AND status = 'checked-in') as additional_checked_in
      `,
      [id, id, id, id]
    );
    
    const visitorCount = allVisitors[0];
    const totalVisitors = visitorCount.main_visitors + visitorCount.additional_visitors;
    const checkedInVisitors = visitorCount.main_checked_in + visitorCount.additional_checked_in;
    
    // If all visitors are checked in, update booking status to 'checked-in'
    if (totalVisitors > 0 && checkedInVisitors >= totalVisitors) {
      await pool.query(
        `UPDATE bookings SET status = 'checked-in', checkin_time = NOW() WHERE booking_id = ?`,
        [id]
      );
    }
    
    try { await logActivity(req, 'visitor.checkin', { bookingId: id, visitorId: visitor?.visitor_id }); } catch {}
    
    res.json({
      success: true,
      message: 'Check-in successful!',
      booking: {
        id: booking.booking_id,
        name: `${booking.first_name} ${booking.last_name}`,
        date: booking.date,
        time: booking.time_slot,
        type: booking.type,
        totalVisitors: booking.total_visitors
      },
      visitor: visitor ? {
        id: visitor.visitor_id,
        name: `${visitor.first_name} ${visitor.last_name}`,
        email: visitor.email,
        gender: visitor.gender,
        nationality: visitor.nationality,
        purpose: visitor.purpose
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
      // Handle additional visitor QR code (token-based)
      const { tokenId } = qrInfo;
      
      // Get additional visitor information
      const [tokenRows] = await pool.query(
        `SELECT av.*, b.date as visit_date, b.time_slot, b.status as booking_status
         FROM additional_visitors av
         JOIN bookings b ON av.booking_id = b.booking_id
         WHERE av.token_id = ?`,
        [tokenId]
      );
      
      if (tokenRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Additional visitor token not found' 
        });
      }
      
      const tokenInfo = tokenRows[0];
      
      // Check if booking is valid
      if (tokenInfo.booking_status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          error: 'This booking has been cancelled and cannot be checked in.',
          status: tokenInfo.booking_status 
        });
      }
      
      // Check if details are completed
      if (tokenInfo.status !== 'completed') {
        return res.status(400).json({ 
          success: false, 
          error: 'Visitor details must be completed before check-in.',
          status: tokenInfo.status 
        });
      }
      
      // Check if already checked in
      if (tokenInfo.status === 'checked-in') {
        return res.status(400).json({ 
          success: false, 
          error: 'This visitor has already been checked in.',
          status: tokenInfo.status 
        });
      }
      
      // Update status to checked-in
      await pool.query(
        `UPDATE additional_visitors 
         SET status = 'checked-in', checkin_time = NOW()
         WHERE token_id = ?`,
        [tokenId]
      );
      
      // Parse details
      const details = tokenInfo.details ? JSON.parse(tokenInfo.details) : {};
      
      // Also insert into visitors table for admin dashboard visibility
      await pool.query(
        `INSERT INTO visitors (
          booking_id, first_name, last_name, gender, address, email, 
          nationality, purpose, institution, status, is_main_visitor, 
          checked_in_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'visited', false, ?, NOW())`,
        [
          tokenInfo.booking_id,
          details.firstName || '',
          details.lastName || '',
          details.gender || '',
          details.address || '',
          tokenInfo.email,
          details.nationality || '',
          details.purpose || 'educational',
          details.institution || '',
          req.user?.user_ID || null
        ]
      );
      
      // Check if all visitors for this booking are checked in
      const [allVisitors] = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = true) as main_visitors,
          (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = true AND status = 'visited') as main_checked_in,
          (SELECT COUNT(*) FROM additional_visitors WHERE booking_id = ?) as additional_visitors,
          (SELECT COUNT(*) FROM additional_visitors WHERE booking_id = ? AND status = 'checked-in') as additional_checked_in
        `,
        [tokenInfo.booking_id, tokenInfo.booking_id, tokenInfo.booking_id, tokenInfo.booking_id]
      );
      
      const visitorCount = allVisitors[0];
      const totalVisitors = visitorCount.main_visitors + visitorCount.additional_visitors;
      const checkedInVisitors = visitorCount.main_checked_in + visitorCount.additional_checked_in;
      
      // If all visitors are checked in, update booking status to 'checked-in'
      if (totalVisitors > 0 && checkedInVisitors >= totalVisitors) {
        await pool.query(
          `UPDATE bookings SET status = 'checked-in', checkin_time = NOW() WHERE booking_id = ?`,
          [tokenInfo.booking_id]
        );
      }
      
      try { await logActivity(req, 'additional_visitor.checkin', { tokenId, bookingId: tokenInfo.booking_id }); } catch {}
      
      res.json({
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
          groupLeader: qrInfo.groupLeader || 'N/A',
          visitDate: tokenInfo.visit_date,
          visitTime: tokenInfo.time_slot,
          checkin_time: new Date().toISOString()
        }
      });
      
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
      
      // Check if booking is valid
      if (visitor.booking_status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          error: 'This booking has been cancelled and cannot be checked in.',
          status: visitor.booking_status 
        });
      }
      
      if (visitor.status === 'visited') {
        return res.status(400).json({ 
          success: false, 
          error: 'This visitor has already been checked in.',
          status: visitor.status 
        });
      }
      
      // Update visitor status to visited
      await pool.query(
        `UPDATE visitors SET status = 'visited' WHERE visitor_id = ?`,
        [visitorId]
      );
      
      // Check if all visitors for this booking are checked in
      const [allVisitors] = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = true) as main_visitors,
          (SELECT COUNT(*) FROM visitors WHERE booking_id = ? AND is_main_visitor = true AND status = 'visited') as main_checked_in,
          (SELECT COUNT(*) FROM additional_visitors WHERE booking_id = ?) as additional_visitors,
          (SELECT COUNT(*) FROM additional_visitors WHERE booking_id = ? AND status = 'checked-in') as additional_checked_in
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
      
      res.json({
        success: true,
        message: 'Primary visitor checked in successfully!',
        visitor: {
          first_name: visitor.first_name,
          last_name: visitor.last_name,
          email: visitor.email,
          gender: visitor.gender,
          nationality: visitor.nationality,
          address: visitor.address,
          visit_date: visitor.visit_date,
          visit_time: visitor.time_slot,
          checkin_time: new Date().toISOString()
        }
      });
      
         } else {
       return res.status(400).json({ 
         success: false, 
         error: 'Invalid QR code type. Expected "additional_visitor" or "primary_visitor".' 
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
