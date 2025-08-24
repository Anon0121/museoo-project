const express = require('express');
const pool = require('../db');
const router = express.Router();
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const { logActivity } = require('../utils/activityLogger');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'museosmart@gmail.com',
    pass: 'museosmart123'
  }
});

// Get group walk-in visitor token info
router.get('/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  
  try {
    // Get token information with booking details and group leader info
    const [tokenRows] = await pool.query(
      `SELECT av.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.booking_id, b.type as booking_type,
              v.institution as group_leader_institution, v.purpose as group_leader_purpose
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       LEFT JOIN visitors v ON b.booking_id = v.booking_id AND v.is_main_visitor = 1
       WHERE av.token_id = ?`,
      [tokenId]
    );
    
    if (tokenRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Token not found or expired'
      });
    }
    
    const tokenInfo = tokenRows[0];
    
    // Check if booking is still valid
    if (tokenInfo.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled'
      });
    }
    
    // Check if token has expired (for walk-in types)
    if (tokenInfo.expires_at && new Date() > new Date(tokenInfo.expires_at)) {
      return res.status(400).json({
        success: false,
        error: 'This link has expired. Please contact the museum for assistance.',
        linkExpired: true
      });
    }
    
    res.json({
      success: true,
      tokenInfo: {
        tokenId: tokenInfo.token_id,
        email: tokenInfo.email,
        status: tokenInfo.status,
        visitDate: tokenInfo.visit_date,
        visitTime: tokenInfo.time_slot,
        bookingId: tokenInfo.booking_id,
        bookingType: tokenInfo.booking_type,
        linkExpired: tokenInfo.expires_at ? (new Date() > new Date(tokenInfo.expires_at)) : false,
        details: tokenInfo.details ? JSON.parse(tokenInfo.details) : null,
        groupLeaderInstitution: tokenInfo.group_leader_institution,
        groupLeaderPurpose: tokenInfo.group_leader_purpose
      }
    });
    
  } catch (err) {
    console.error('Error fetching token info:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token information'
    });
  }
});

// Update group walk-in visitor details and generate QR code
router.put('/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  const { firstName, lastName, gender, address, visitorType, institution, purpose } = req.body;
  
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // First, get token information
    const [tokenRows] = await connection.query(
      `SELECT av.*, b.status as booking_status, b.booking_id, b.type as booking_type, b.date as visit_date, b.time_slot
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       WHERE av.token_id = ?`,
      [tokenId]
    );
    
    if (tokenRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Token not found or expired'
      });
    }
    
    const tokenInfo = tokenRows[0];
    
    // Check if booking is still valid
    if (tokenInfo.booking_status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled'
      });
    }
    
    // Check if already completed
    if (tokenInfo.status === 'completed') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Profile has already been completed'
      });
    }
    
    // Store visitor information in the details column as JSON
    const visitorDetails = {
      firstName,
      lastName,
      address,
      institution,
      purpose,
      gender,
      visitorType,
      completedAt: new Date().toISOString()
    };
    
    // Update the additional_visitors record with visitor information
    await connection.execute(
      `UPDATE additional_visitors 
       SET details = ?, status = 'completed', details_completed_at = NOW()
       WHERE token_id = ?`,
      [JSON.stringify(visitorDetails), tokenId]
    );
    
         // Create a visitor record
     const [visitorResult] = await connection.execute(
       `INSERT INTO visitors (
         booking_id, first_name, last_name, email, gender, visitor_type, 
         address, institution, purpose, status, 
         is_main_visitor, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
       [
         tokenInfo.booking_id,
         firstName,
         lastName,
         tokenInfo.email,
         gender,
         visitorType,
         address,
         institution,
         purpose,
         'pending',
         0
       ]
     );
    
    const visitorId = visitorResult.insertId;
    
    // Generate QR code for this visitor
    const qrData = {
      type: 'walkin_visitor',
      visitorId: visitorId,
      bookingId: tokenInfo.booking_id
    };
    
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
    
    // Update visitors table with QR code
    await connection.execute(
      `UPDATE visitors SET qr_code = ? WHERE visitor_id = ?`,
      [qrCodeDataUrl, visitorId]
    );
    
    // Use visitor ID as backup code
    const backupCode = visitorId;
    
    // Send email with QR code
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background: linear-gradient(135deg, #AB8841 0%, #2e2b41 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Museum Visit Confirmation</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your group walk-in visit is confirmed!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #2e2b41; margin-top: 0;">Hello ${firstName} ${lastName},</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Thank you for completing your profile information. Your group walk-in museum visit has been confirmed!
          </p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #AB8841; padding: 15px; margin: 20px 0;">
            <h3 style="color: #2e2b41; margin-top: 0;">Visit Details:</h3>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${tokenInfo.visit_date}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${tokenInfo.time_slot}</p>
            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${purpose}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <h3 style="color: #2e2b41;">Your QR Code</h3>
            <img src="${qrCodeDataUrl}" alt="QR Code" style="max-width: 200px; border: 2px solid #AB8841; border-radius: 10px;"/>
            <p style="color: #666; font-size: 14px; margin-top: 10px;">
              Present this QR code at the museum entrance for check-in
            </p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; margin: 25px 0; border-radius: 5px;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">🔑 Backup Code</h3>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #2e2b41;">If your QR code doesn't work, use this backup code:</p>
            <div style="background: #f8f9fa; padding: 15px; text-align: center; margin: 10px 0; border-radius: 5px;">
                <h2 style="color: #AB8841; font-size: 24px; margin: 0; letter-spacing: 3px; font-family: monospace;">${backupCode}</h2>
            </div>
            <p style="margin: 0; font-size: 12px; color: #856404;">
                <strong>Important:</strong> Use this backup code only if QR code scanning fails.
            </p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">Important Information:</h4>
            <ul style="color: #856404; margin: 5px 0; padding-left: 20px;">
              <li>Please arrive 10 minutes before your scheduled time</li>
              <li>Bring a valid ID for verification</li>
              <li>Follow all museum guidelines and safety protocols</li>
              <li>This QR code is unique to you and cannot be shared</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              If you have any questions, please contact us at museosmart@gmail.com
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>© 2024 Museum Smart System. All rights reserved.</p>
        </div>
      </div>
    `;
    
    const mailOptions = {
      from: 'museosmart@gmail.com',
      to: tokenInfo.email,
      subject: 'Museum Visit Confirmation - Group Walk-in',
      html: emailContent
    };
    
    await transporter.sendMail(mailOptions);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Group walk-in profile completed successfully! Check your email for QR code.',
             visitor: {
         firstName,
         lastName,
         email: tokenInfo.email,
         gender,
         visitorType,
         address,
         institution,
         purpose,
         visitorId,
         bookingId: tokenInfo.booking_id
       }
    });
    
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error updating group walk-in visitor:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + err.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Check in a group walk-in visitor
router.post('/:visitorId/checkin', async (req, res) => {
  const { visitorId } = req.params;
  
  try {
    // Get visitor information
    const [visitorRows] = await pool.query(
      `SELECT v.*, b.type as booking_type 
       FROM visitors v 
       LEFT JOIN bookings b ON v.booking_id = b.booking_id 
       WHERE v.visitor_id = ?`,
      [visitorId]
    );
    
    if (visitorRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found'
      });
    }
    
    const visitor = visitorRows[0];
    
    // Check if already checked in
    if (visitor.status === 'visited') {
      return res.status(400).json({
        success: false,
        error: 'Visitor already checked in'
      });
    }
    
    // Update visitor status to checked in
    await pool.query(
      `UPDATE visitors 
       SET status = 'visited', checkin_time = NOW() 
       WHERE visitor_id = ?`,
      [visitorId]
    );
    
    res.json({
      success: true,
      message: 'Group walk-in visitor checked in successfully!',
             visitor: {
         firstName: visitor.first_name,
         lastName: visitor.last_name,
         email: visitor.email,
         gender: visitor.gender,
         visitorType: visitor.visitor_type,
         address: visitor.address,
         institution: visitor.institution,
         purpose: visitor.purpose,
         checkin_time: new Date().toISOString(),
         bookingType: visitor.booking_type,
         visitorType: 'walkin_visitor'
       }
    });
    
  } catch (err) {
    console.error('Error checking in group walk-in visitor:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
