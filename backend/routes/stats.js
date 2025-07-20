const express = require('express');
const router = express.Router();
const pool = require('../db'); // Use your existing db connection

router.get('/summary', async (req, res) => {
  try {
    // Count visitors (use system_user or visitors table as needed)
    const [visitors] = await pool.query('SELECT COUNT(*) AS count FROM system_user');
    // Count scheduled tours
    const [schedules] = await pool.query('SELECT COUNT(*) AS count FROM bookings');
    // Count events
    const [events] = await pool.query('SELECT COUNT(*) AS count FROM event_details');
    // Count exhibits
    const [exhibits] = await pool.query('SELECT COUNT(*) AS count FROM exhibit_details');

    res.json({
      visitors: visitors[0].count,
      schedules: schedules[0].count,
      events: events[0].count,
      exhibits: exhibits[0].count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats', details: err.message });
  }
});

module.exports = router; 