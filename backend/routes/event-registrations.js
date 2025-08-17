const express = require('express');
const pool = require('../db');
const { logActivity } = require('../utils/activityLogger');
const QRCode = require('qrcode');
const { sendEventRegistrationEmail } = require('../services/emailService');
const router = express.Router();

// Get event registrations for a specific event
router.get('/event/:eventId', async (req, res) => {
  const { eventId } = req.params;
  
  try {
    const [registrations] = await pool.query(
      `SELECT id, full_name, email, contact_number, institution, 
              registration_date, status, checkin_time
       FROM event_registrations 
       WHERE event_id = ? 
       ORDER BY registration_date DESC`,
      [eventId]
    );
    
    res.json(registrations);
  } catch (err) {
    console.error('Error fetching event registrations:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Register for an event
router.post('/register', async (req, res) => {
  console.log('📝 Event registration request received:', req.body);
  const { eventId, fullName, email, contactNumber, institution } = req.body;
  
  // Validate required fields
  if (!eventId || !fullName || !email) {
    console.log('❌ Missing required fields:', { eventId, fullName, email });
    return res.status(400).json({ error: 'Missing required fields: eventId, fullName, and email are required.' });
  }
  
  try {
    // Check if event exists and get capacity info
    console.log('🔍 Looking for event with ID:', eventId);
    const [eventDetails] = await pool.query(
      `SELECT ed.max_capacity, ed.current_registrations, a.title, a.description, ed.start_date, ed.time, ed.location
       FROM event_details ed
       JOIN activities a ON ed.activity_id = a.id
       WHERE a.id = ? AND a.type = 'event'`,
      [eventId]
    );
    
    console.log('📋 Event details found:', eventDetails.length, 'records');
    
    if (eventDetails.length === 0) {
      console.log('❌ Event not found with ID:', eventId);
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const event = eventDetails[0];
    
    // Check if event is full
    if (event.current_registrations >= event.max_capacity) {
      return res.status(400).json({ error: 'Event is full. No more registrations accepted.' });
    }
    
    // Check if user is already registered
    const [existingRegistration] = await pool.query(
      'SELECT id FROM event_registrations WHERE event_id = ? AND email = ?',
      [eventId, email]
    );
    
    if (existingRegistration.length > 0) {
      return res.status(400).json({ error: 'You are already registered for this event.' });
    }
    
    // Generate QR code
    const qrData = JSON.stringify({
      eventId,
      email,
      registrationId: Date.now()
    });
    const qrCode = await QRCode.toDataURL(qrData);
    
    // Insert registration
    const [result] = await pool.query(
      `INSERT INTO event_registrations 
       (event_id, full_name, email, contact_number, institution, qr_code) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [eventId, fullName, email, contactNumber, institution, qrCode]
    );
    
    // Update current registrations count
    await pool.query(
      'UPDATE event_details SET current_registrations = current_registrations + 1 WHERE activity_id = ?',
      [eventId]
    );
    
    // Send confirmation email
    try {
      await sendEventRegistrationEmail({
        fullName,
        email,
        event: {
          title: event.title,
          date: event.start_date,
          time: event.time,
          location: event.location
        },
        qrCode
      });
    } catch (emailError) {
      console.error('❌ Error sending confirmation email:', emailError);
      // Don't fail the registration if email fails
    }
    
    // Log activity
    try { 
      await logActivity(req, 'event.registration', { 
        eventId, 
        registrationId: result.insertId,
        eventTitle: event.title 
      }); 
    } catch {}
    
    res.json({ 
      success: true, 
      registrationId: result.insertId,
      qrCode,
      event: {
        title: event.title,
        date: event.start_date,
        time: event.time,
        location: event.location
      }
    });
    
  } catch (err) {
    console.error('Error registering for event:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Check-in for an event (QR code scan)
router.post('/checkin', async (req, res) => {
  const { qrCode } = req.body;
  
  try {
    // Find registration by QR code
    const [registrations] = await pool.query(
      `SELECT er.*, a.title as event_title, ed.start_date, ed.time, ed.location
       FROM event_registrations er
       JOIN activities a ON er.event_id = a.id
       JOIN event_details ed ON a.id = ed.activity_id
       WHERE er.qr_code = ?`,
      [qrCode]
    );
    
    if (registrations.length === 0) {
      return res.status(404).json({ error: 'Invalid QR code or registration not found.' });
    }
    
    const registration = registrations[0];
    
    if (registration.status === 'checked_in') {
      return res.status(400).json({ error: 'Already checked in for this event.' });
    }
    
    // Update check-in status
    await pool.query(
      'UPDATE event_registrations SET status = ?, checkin_time = NOW() WHERE id = ?',
      ['checked_in', registration.id]
    );
    
    // Log activity
    try { 
      await logActivity(req, 'event.checkin', { 
        eventId: registration.event_id,
        registrationId: registration.id,
        eventTitle: registration.event_title
      }); 
    } catch {}
    
    res.json({ 
      success: true, 
      message: 'Successfully checked in!',
      registration: {
        fullName: registration.full_name,
        eventTitle: registration.event_title,
        date: registration.start_date,
        time: registration.time,
        location: registration.location
      }
    });
    
  } catch (err) {
    console.error('Error checking in:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Cancel event registration
router.post('/cancel/:registrationId', async (req, res) => {
  const { registrationId } = req.params;
  
  try {
    // Get registration details
    const [registrations] = await pool.query(
      'SELECT * FROM event_registrations WHERE id = ?',
      [registrationId]
    );
    
    if (registrations.length === 0) {
      return res.status(404).json({ error: 'Registration not found.' });
    }
    
    const registration = registrations[0];
    
    if (registration.status === 'cancelled') {
      return res.status(400).json({ error: 'Registration is already cancelled.' });
    }
    
    // Update status to cancelled
    await pool.query(
      'UPDATE event_registrations SET status = ? WHERE id = ?',
      ['cancelled', registrationId]
    );
    
    // Decrease current registrations count
    await pool.query(
      'UPDATE event_details SET current_registrations = current_registrations - 1 WHERE activity_id = ?',
      [registration.event_id]
    );
    
    // Log activity
    try { 
      await logActivity(req, 'event.cancellation', { 
        eventId: registration.event_id,
        registrationId: registration.id
      }); 
    } catch {}
    
    res.json({ success: true, message: 'Registration cancelled successfully.' });
    
  } catch (err) {
    console.error('Error cancelling registration:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get event capacity info
router.get('/capacity/:eventId', async (req, res) => {
  const { eventId } = req.params;
  
  try {
    const [capacityInfo] = await pool.query(
      `SELECT ed.max_capacity, ed.current_registrations,
               (ed.max_capacity - ed.current_registrations) as available_slots
        FROM event_details ed
        WHERE ed.activity_id = ?`,
      [eventId]
    );
    
    if (capacityInfo.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(capacityInfo[0]);
  } catch (err) {
    console.error('Error fetching capacity info:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;

