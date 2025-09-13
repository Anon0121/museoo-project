const express = require('express');
const pool = require('../db');
const router = express.Router();

// Note: We no longer need the /generate endpoint since we use existing visitor IDs as backup codes

// Validate a backup code (using visitor ID) - Updated for unified visitors table
router.post('/validate', async (req, res) => {
  const { code } = req.body;
  
  try {
    console.log('🔍 === BACKUP CODE VALIDATION DEBUG START ===');
    console.log('🎫 Backup Code:', code);
    
    // Find the visitor with this ID in the unified visitors table
    const [visitorRows] = await pool.query(
      `SELECT v.*, b.date, b.time_slot, b.type as booking_type, b.status as booking_status
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ? OR v.qr_code LIKE ?`,
      [code, `%${code}%`]
    );
    
    console.log('🔍 Found visitor rows:', visitorRows.length);
    
    if (visitorRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid visitor ID or token'
      });
    }
    
    const visitor = visitorRows[0];
    console.log('👤 Visitor data:', visitor);
    
    // Check if booking is valid
    if (visitor.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This booking has been cancelled and cannot be checked in.',
        status: visitor.booking_status
      });
    }
    
    // Check if already checked in
    if (visitor.status === 'visited' && visitor.checkin_time) {
      return res.status(400).json({
        success: false,
        error: 'This visitor has already been checked in.',
        status: 'checked-in'
      });
    }
    
    // Determine visitor type and create visitor info
    let visitorInfo = {
      ...visitor,
      firstName: visitor.first_name || '',
      lastName: visitor.last_name || '',
      email: visitor.email || '',
      gender: visitor.gender || 'Not specified',
      address: visitor.address || 'Not provided',
      institution: visitor.institution || 'Not specified',
      purpose: visitor.purpose || 'educational',
      visitDate: visitor.date,
      visitTime: visitor.time_slot,
      bookingType: visitor.booking_type,
      isPrimary: visitor.is_main_visitor === 1,
      checkin_time: new Date().toISOString()
    };
    
    // Set appropriate visitor type
    if (visitor.is_main_visitor === 1) {
      if (visitor.booking_type === 'ind-walkin' || visitor.booking_type === 'group-walkin') {
        visitorInfo.visitorType = 'walkin_visitor';
        visitorInfo.displayType = 'Walk-in Visitor';
      } else {
        visitorInfo.visitorType = 'primary_visitor';
        visitorInfo.displayType = 'Primary Visitor';
      }
    } else {
      visitorInfo.visitorType = 'additional_visitor';
      visitorInfo.displayType = 'Additional Visitor';
    }
    
    console.log('👤 Final visitor info:', visitorInfo);
    
    // Update check-in status
    await pool.query(
      `UPDATE visitors SET status = 'visited', checkin_time = NOW() WHERE visitor_id = ?`,
      [visitor.visitor_id]
    );
    
    console.log('✅ Updated visitor check-in status');
    
    res.json({
      success: true,
      visitor: visitorInfo,
      message: 'Visitor ID validated successfully'
    });
    
  } catch (err) {
    console.error('❌ === BACKUP CODE VALIDATION ERROR ===');
    console.error('❌ Error details:', err);
    console.error('❌ Error message:', err.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to validate visitor ID: ' + err.message
    });
  }
});

module.exports = router;
