const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { available } = req.query;
  let items;
  if (available === 'true') {
    items = db.prepare('SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name').all();
  } else {
    items = db.prepare('SELECT * FROM menu_items ORDER BY category, name').all();
  }
  res.json(items);
});

router.post('/', auth, (req, res) => {
  const { name, description = '', price, category = 'Main Course', image_url = '', available = 1 } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  const result = db.prepare(
    'INSERT INTO menu_items (name, description, price, category, image_url, available) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, description, price, category, image_url, available ? 1 : 0);
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, image_url, available } = req.body;
  const existing = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  db.prepare(`
    UPDATE menu_items SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      category = COALESCE(?, category),
      image_url = COALESCE(?, image_url),
      available = COALESCE(?, available)
    WHERE id = ?
  `).run(name, description, price, category, image_url, available != null ? (available ? 1 : 0) : null, id);

  const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  res.json(updated);
});

router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
