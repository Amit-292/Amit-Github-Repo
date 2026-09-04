const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Submit feedback (public — no auth required)
router.post('/', (req, res) => {
  const { sessionId, tableNumber, groupId, foodRating, staffRating, improvements, contact, email, dob, anniversary } = req.body;
  try {
    db.prepare(`
      INSERT INTO feedbacks (session_id, table_number, group_id, food_rating, staff_rating, improvements, contact, email, dob, anniversary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId || null,
      tableNumber || '',
      groupId || '1',
      foodRating || null,
      staffRating || null,
      improvements || '',
      contact || '',
      email || '',
      dob || '',
      anniversary || ''
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Get all feedback (admin only)
router.get('/', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM feedbacks ORDER BY created_at DESC').all();
  res.json(rows);
});

// Get feedback with date filtering (admin only)
router.get('/filtered', auth, (req, res) => {
  const { date } = req.query;
  let query = 'SELECT * FROM feedbacks WHERE 1=1';
  const params = [];

  if (date) {
    query += ' AND DATE(created_at) = ?';
    params.push(date);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// Delete selected feedbacks (admin only)
router.delete('/', auth, (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'ids array required' });
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM feedbacks WHERE id IN (${placeholders})`).run(...ids);
  res.json({ success: true, deleted: ids.length });
});

module.exports = router;
