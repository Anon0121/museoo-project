const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const fs = require('fs');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/archives');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// POST /api/archives - Upload new archive (admin only)
router.post('/', upload.single('file'), async (req, res) => {
  const { title, description, date, type, tags } = req.body;
  const file = req.file;      
  if (!title || !file || !type) {
    return res.status(400).json({ error: 'Title, type, and file are required.' });
  }
  try {
    const file_url = `/uploads/archives/${file.filename}`;
    await pool.query(
      'INSERT INTO archives (title, description, date, type, tags, file_url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, date || null, type, tags, file_url, 'admin'] // Replace 'admin' with actual user if you have auth
    );
    try { await logActivity(req, 'archive.create', { title, type, file: file.filename }); } catch {}
    res.json({ success: true });
  } catch (err) {
    console.error('Archive upload error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/archives - List/search all archives (public)
router.get('/', async (req, res) => {
  const { search, type } = req.query;
  try {
    let query = 'SELECT * FROM archives';
    let params = [];
    
    if (search || type) {
      query += ' WHERE';
      if (search) {
        query += ' (title LIKE ? OR description LIKE ? OR tags LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      if (type) {
        if (search) query += ' AND';
        query += ' type = ?';
        params.push(type);
      }
    }
    
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/archives/:id - Delete archive (admin only)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Get file URL to delete file from disk
    const [[archive]] = await pool.query('SELECT file_url FROM archives WHERE id = ?', [id]);
    if (archive && archive.file_url) {
      const filePath = path.join(__dirname, '..', archive.file_url);
      fs.unlink(filePath, (err) => { /* ignore error */ });
    }
    await pool.query('DELETE FROM archives WHERE id = ?', [id]);
    try { await logActivity(req, 'archive.delete', { id }); } catch {}
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
