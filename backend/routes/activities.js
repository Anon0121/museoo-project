const express = require('express');
const multer = require('multer');
const pool = require('../db');
const router = express.Router();

const upload = multer({ dest: 'uploads/' }); // images will be saved in /uploads

// Create a new activity (event or exhibit) with details and images
router.post('/', upload.array('images'), async (req, res) => {
  const { title, description, type, ...details } = req.body;
  const files = req.files;

  try {
    // 1. Insert into activities
    const [activityResult] = await pool.query(
      'INSERT INTO activities (title, description, type) VALUES (?, ?, ?)',
      [title, description, type]
    );
    const activityId = activityResult.insertId;

    // 2. Insert into event_details or exhibit_details
    if (type === 'event') {
      await pool.query(
        'INSERT INTO event_details (activity_id, start_date, time, location, organizer) VALUES (?, ?, ?, ?, ?)',
        [activityId, details.start_date, details.time, details.location, details.organizer]
      );
    } else if (type === 'exhibit') {
      await pool.query(
        'INSERT INTO exhibit_details (activity_id, start_date, end_date, location, curator, category) VALUES (?, ?, ?, ?, ?, ?)',
        [activityId, details.start_date, details.end_date, details.location, details.curator, details.category]
      );
    }

    // 3. Save image URLs
    if (files && files.length > 0) {
      for (const file of files) {
        await pool.query(
          'INSERT INTO images (activity_id, url) VALUES (?, ?)',
          [activityId, `/uploads/${file.filename}`]
        );
      }
    }

    res.json({ success: true, activityId });
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all exhibits with details and images
router.get('/exhibits', async (req, res) => {
  try {
    // Get all exhibits
    const [exhibits] = await pool.query(
      "SELECT a.id, a.title, a.description, ed.start_date, ed.end_date, ed.location, ed.curator, ed.category \
       FROM activities a \
       JOIN exhibit_details ed ON a.id = ed.activity_id \
       WHERE a.type = 'exhibit'"
    );

    // Get all images for these exhibits
    const [images] = await pool.query(
      "SELECT * FROM images WHERE activity_id IN (?)",
      [exhibits.map(e => e.id)]
    );

    // Attach images to each exhibit
    const exhibitsWithImages = exhibits.map(ex => ({
      ...ex,
      images: images.filter(img => img.activity_id === ex.id).map(img => img.url)
    }));

    res.json(exhibitsWithImages);
  } catch (err) {
    console.error('Error fetching exhibits:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all events with details and images
router.get('/events', async (req, res) => {
  try {
    // Get all events
    const [events] = await pool.query(
      "SELECT a.id, a.title, a.description, ed.start_date, ed.time, ed.location, ed.organizer \
       FROM activities a \
       JOIN event_details ed ON a.id = ed.activity_id \
       WHERE a.type = 'event'"
    );

    // Get all images for these events
    const [images] = await pool.query(
      "SELECT * FROM images WHERE activity_id IN (?)",
      [events.map(e => e.id).length ? events.map(e => e.id) : [0]]
    );

    // Attach images to each event
    const eventsWithImages = events.map(ev => ({
      ...ev,
      images: images.filter(img => img.activity_id === ev.id).map(img => img.url)
    }));

    res.json(eventsWithImages);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete an activity (event or exhibit) and its details and images
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Delete from images
    await pool.query('DELETE FROM images WHERE activity_id = ?', [id]);
    // Delete from event_details and exhibit_details (one will succeed, the other will do nothing)
    await pool.query('DELETE FROM event_details WHERE activity_id = ?', [id]);
    await pool.query('DELETE FROM exhibit_details WHERE activity_id = ?', [id]);
    // Delete from activities
    await pool.query('DELETE FROM activities WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting activity:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router; 