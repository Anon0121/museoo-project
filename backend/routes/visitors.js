const express = require('express');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');
const pool = require('../db');

// Get all visitors with their details
router.get('/all', async (req, res) => {
  try {
    const [visitors] = await pool.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.visitor_type,
        v.address,
        v.email,
        v.purpose,
        v.status,
        v.created_at,
        v.checkin_time,
        b.date as visit_date,
        b.time_slot,
        CASE 
          WHEN v.is_main_visitor = 1 THEN 'Primary Visitor'
          WHEN b.type IN ('ind-walkin', 'group-walkin') THEN 'Walk-in Visitor'
          ELSE 'Additional Visitor'
        END as visitor_type,
        b.type as booking_type
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.checkin_time IS NOT NULL
      ORDER BY v.checkin_time DESC
    `);
    
    // Debug: Log check-in times
    console.log('🔍 Visitors check-in times debug:');
    visitors.forEach((visitor, index) => {
      console.log(`Visitor ${index + 1}: ${visitor.first_name} ${visitor.last_name}`);
      console.log(`  - Status: ${visitor.status}`);
      console.log(`  - Check-in time: ${visitor.checkin_time}`);
      console.log(`  - Check-in time type: ${typeof visitor.checkin_time}`);
    });
    
    res.json({ 
      success: true, 
      visitors: visitors 
    });
  } catch (err) {
    console.error('Error fetching visitors:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch visitors' 
    });
  }
});

// Get visitor statistics
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN v.status = 'visited' THEN 1 END) as visited,
        COUNT(CASE WHEN v.status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN DATE(v.created_at) = CURDATE() THEN 1 END) as today
      FROM visitors v
      WHERE v.is_main_visitor = 1
    `);
    
    res.json({ 
      success: true, 
      stats: stats[0] 
    });
  } catch (err) {
    console.error('Error fetching visitor stats:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch visitor stats' 
    });
  }
});

// Get visitor by ID (for QR code scanning)
router.get('/:visitorId', async (req, res) => {
  try {
    const { visitorId } = req.params;
    
    const [visitor] = await pool.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.visitor_type,
        v.address,
        v.email,
        v.purpose,
        v.status,
        v.created_at,
        v.checkin_time,
        b.date as visit_date,
        b.time_slot,
        b.booking_id
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.visitor_id = ?
    `, [visitorId]);
    
    if (visitor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found'
      });
    }
    
    res.json({
      success: true,
      visitor: visitor[0]
    });
  } catch (err) {
    console.error('Error fetching visitor:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitor'
    });
  }
});

// Update visitor check-in time (when QR is scanned)
router.post('/checkin/:visitorId', async (req, res) => {
  try {
    const { visitorId } = req.params;
    
    // First, get visitor information to ensure it exists
    const [visitor] = await pool.query(
      'SELECT * FROM visitors WHERE visitor_id = ?',
      [visitorId]
    );
    
    if (visitor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found'
      });
    }
    
    // Update visitor status to visited and set individual check-in time
    await pool.query(
      'UPDATE visitors SET status = "visited", checkin_time = NOW() WHERE visitor_id = ?',
      [visitorId]
    );
    
    // Update booking status (but not checkin_time - keep individual times)
    await pool.query(`
      UPDATE bookings b 
      JOIN visitors v ON b.booking_id = v.booking_id 
      SET b.status = 'checked-in'
      WHERE v.visitor_id = ?
    `, [visitorId]);
    
    // Get updated visitor information with individual check-in time
    const [updatedVisitor] = await pool.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.visitor_type,
        v.address,
        v.email,
        v.purpose,
        v.status,
        v.created_at,
        v.checkin_time,
        b.date as visit_date,
        b.time_slot
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.visitor_id = ?
    `, [visitorId]);
    
    try { await logActivity(req, 'visitor.checkin', { visitorId }); } catch {}
    res.json({ 
      success: true, 
      message: 'Visitor checked in successfully',
      visitor: {
        ...updatedVisitor[0],
        checkin_time: updatedVisitor[0].checkin_time ? updatedVisitor[0].checkin_time.toISOString() : null
      }
    });
  } catch (err) {
    console.error('Error checking in visitor:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check in visitor' 
    });
  }
});

// Update visitor information (for group members)
router.put('/:visitorId', async (req, res) => {
  try {
    const { visitorId } = req.params;
    const { firstName, lastName, gender, address, email, visitorType, institution, purpose } = req.body;
    
    // First, get visitor information to ensure it exists
    const [visitor] = await pool.query(
      'SELECT * FROM visitors WHERE visitor_id = ?',
      [visitorId]
    );
    
    if (visitor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found'
      });
    }
    
    // Update visitor information
    await pool.query(`
      UPDATE visitors 
      SET first_name = ?, last_name = ?, gender = ?, address = ?, 
          email = ?, visitor_type = ?, purpose = ?
      WHERE visitor_id = ?
    `, [firstName, lastName, gender, address, email, visitorType, purpose, visitorId]);
    
    // If institution is provided, we might want to store it in a separate field
    // For now, we'll store it in the purpose field or create a new field if needed
    if (institution) {
      // You could add an institution field to the visitors table if needed
      // For now, we'll store it as part of the purpose or create a custom field
      await pool.query(`
        UPDATE visitors 
        SET purpose = CONCAT(purpose, ' - Institution: ', ?)
        WHERE visitor_id = ?
      `, [institution, visitorId]);
    }
    
    // Get updated visitor information
    const [updatedVisitor] = await pool.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.visitor_type,
        v.address,
        v.email,
        v.purpose,
        v.status,
        v.created_at,
        b.date as visit_date,
        b.time_slot
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE v.visitor_id = ?
    `, [visitorId]);
    
    try { await logActivity(req, 'visitor.update', { visitorId }); } catch {}
    res.json({ 
      success: true, 
      message: 'Visitor information updated successfully',
      visitor: updatedVisitor[0]
    });
  } catch (err) {
    console.error('Error updating visitor:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update visitor information' 
    });
  }
});

module.exports = router; 