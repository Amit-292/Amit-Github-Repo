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

module.exports = router;
