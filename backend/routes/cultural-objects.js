const express = require('express');
const multer = require('multer');
const pool = require('../db');
const { logActivity } = require('../utils/activityLogger');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// CREATE a new cultural object
router.post('/', upload.array('images'), async (req, res) => {
  const {
    name, description, category, period, origin, material, dimensions,
    condition_status, acquisition_date, acquisition_method, current_location,
    estimated_value, conservation_notes, exhibition_history
  } = req.body;
  const files = req.files;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert into cultural_objects
    const [mainResult] = await conn.query(
      'INSERT INTO cultural_objects (name, category, description) VALUES (?, ?, ?)',
      [name, category, description]
    );
    const objectId = mainResult.insertId;

    // Insert into object_details
    await conn.query(
      `INSERT INTO object_details (
        cultural_object_id, period, origin, material, dimensions, condition_status,
        acquisition_date, acquisition_method, current_location, estimated_value,
        conservation_notes, exhibition_history
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        objectId, period, origin, material, dimensions, condition_status,
        acquisition_date, acquisition_method, current_location, estimated_value,
        conservation_notes, exhibition_history
      ]
    );

    // Save image URLs
    if (files && files.length > 0) {
      for (const file of files) {
        await conn.query(
          'INSERT INTO images (cultural_object_id, url) VALUES (?, ?)',
          [objectId, `/uploads/${file.filename}`]
        );
      }
    }

    await conn.commit();
    try { await logActivity(req, 'cobject.create', { culturalObjectId: objectId, name }); } catch {}
    res.json({ success: true, culturalObjectId: objectId });
  } catch (err) {
    await conn.rollback();
    console.error('Error creating cultural object:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    conn.release();
  }
});

// READ all cultural objects with details and images
router.get('/', async (req, res) => {
  try {
    const [objects] = await pool.query(
      `SELECT co.*, od.*, od.id as details_id
       FROM cultural_objects co
       LEFT JOIN object_details od ON co.id = od.cultural_object_id
       ORDER BY co.created_at DESC`
    );
    const [images] = await pool.query(
      'SELECT * FROM images WHERE cultural_object_id IS NOT NULL'
    );
    const objectsWithImages = objects.map(obj => ({
      ...obj,
      images: images.filter(img => img.cultural_object_id === obj.id).map(img => img.url)
    }));
    res.json(objectsWithImages);
  } catch (err) {
    console.error('Error fetching cultural objects:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// READ by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [objects] = await pool.query(
      `SELECT co.*, od.*, od.id as details_id
       FROM cultural_objects co
       LEFT JOIN object_details od ON co.id = od.cultural_object_id
       WHERE co.id = ?`,
      [id]
    );
    if (objects.length === 0) {
      return res.status(404).json({ error: 'Cultural object not found' });
    }
    const [images] = await pool.query(
      'SELECT * FROM images WHERE cultural_object_id = ?',
      [id]
    );
    const objectWithImages = {
      ...objects[0],
      images: images.map(img => img.url)
    };
    res.json(objectWithImages);
  } catch (err) {
    console.error('Error fetching cultural object:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// UPDATE
router.put('/:id', upload.array('images'), async (req, res) => {
  const { id } = req.params;
  const {
    name, description, category, period, origin, material, dimensions,
    condition_status, acquisition_date, acquisition_method, current_location,
    estimated_value, conservation_notes, exhibition_history
  } = req.body;
  const files = req.files;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update cultural_objects
    await conn.query(
      'UPDATE cultural_objects SET name = ?, category = ?, description = ? WHERE id = ?',
      [name, category, description, id]
    );

    // Update object_details
    await conn.query(
      `UPDATE object_details SET
        period = ?, origin = ?, material = ?, dimensions = ?, condition_status = ?,
        acquisition_date = ?, acquisition_method = ?, current_location = ?, estimated_value = ?,
        conservation_notes = ?, exhibition_history = ?
       WHERE cultural_object_id = ?`,
      [
        period, origin, material, dimensions, condition_status,
        acquisition_date, acquisition_method, current_location, estimated_value,
        conservation_notes, exhibition_history, id
      ]
    );

    // Add new images if any
    if (files && files.length > 0) {
      for (const file of files) {
        await conn.query(
          'INSERT INTO images (cultural_object_id, url) VALUES (?, ?)',
          [id, `/uploads/${file.filename}`]
        );
      }
    }

    await conn.commit();
    try { await logActivity(req, 'cobject.update', { culturalObjectId: id }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating cultural object:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    conn.release();
  }
});

// DELETE object and its images/details
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM images WHERE cultural_object_id = ?', [id]);
    await conn.query('DELETE FROM object_details WHERE cultural_object_id = ?', [id]);
    await conn.query('DELETE FROM cultural_objects WHERE id = ?', [id]);
    await conn.commit();
    try { await logActivity(req, 'cobject.delete', { culturalObjectId: id }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error deleting cultural object:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    conn.release();
  }
});

// DELETE a specific image
router.delete('/:id/images/:imageId', async (req, res) => {
  const { id, imageId } = req.params;
  try {
    await pool.query(
      'DELETE FROM images WHERE id = ? AND cultural_object_id = ?',
      [imageId, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// FILTER by category
router.get('/category/:category', async (req, res) => {
  const { category } = req.params;
  try {
    const [objects] = await pool.query(
      `SELECT co.*, od.*, od.id as details_id
       FROM cultural_objects co
       LEFT JOIN object_details od ON co.id = od.cultural_object_id
       WHERE co.category = ?
       ORDER BY co.created_at DESC`,
      [category]
    );
    const [images] = await pool.query(
      'SELECT * FROM images WHERE cultural_object_id IS NOT NULL'
    );
    const objectsWithImages = objects.map(obj => ({
      ...obj,
      images: images.filter(img => img.cultural_object_id === obj.id).map(img => img.url)
    }));
    res.json(objectsWithImages);
  } catch (err) {
    console.error('Error fetching cultural objects by category:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router; 