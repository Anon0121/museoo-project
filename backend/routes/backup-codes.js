const express = require('express');
const pool = require('../db');
const router = express.Router();

// Note: We no longer need the /generate endpoint since we use existing visitor IDs as backup codes

// Validate a backup code (using visitor ID)
router.post('/validate', async (req, res) => {
  const { code } = req.body;
  
  try {
    // Find the visitor with this ID (check both primary and additional visitors)
    const [primaryVisitorRows] = await pool.query(
      `SELECT v.*, b.date, b.time_slot, b.type as booking_type
       FROM visitors v
       JOIN bookings b ON v.booking_id = b.booking_id
       WHERE v.visitor_id = ?`,
      [code]
    );
    
    const [additionalVisitorRows] = await pool.query(
      `SELECT av.*, b.date, b.time_slot, b.type as booking_type
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       WHERE av.token_id = ?`,
      [code]
    );
    
    let visitorInfo = null;
    
    if (primaryVisitorRows.length > 0) {
      // Primary visitor found
      const visitor = primaryVisitorRows[0];
      visitorInfo = {
        ...visitor,
        firstName: visitor.first_name,
        lastName: visitor.last_name,
        visitDate: visitor.date,
        visitTime: visitor.time_slot,
        visitorType: 'primary_visitor',
        bookingType: visitor.booking_type,
        isPrimary: true
      };
    } else if (additionalVisitorRows.length > 0) {
      // Additional visitor found
      const visitor = additionalVisitorRows[0];
      let details = null;
      try {
        if (visitor.details) {
          details = typeof visitor.details === 'string' ? JSON.parse(visitor.details) : visitor.details;
        }
      } catch (e) {
        console.log('Error parsing additional visitor details:', e);
      }
      
      visitorInfo = {
        ...visitor,
        firstName: details?.firstName || 'Additional',
        lastName: details?.lastName || 'Visitor',
        gender: details?.gender || 'Not specified',
        address: details?.address || 'Not provided',
        visitDate: visitor.date,
        visitTime: visitor.time_slot,
        visitorType: 'additional_visitor',
        bookingType: visitor.booking_type,
        isPrimary: false
      };
    }
    
    if (!visitorInfo) {
      return res.status(400).json({
        success: false,
        error: 'Invalid visitor ID or token'
      });
    }
    
    // Update check-in status for the specific visitor
    if (visitorInfo.isPrimary) {
      await pool.query(
        `UPDATE visitors SET status = 'visited', checkin_time = NOW() WHERE visitor_id = ?`,
        [code]
      );
    } else {
      await pool.query(
        `UPDATE additional_visitors SET status = 'checked-in', checkin_time = NOW() WHERE token_id = ?`,
        [code]
      );
    }
    
    res.json({
      success: true,
      visitor: visitorInfo,
      message: 'Visitor ID validated successfully'
    });
    
  } catch (err) {
    console.error('Error validating visitor ID:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to validate visitor ID'
    });
  }
});

module.exports = router;
