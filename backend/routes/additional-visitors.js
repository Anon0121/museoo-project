const express = require('express');
const pool = require('../db');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');

// Test endpoint to verify the route is working
router.get('/test', (req, res) => {
  res.json({ message: 'Additional visitors route is working!' });
});

// Get all visitors for a booking (both primary and additional)
router.get('/booking/:bookingId', async (req, res) => {
  const { bookingId } = req.params;
  
  console.log('🔍 Backend: Fetching ALL visitors for booking ID:', bookingId);
  
  try {
    // Get booking information first
    const [bookingInfo] = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = ?`,
      [bookingId]
    );
    
    if (bookingInfo.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    const booking = bookingInfo[0];
    console.log('🔍 Backend: Booking info:', booking);
    
    // First, let's get visitors from the visitors table
    const [visitorsFromTable] = await pool.query(
      `SELECT 
        v.visitor_id,
        v.booking_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.address,
        v.email,
        v.visitor_type,
        v.purpose,
        v.institution,
        v.status as visitor_status,
        v.checkin_time,
        v.is_main_visitor,
        v.created_at
       FROM visitors v
       WHERE v.booking_id = ?`,
      [bookingId]
    );
    
    console.log('🔍 Backend: Visitors from table:', visitorsFromTable);
    
    // Then, let's get additional visitors
    const [additionalVisitors] = await pool.query(
      `SELECT 
        av.token_id,
        av.booking_id,
        av.email,
        av.status,
        av.checkin_time,
        av.created_at,
        av.details
       FROM additional_visitors av
       WHERE av.booking_id = ?`,
      [bookingId]
    );
    
    console.log('🔍 Backend: Additional visitors raw:', additionalVisitors);
    
    // Combine both results
    const allVisitors = [
      ...visitorsFromTable.map(v => ({
        ...v,
        source_type: 'visitor',
        token_id: null,
        additional_status: null
      })),
      ...additionalVisitors.map(av => {
        let details = null;
        try {
          if (av.details) {
            details = typeof av.details === 'string' ? JSON.parse(av.details) : av.details;
          }
        } catch (e) {
          console.log('🔍 Backend: Error parsing details for token', av.token_id, ':', e.message);
        }
        
        return {
          visitor_id: null,
          booking_id: av.booking_id,
          first_name: details?.firstName || 'Additional',
          last_name: details?.lastName || `Visitor #${av.token_id.split('-').pop()}`,
          gender: details?.gender || 'Not specified',
          address: details?.address || 'Not provided',
          email: av.email,
          visitorType: details?.visitorType || 'Group Member',
          purpose: details?.purpose || 'educational',
          institution: details?.institution || 'Not specified',
          visitor_status: null,
          checkin_time: av.checkin_time,
          is_main_visitor: 0,
          created_at: av.created_at,
          source_type: 'additional',
          token_id: av.token_id,
          additional_status: av.status
        };
      })
    ];
    
    console.log('🔍 Backend: Found', allVisitors.length, 'total visitors');
    console.log('🔍 Backend: Raw visitors data:', allVisitors);
    
    const visitors = allVisitors.map(visitor => ({
      visitorId: visitor.visitor_id,
      tokenId: visitor.token_id,
      email: visitor.email,
      firstName: visitor.first_name || 'Unknown',
      lastName: visitor.last_name || 'Visitor',
      gender: visitor.gender || 'Not specified',
      address: visitor.address || 'Not provided',
      visitorType: visitor.visitor_type || visitor.visitorType || 'Visitor',
      institution: visitor.institution || 'Not specified',
      purpose: visitor.purpose || 'educational',
      checkinTime: visitor.checkin_time,
      status: visitor.source_type === 'additional' ? visitor.additional_status : visitor.visitor_status,
      isMainVisitor: visitor.is_main_visitor === 1,
      sourceType: visitor.source_type,
      createdAt: visitor.created_at
    }));
    
    console.log('🔍 Backend: Processed visitors:', visitors);
    
    res.json({
      success: true,
      booking: {
        bookingId: booking.booking_id,
        type: booking.type,
        status: booking.status,
        date: booking.date,
        timeSlot: booking.time_slot,
        totalVisitors: booking.total_visitors || allVisitors.length
      },
      visitors: visitors
    });
    
  } catch (err) {
    console.error('Error fetching all visitors:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitors: ' + err.message
    });
  }
});

// Get additional visitor token info
router.get('/token/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  
  try {
    // Get token information with booking details and primary visitor's institution
    const [tokenRows] = await pool.query(
      `SELECT av.*, b.date as visit_date, b.time_slot, b.status as booking_status, b.type as booking_type,
              v.institution as primary_institution, v.purpose as primary_purpose
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
       LEFT JOIN visitors v ON v.booking_id = b.booking_id AND v.is_main_visitor = true
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
         bookingType: tokenInfo.booking_type,
         primaryInstitution: tokenInfo.primary_institution,
         primaryPurpose: tokenInfo.primary_purpose,
         linkExpired: tokenInfo.expires_at ? (new Date() > new Date(tokenInfo.expires_at)) : false,
         details: tokenInfo.details ? JSON.parse(tokenInfo.details) : null
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

// Update additional visitor details
router.put('/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  const { firstName, lastName, gender, address, visitorType, institution, purpose } = req.body;
  
  try {
    // First, get token information
    const [tokenRows] = await pool.query(
      `SELECT av.*, b.status as booking_status
       FROM additional_visitors av
       JOIN bookings b ON av.booking_id = b.booking_id
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
    
    // Check if already completed
    if (tokenInfo.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'This form has already been submitted and cannot be submitted again.',
        linkExpired: true
      });
    }
    
    // Check if link has expired
    if (tokenInfo.expires_at && new Date() > new Date(tokenInfo.expires_at)) {
      return res.status(400).json({
        success: false,
        error: 'This link has expired. Please contact the museum for assistance.',
        linkExpired: true
      });
    }
    
    // Get booking type to determine if this is group walk-in
    const [bookingRows] = await pool.query(
      `SELECT type FROM bookings WHERE booking_id = ?`,
      [tokenInfo.booking_id]
    );
    
    const isGroupWalkin = bookingRows.length > 0 && bookingRows[0].type === 'group-walkin';
    
    let institution, purpose;
    
    if (isGroupWalkin) {
      // For group walk-in, get institution and purpose from the group leader (primary visitor)
      const [primaryVisitorRows] = await pool.query(
        `SELECT institution, purpose FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
        [tokenInfo.booking_id]
      );
      
      institution = primaryVisitorRows.length > 0 ? primaryVisitorRows[0].institution : '';
      purpose = primaryVisitorRows.length > 0 ? primaryVisitorRows[0].purpose : 'educational';
    } else {
      // For regular additional visitors, get from primary visitor
      const [primaryVisitorRows] = await pool.query(
        `SELECT institution, purpose FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
        [tokenInfo.booking_id]
      );
      
      institution = primaryVisitorRows.length > 0 ? primaryVisitorRows[0].institution : null;
      purpose = primaryVisitorRows.length > 0 ? primaryVisitorRows[0].purpose : 'educational';
    }
    
    // Prepare details object
    const details = {
      firstName,
      lastName,
      gender,
      address,
      visitorType,
      institution: institution,
      purpose: purpose
    };
    
    // Update token with details and expire the link
    await pool.query(
      `UPDATE additional_visitors 
       SET details = ?, status = 'completed', details_completed_at = NOW(), link_expires_at = NOW()
       WHERE token_id = ?`,
      [JSON.stringify(details), tokenId]
    );
    
    try { await logActivity(req, 'additional_visitor.update', { tokenId }); } catch {}
    
    res.json({
      success: true,
      message: 'Visitor details updated successfully',
      details
    });
    
  } catch (err) {
    console.error('Error updating visitor details:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update visitor details'
    });
  }
});

// Check-in additional visitor (for QR scanning)
router.post('/:tokenId/checkin', async (req, res) => {
  const { tokenId } = req.params;
  
  try {
    // Get token information with booking details
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
        error: 'Token not found or expired'
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
    
    // STEP 1: Update additional_visitors table with check-in time
    console.log('⏰ Setting check-in time for additional visitor...');
    await pool.query(
      `UPDATE additional_visitors 
       SET status = 'checked-in', checkin_time = NOW()
       WHERE token_id = ?`,
      [tokenId]
    );
    
    // STEP 2: Parse visitor details
    const details = tokenInfo.details ? JSON.parse(tokenInfo.details) : {};
    console.log('📝 Visitor Details:', details);
    
    // STEP 3: Create/Update visitor record for admin dashboard
    console.log('👤 Creating visitor record for admin dashboard...');
    
    // Check if visitor record already exists
    const [existingVisitor] = await pool.query(
      `SELECT visitor_id FROM visitors 
       WHERE email = ? AND booking_id = ? AND is_main_visitor = false`,
      [tokenInfo.email, tokenInfo.booking_id]
    );
    
    if (existingVisitor.length > 0) {
      // Update existing visitor record
      await pool.query(
        `UPDATE visitors 
         SET status = 'visited', checkin_time = NOW()
         WHERE visitor_id = ?`,
        [existingVisitor[0].visitor_id]
      );
      console.log('✅ Updated existing visitor record');
    } else {
      // Insert new visitor record
      await pool.query(
        `INSERT INTO visitors (
          booking_id, first_name, last_name, gender, address, email, 
          visitorType, purpose, institution, status, is_main_visitor, 
          checked_in_by, created_at, checkin_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'visited', false, ?, NOW(), NOW())`,
        [
          tokenInfo.booking_id,
          details.firstName || '',
          details.lastName || '',
          details.gender || '',
          details.address || '',
          tokenInfo.email,
          details.visitorType || '',
          details.purpose || 'educational',
          details.institution || '',
          req.user?.user_ID || null
        ]
      );
      console.log('✅ Created new visitor record');
    }
    
    try { await logActivity(req, 'additional_visitor.checkin', { tokenId, bookingId: tokenInfo.booking_id }); } catch {}
    
    // Get the actual check-in time from the database
    const [checkinTimeResult] = await pool.query(
      `SELECT checkin_time FROM additional_visitors WHERE token_id = ?`,
      [tokenId]
    );
    
    const actualCheckinTime = checkinTimeResult[0].checkin_time;
    
    res.json({
      success: true,
      message: 'Additional visitor checked in successfully!',
      visitor: {
        firstName: details.firstName,
        lastName: details.lastName,
        email: tokenInfo.email,
        gender: details.gender,
        visitorType: details.visitorType,
        address: details.address,
        institution: details.institution || 'N/A',
        visitDate: tokenInfo.visit_date,
        visitTime: tokenInfo.time_slot,
        checkin_time: actualCheckinTime ? actualCheckinTime.toISOString() : new Date().toISOString()
      }
    });
    
  } catch (err) {
    console.error('Error checking in additional visitor:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to check in visitor: ' + err.message
    });
  }
});

module.exports = router;
