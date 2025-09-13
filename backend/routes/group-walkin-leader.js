const express = require('express');
const pool = require('../db');
const router = express.Router();
const QRCode = require('qrcode');
const { logActivity } = require('../utils/activityLogger');

// Get group walk-in leader info
router.get('/:visitorId', async (req, res) => {
  const { visitorId } = req.params;
  
  try {
    // Get visitor information with booking details
    const [visitorRows] = await pool.query(
      `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.booking_id, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ? AND b.type = 'group-walkin'`,
      [visitorId]
    );
    
    if (visitorRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Group walk-in leader not found or invalid token'
      });
    }
    
    const visitor = visitorRows[0];
    
    // Check if booking is still valid
    if (visitor.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled'
      });
    }
    
    // Check if visitor has already completed registration
    if (visitor.status === 'visited') {
      return res.status(400).json({
        success: false,
        error: 'This visitor has already completed registration and been checked in.',
        status: visitor.status
      });
    }
    
    res.json({
      success: true,
      visitorInfo: {
        visitorId: visitor.visitor_id,
        email: visitor.email,
        firstName: visitor.first_name,
        lastName: visitor.last_name,
        status: visitor.status,
        visitDate: visitor.visit_date,
        visitTime: visitor.time_slot,
        bookingId: visitor.booking_id,
        bookingType: visitor.booking_type,
        institution: visitor.institution,
        purpose: visitor.purpose,
        gender: visitor.gender,
        address: visitor.address,
        visitorType: visitor.visitor_type
      }
    });
    
  } catch (err) {
    console.error('Error fetching group walk-in leader info:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitor information'
    });
  }
});

// Update group walk-in leader details
router.put('/:visitorId', async (req, res) => {
  const { visitorId } = req.params;
  const { firstName, lastName, gender, address, visitorType, institution, purpose } = req.body;
  
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // First, get visitor information
    const [visitorRows] = await connection.query(
      `SELECT v.*, b.status as booking_status, b.booking_id, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ? AND b.type = 'group-walkin'`,
      [visitorId]
    );
    
    if (visitorRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Group walk-in leader not found or invalid token'
      });
    }
    
    const visitor = visitorRows[0];
    
    // Check if booking is still valid
    if (visitor.booking_status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled'
      });
    }
    
    // Check if visitor has already completed registration
    if (visitor.status === 'visited') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'This visitor has already completed registration and been checked in.',
        status: visitor.status
      });
    }
    
    // Update visitor details
    await connection.query(
      `UPDATE visitors SET 
        first_name = ?, 
        last_name = ?, 
        gender = ?, 
        address = ?, 
        visitor_type = ?, 
        institution = ?, 
        purpose = ?,
        status = 'pending'
       WHERE visitor_id = ?`,
      [firstName, lastName, gender, address, visitorType, institution, purpose, visitorId]
    );
    
    // Generate QR code with visitor details
    const qrData = {
      type: 'walkin_visitor',
      visitorId: visitorId,
      bookingId: visitor.booking_id,
      email: visitor.email,
      visitDate: visitor.visit_date,
      visitTime: visitor.time_slot,
      visitorName: `${firstName} ${lastName}`,
      institution: institution,
      purpose: purpose
    };
    
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    
    // Update visitor with QR code
    await connection.query(
      `UPDATE visitors SET qr_code = ? WHERE visitor_id = ?`,
      [base64Data, visitorId]
    );
    
         // Send emails to additional visitors with their form links
     const [additionalVisitors] = await connection.query(
       `SELECT token_id, email FROM additional_visitors 
        WHERE booking_id = ? AND token_id NOT LIKE ?`,
       [visitor.booking_id, '%-0']
     );
     
     console.log(`📧 Found ${additionalVisitors.length} additional visitors to send emails to`);
     
     // Send emails to each additional visitor
     for (const additionalVisitor of additionalVisitors) {
       try {
         // Create form link for additional visitor
         const memberFormUrl = `http://localhost:5173/group-walkin-visitor?token=${additionalVisitor.token_id}`;
         
                   // Generate QR code for additional visitor
          const additionalQrData = {
            type: 'walkin_visitor',
            visitorId: `GROUP-${visitor.booking_id}-${additionalVisitor.token_id}`,
            bookingId: visitor.booking_id,
            email: additionalVisitor.email,
            visitDate: visitor.visit_date,
            visitTime: visitor.visit_time,
            groupLeader: `${firstName} ${lastName}`,
            institution: institution,
            purpose: purpose
          };
          
          const additionalQrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(additionalQrData));
          const additionalBase64Data = additionalQrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
          
          // Generate backup code for additional visitor
          const additionalBackupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          
          // Create email content for additional visitor
          const additionalVisitorEmailHtml = `
          <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #AB8841 0%, #8B6B21 100%); padding: 30px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 28px;">🎫 Your Group Walk-In Registration is Ready!</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px;">Complete your registration to get your QR code</p>
              </div>
              
              <div style="padding: 30px; background: #faf7f1;">
                  <h2 style="color: #2e2b41; margin-bottom: 20px;">Hello!</h2>
                  
                  <p style="color: #2e2b41;">Your group walk-in museum visit has been <strong>approved</strong> for <strong>${visitor.visit_date}</strong> at <strong>${visitor.visit_time}</strong>.</p>
                  
                  <p style="color: #2e2b41;">Your group leader <strong>${firstName} ${lastName}</strong> has completed their registration and provided the following information:</p>
                  
                  <div style="background: #f5f4f7; border: 1px solid #2e2b41; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <h4 style="margin-top: 0; color: #2e2b41;">📋 Group Information (Inherited)</h4>
                      <p style="color: #2e2b41;"><strong>Institution:</strong> ${institution}</p>
                      <p style="color: #2e2b41;"><strong>Purpose:</strong> ${purpose}</p>
                  </div>
                  
                  <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #AB8841;">
                      <h3 style="color: #AB8841; margin-top: 0;">📋 Complete Your Registration</h3>
                      <p style="color: #2e2b41;">Please click the link below to complete your registration with your basic details:</p>
                      <a href="${memberFormUrl}" style="display: inline-block; background: #AB8841; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; transition: background-color 0.3s;">Complete My Registration</a>
                  </div>
                  
                  <div style="background: #f5f4f7; border: 1px solid #2e2b41; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <h4 style="margin-top: 0; color: #2e2b41;">📅 Visit Details</h4>
                      <p style="color: #2e2b41;"><strong>Date:</strong> ${visitor.visit_date}</p>
                      <p style="color: #2e2b41;"><strong>Time:</strong> ${visitor.visit_time}</p>
                      <p style="color: #2e2b41;"><strong>Group Leader:</strong> ${firstName} ${lastName}</p>
                      <p style="color: #2e2b41;"><strong>Status:</strong> ✅ Ready for Registration</p>
                  </div>
                  
                  <div style="background: #e8f4fd; border: 1px solid #AB8841; border-radius: 5px; padding: 15px; margin: 20px 0;">
                      <h4 style="margin-top: 0; color: #2e2b41;">👥 What You Need to Provide</h4>
                      <p style="margin: 0; font-size: 14px; color: #2e2b41;">
                          <strong>Required:</strong> First Name, Last Name, Gender, Visitor Type, Address<br>
                          <strong>Inherited:</strong> Institution and Purpose (from group leader)<br>
                          <strong>Result:</strong> Your personal QR code for check-in
                      </p>
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
         
         // Send email to additional visitor
         const nodemailer = require('nodemailer');
         const transporter = nodemailer.createTransporter({
           service: 'gmail',
           auth: {
             user: 'museoweb1@gmail.com',
             pass: 'akrtgds yyprsfxyi'
           }
         });
         
                   await transporter.sendMail({
            from: 'MuseoSmart <museoweb1@gmail.com>',
            to: additionalVisitor.email,
            subject: '🎫 Your Group Walk-In Registration is Ready!',
            html: additionalVisitorEmailHtml,
            attachments: [{
              filename: 'group_member_qr_code.png',
              content: Buffer.from(additionalBase64Data, 'base64'),
              contentType: 'image/png'
            }]
          });
          
          // Store QR code and backup code in database
          await connection.query(
            `UPDATE additional_visitors SET qr_code = ?, backup_code = ? WHERE token_id = ?`,
            [additionalBase64Data, additionalBackupCode, additionalVisitor.token_id]
          );
         
         console.log(`✅ Email sent to additional visitor: ${additionalVisitor.email}`);
       } catch (err) {
         console.error(`❌ Error sending email to additional visitor ${additionalVisitor.email}:`, err);
       }
     }
    
    await connection.commit();
    
    try { 
      await logActivity(req, 'group.walkin.leader.completed', { 
        visitorId, 
        bookingId: visitor.booking_id,
        visitorName: `${firstName} ${lastName}`,
        additionalVisitorsCount: additionalVisitors.length
      }); 
    } catch {}
    
         res.json({
       success: true,
       message: `Group walk-in leader registration completed successfully! Emails have been sent to ${additionalVisitors.length} additional visitors with their registration links.`,
       visitor: {
         firstName,
         lastName,
         email: visitor.email,
         gender,
         visitorType,
         address,
         institution,
         purpose,
         visitDate: visitor.visit_date,
         visitTime: visitor.time_slot,
         bookingId: visitor.booking_id
       },
       qrCode: base64Data,
       qrCodeDataUrl,
       additionalVisitorsCount: additionalVisitors.length,
       emailsSent: true
     });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error updating group walk-in leader:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update visitor information: ' + err.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Check-in group walk-in leader (for QR scanning)
router.post('/:visitorId/checkin', async (req, res) => {
  const { visitorId } = req.params;
  
  try {
    // Get visitor information with booking details
    const [visitorRows] = await pool.query(
      `SELECT v.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ? AND b.type = 'group-walkin'`,
      [visitorId]
    );
    
    if (visitorRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Group walk-in leader not found'
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
    
    // Check if already checked in
    if (visitor.status === 'visited') {
      return res.status(400).json({
        success: false,
        error: 'This group walk-in leader has already been checked in.',
        status: visitor.status
      });
    }
    
    // Check if QR code has already been used
    if (visitor.qr_used) {
      return res.status(400).json({
        success: false,
        error: 'This QR code has already been used and cannot be scanned again.',
        qrUsed: true
      });
    }
    
    // Update visitor status to visited, set check-in time, and mark QR as used
    await pool.query(
      `UPDATE visitors SET status = 'visited', checkin_time = NOW(), qr_used = TRUE WHERE visitor_id = ?`,
      [visitorId]
    );
    
    // Get updated visitor information with check-in time
    const [updatedVisitorRows] = await pool.query(
      `SELECT v.*, b.date as visit_date, b.time_slot, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ?`,
      [visitorId]
    );
    
    const updatedVisitor = updatedVisitorRows[0];
    
    try { 
      await logActivity(req, 'group.walkin.leader.checkin', { 
        visitorId, 
        bookingId: visitor.booking_id,
        visitorName: `${visitor.first_name} ${visitor.last_name}`
      }); 
    } catch {}
    
    res.json({
      success: true,
      message: 'Group walk-in leader checked in successfully!',
      visitor: {
        firstName: updatedVisitor.first_name,
        lastName: updatedVisitor.last_name,
        email: updatedVisitor.email,
        gender: updatedVisitor.gender,
        visitorType: updatedVisitor.visitor_type,
        address: updatedVisitor.address,
        institution: updatedVisitor.institution,
        purpose: updatedVisitor.purpose,
        visitDate: updatedVisitor.visit_date,
        visitTime: updatedVisitor.time_slot,
        checkin_time: updatedVisitor.checkin_time ? updatedVisitor.checkin_time.toISOString() : new Date().toISOString(),
        bookingType: updatedVisitor.booking_type,
        visitorType: 'group_walkin_leader'
      }
    });
    
  } catch (err) {
    console.error('Error checking in group walk-in leader:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to check in group walk-in leader: ' + err.message
    });
  }
});

module.exports = router;
