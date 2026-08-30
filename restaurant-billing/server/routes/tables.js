const express = require('express');
const QRCode = require('qrcode');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const tables = db.prepare('SELECT * FROM tables ORDER BY CAST(table_number AS INTEGER)').all();
  res.json(tables);
});

router.post('/', auth, (req, res) => {
  const { table_number, label = '' } = req.body;
  if (!table_number) return res.status(400).json({ error: 'table_number is required' });
  try {
    const result = db.prepare('INSERT INTO tables (table_number, label) VALUES (?, ?)').run(table_number, label);
    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(table);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Table number already exists' });
    }
    throw err;
  }
});

router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
  if (!table) return res.status(404).json({ error: 'Table not found' });
  db.prepare('DELETE FROM tables WHERE id = ?').run(id);
  res.json({ success: true });
});

router.get('/:tableId/qr', auth, async (req, res) => {
  const { tableId } = req.params;
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const tableUrl = `${clientUrl}/table/${table.table_number}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(tableUrl, { width: 300, margin: 2 });
    res.json({ qr: qrDataUrl, tableNumber: table.table_number, url: tableUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

module.exports = router;
