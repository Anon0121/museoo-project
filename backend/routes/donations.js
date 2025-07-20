const express = require('express');
const pool = require('../db');
const router = express.Router();

// CREATE donation (POST)
router.post('/', async (req, res) => {
  const {
    donor_name, donor_email, donor_contact, type, date_received, notes,
    amount, method, item_description, estimated_value, condition, loan_start_date, loan_end_date
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert into donations
    const [donationResult] = await conn.query(
      'INSERT INTO donations (donor_name, donor_email, donor_contact, type, date_received, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [donor_name, donor_email, donor_contact, type, date_received, notes]
    );
    const donationId = donationResult.insertId;

    // Insert into donation_details
    await conn.query(
      `INSERT INTO donation_details (
        donation_id, amount, method, item_description, estimated_value, \`condition\`, loan_start_date, loan_end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        donationId,
        amount || null,
        method || null,
        item_description || null,
        estimated_value || null,
        condition || null,
        loan_start_date || null,
        loan_end_date || null
      ]
    );

    await conn.commit();
    res.json({ success: true, donationId });
  } catch (err) {
    await conn.rollback();
    console.error('Error creating donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// GET all donations (with details)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, dd.amount, dd.method, dd.item_description, dd.estimated_value, dd.\`condition\`, dd.loan_start_date, dd.loan_end_date
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       ORDER BY d.created_at DESC`
    );
    res.json({ donations: rows });
  } catch (err) {
    console.error('Error fetching donations:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// GET single donation (with details)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT d.*, dd.amount, dd.method, dd.item_description, dd.estimated_value, dd.\`condition\`, dd.loan_start_date, dd.loan_end_date
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       WHERE d.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    res.json({ donation: rows[0] });
  } catch (err) {
    console.error('Error fetching donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// UPDATE donation (PUT)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    donor_name, donor_email, donor_contact, type, date_received, notes,
    amount, method, item_description, estimated_value, condition, loan_start_date, loan_end_date
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update donations
    await conn.query(
      'UPDATE donations SET donor_name=?, donor_email=?, donor_contact=?, type=?, date_received=?, notes=? WHERE id=?',
      [donor_name, donor_email, donor_contact, type, date_received, notes, id]
    );

    // Update donation_details
    await conn.query(
      `UPDATE donation_details SET
        amount=?, method=?, item_description=?, estimated_value=?, \`condition\`=?, loan_start_date=?, loan_end_date=?
       WHERE donation_id=?`,
      [
        amount || null,
        method || null,
        item_description || null,
        estimated_value || null,
        condition || null,
        loan_start_date || null,
        loan_end_date || null,
        id
      ]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// DELETE donation
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM donations WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

module.exports = router;
