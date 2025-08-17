const express = require('express');
const pool = require('../db');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');

// Get additional visitor token info
router.get('/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  
  try {
    // Get token information with booking details and primary visitor's institution
    const [tokenRows] = await pool.query(
      `SELECT av.*, b.date as visit_date, b.time_slot, b.status as booking_status,
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
    
    res.json({
      success: true,
      tokenInfo: {
                 tokenId: tokenInfo.token_id,
         email: tokenInfo.email,
         status: tokenInfo.status,
         visitDate: tokenInfo.visit_date,
         visitTime: tokenInfo.time_slot,
         primaryInstitution: tokenInfo.primary_institution,
         primaryPurpose: tokenInfo.primary_purpose,
         linkExpired: tokenInfo.link_expires_at ? true : false,
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
  const { firstName, lastName, gender, address, nationality, institution, purpose } = req.body;
  
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
        error: 'Details have already been completed for this token',
        linkExpired: true
      });
    }
    
    // Check if link has expired
    if (tokenInfo.link_expires_at && new Date() > new Date(tokenInfo.link_expires_at)) {
      return res.status(400).json({
        success: false,
        error: 'This link has expired. Please contact the museum for assistance.',
        linkExpired: true
      });
    }
    
    // Get primary visitor's institution and purpose
    const [primaryVisitorRows] = await pool.query(
      `SELECT institution, purpose FROM visitors WHERE booking_id = ? AND is_main_visitor = true`,
      [tokenInfo.booking_id]
    );
    
    const primaryInstitution = primaryVisitorRows.length > 0 ? primaryVisitorRows[0].institution : null;
    const primaryPurpose = primaryVisitorRows.length > 0 ? primaryVisitorRows[0].purpose : 'educational';
    
    // Prepare details object
    const details = {
      firstName,
      lastName,
      gender,
      address,
      nationality,
      institution: primaryInstitution || primaryPurpose, // Use primary visitor's institution, fallback to purpose
      purpose: primaryPurpose // Use primary visitor's purpose
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
    
    // Update status to checked-in
    await pool.query(
      `UPDATE additional_visitors 
       SET status = 'checked-in', checkin_time = NOW()
       WHERE token_id = ?`,
      [tokenId]
    );
    
    // Parse details
    const details = tokenInfo.details ? JSON.parse(tokenInfo.details) : {};
    
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
        visitDate: tokenInfo.visit_date,
        visitTime: tokenInfo.time_slot,
        checkin_time: new Date().toISOString()
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
