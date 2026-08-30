const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Get or create active session for a table
router.get('/sessions/:tableId', (req, res) => {
  const { tableId } = req.params;
  const table = db.prepare('SELECT * FROM tables WHERE table_number = ?').get(tableId);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  let session = db.prepare(
    "SELECT * FROM sessions WHERE table_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1"
  ).get(table.id);

  if (!session) {
    const result = db.prepare(
      "INSERT INTO sessions (table_id, status) VALUES (?, 'active')"
    ).run(table.id);
    session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
  }

  res.json({ id: session.id, tableId: table.table_number, tableDbId: table.id, status: session.status, created_at: session.created_at });
});

// Place a new order
router.post('/', (req, res) => {
  const { sessionId, tableId, items } = req.body;
  if (!sessionId || !tableId || !items || !items.length) {
    return res.status(400).json({ error: 'sessionId, tableId, and items are required' });
  }

  const table = db.prepare('SELECT * FROM tables WHERE table_number = ?').get(String(tableId));
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND status = ?').get(sessionId, 'active');
  if (!session) return res.status(404).json({ error: 'Session not found or not active' });

  const insertOrder = db.transaction(() => {
    const orderResult = db.prepare(
      "INSERT INTO orders (session_id, table_id, status) VALUES (?, ?, 'pending')"
    ).run(sessionId, table.id);
    const orderId = orderResult.lastInsertRowid;

    const orderItemDetails = [];
    for (const item of items) {
      const menuItem = db.prepare('SELECT * FROM menu_items WHERE id = ? AND available = 1').get(item.menuItemId);
      if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found or unavailable`);

      db.prepare(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order) VALUES (?, ?, ?, ?)'
      ).run(orderId, menuItem.id, item.quantity, menuItem.price);

      orderItemDetails.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
      });
    }
    return { orderId, orderItemDetails };
  });

  try {
    const { orderId, orderItemDetails } = insertOrder();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    const io = req.app.get('io');
    io.emit('new_order', {
      orderId,
      tableNumber: table.table_number,
      tableLabel: table.label,
      sessionId,
      status: 'pending',
      created_at: order.created_at,
      items: orderItemDetails,
    });

    res.status(201).json({ orderId, message: 'Order placed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all orders for a session (bill)
router.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const orders = db.prepare(
    "SELECT * FROM orders WHERE session_id = ? ORDER BY created_at ASC"
  ).all(sessionId);

  const result = orders.map((order) => {
    const items = db.prepare(`
      SELECT oi.*, mi.name, mi.category
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `).all(order.id);
    return { ...order, items };
  });

  const total = result.reduce((sum, order) => {
    return sum + order.items.reduce((s, item) => s + item.price_at_order * item.quantity, 0);
  }, 0);

  res.json({ orders: result, total: Math.round(total * 100) / 100 });
});

// Close a session (customer paid)
router.patch('/sessions/:sessionId/close', (req, res) => {
  const { sessionId } = req.params;
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  db.prepare("UPDATE sessions SET status = 'closed' WHERE id = ?").run(sessionId);
  res.json({ success: true, message: 'Session closed' });
});

// Cancel a single order item (only if order is still pending)
router.delete('/:orderId/items/:itemId', (req, res) => {
  const { orderId, itemId } = req.params;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'pending') {
    return res.status(400).json({ error: 'Cannot remove item — kitchen has already started this order.' });
  }

  const removeItem = db.transaction(() => {
    db.prepare('DELETE FROM order_items WHERE id = ? AND order_id = ?').run(itemId, orderId);
    // If no items left, cancel the whole order
    const remaining = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE order_id = ?').get(orderId);
    if (remaining.count === 0) {
      db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
      return { orderCancelled: true };
    }
    return { orderCancelled: false };
  });

  const result = removeItem();
  const io = req.app.get('io');
  io.emit('order_updated', { orderId: Number(orderId), status: result.orderCancelled ? 'cancelled' : order.status });
  res.json({ success: true, ...result });
});

// Cancel entire order (only if pending)
router.delete('/:orderId', (req, res) => {
  const { orderId } = req.params;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'pending') {
    return res.status(400).json({ error: 'Cannot cancel — kitchen has already started this order.' });
  }

  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);
  db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);

  const io = req.app.get('io');
  io.emit('order_updated', { orderId: Number(orderId), status: 'cancelled' });
  res.json({ success: true, message: 'Order cancelled' });
});

// Update order status
router.patch('/:orderId/status', auth, (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready', 'served'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);

  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(order.table_id);
  const items = db.prepare(`
    SELECT oi.*, mi.name FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = ?
  `).all(orderId);

  const io = req.app.get('io');
  io.emit('order_updated', {
    orderId: Number(orderId),
    status,
    tableNumber: table?.table_number,
    items,
  });

  res.json({ success: true, status });
});

// Get all live orders for kitchen
router.get('/live', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, t.table_number, t.label as table_label
    FROM orders o
    JOIN tables t ON o.table_id = t.id
    WHERE o.status != 'served'
    ORDER BY o.created_at ASC
  `).all();

  const result = orders.map((order) => {
    const items = db.prepare(`
      SELECT oi.*, mi.name, mi.category
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `).all(order.id);
    return { ...order, items };
  });

  res.json(result);
});

module.exports = router;
