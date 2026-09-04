const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Get or create active session for a table + group
// groupId defaults to '1' for backward compatibility (single-QR tables)
router.get('/sessions/:tableId/:groupId?', (req, res) => {
  const { tableId } = req.params;
  const groupId = req.params.groupId || '1';
  const table = db.prepare('SELECT * FROM tables WHERE table_number = ?').get(tableId);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  let session = db.prepare(
    "SELECT * FROM sessions WHERE table_id = ? AND group_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1"
  ).get(table.id, groupId);

  if (!session) {
    const result = db.prepare(
      "INSERT INTO sessions (table_id, group_id, status) VALUES (?, ?, 'active')"
    ).run(table.id, groupId);
    session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
  }

  res.json({ id: session.id, tableId: table.table_number, tableDbId: table.id, groupId: session.group_id, status: session.status, created_at: session.created_at });
});

// Place a new order — goes to admin for approval first
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
      "INSERT INTO orders (session_id, table_id, status) VALUES (?, ?, 'pending_approval')"
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
    // Notify admin — order needs approval before going to kitchen
    io.emit('order_pending_approval', {
      orderId,
      tableNumber: table.table_number,
      tableLabel: table.label,
      groupId: session.group_id,
      sessionId,
      status: 'pending_approval',
      created_at: order.created_at,
      items: orderItemDetails,
    });

    res.status(201).json({ orderId, message: 'Order placed — waiting for admin confirmation' });
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

  const io = req.app.get('io');
  io.emit('session_closed', { sessionId: Number(sessionId) });

  res.json({ success: true, message: 'Session closed' });
});

// Approve an order (admin → sends to kitchen)
router.patch('/:orderId/approve', auth, (req, res) => {
  const { orderId } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'pending_approval') {
    return res.status(400).json({ error: 'Order is not awaiting approval' });
  }

  db.prepare("UPDATE orders SET status = 'pending' WHERE id = ?").run(orderId);

  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(order.table_id);
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(order.session_id);
  const items = db.prepare(`
    SELECT oi.*, mi.name, mi.category
    FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = ?
  `).all(orderId);

  const io = req.app.get('io');
  // Tell kitchen about the new approved order
  io.emit('new_order', {
    orderId: Number(orderId),
    tableNumber: table.table_number,
    tableLabel: table.label,
    groupId: session?.group_id,
    sessionId: order.session_id,
    status: 'pending',
    created_at: order.created_at,
    items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price_at_order })),
  });
  // Also notify customer
  io.emit('order_updated', { orderId: Number(orderId), status: 'pending' });

  res.json({ success: true, status: 'pending' });
});

// Reject an order (admin deletes it, notifies customer)
router.patch('/:orderId/reject', auth, (req, res) => {
  const { orderId } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);
  db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);

  const io = req.app.get('io');
  io.emit('order_updated', { orderId: Number(orderId), status: 'rejected' });

  res.json({ success: true });
});

// Get all active sessions with full bill details (for admin)
router.get('/bills', auth, (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*, t.table_number, t.label as table_label
    FROM sessions s
    JOIN tables t ON s.table_id = t.id
    WHERE s.status = 'active'
    ORDER BY s.created_at ASC
  `).all();

  const result = sessions.map((session) => {
    const orders = db.prepare(`
      SELECT * FROM orders WHERE session_id = ? ORDER BY created_at ASC
    `).all(session.id);

    const ordersWithItems = orders.map((order) => {
      const items = db.prepare(`
        SELECT oi.*, mi.name, mi.category
        FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
      `).all(order.id);
      return { ...order, items };
    });

    const subtotal = ordersWithItems.reduce((sum, o) =>
      sum + o.items.reduce((s, i) => s + i.price_at_order * i.quantity, 0), 0
    );

    return {
      sessionId: session.id,
      tableNumber: session.table_number,
      tableLabel: session.table_label,
      groupId: session.group_id,
      createdAt: session.created_at,
      orders: ordersWithItems,
      subtotal: Math.round(subtotal * 100) / 100,
      grandTotal: Math.round(subtotal * 1.05 * 100) / 100,
      orderCount: ordersWithItems.filter(o => o.status !== 'pending_approval').length,
      pendingApproval: ordersWithItems.filter(o => o.status === 'pending_approval').length,
    };
  });

  res.json(result);
});

// Get all bills history (closed sessions) with optional date filtering
router.get('/bills-history', auth, (req, res) => {
  const { date } = req.query;
  let query = `
    SELECT s.*, t.table_number, t.label as table_label
    FROM sessions s
    JOIN tables t ON s.table_id = t.id
    WHERE s.status = 'closed'
  `;
  const params = [];

  if (date) {
    query += ` AND DATE(s.created_at) = ?`;
    params.push(date);
  }

  query += ` ORDER BY s.created_at DESC`;

  const sessions = db.prepare(query).all(...params);

  const result = sessions.map((session) => {
    const orders = db.prepare(`
      SELECT * FROM orders WHERE session_id = ? ORDER BY created_at ASC
    `).all(session.id);

    const ordersWithItems = orders.map((order) => {
      const items = db.prepare(`
        SELECT oi.*, mi.name, mi.category
        FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
      `).all(order.id);
      return { ...order, items };
    });

    const subtotal = ordersWithItems.reduce((sum, o) =>
      sum + o.items.reduce((s, i) => s + i.price_at_order * i.quantity, 0), 0
    );

    return {
      sessionId: session.id,
      tableNumber: session.table_number,
      tableLabel: session.table_label,
      groupId: session.group_id,
      createdAt: session.created_at,
      orders: ordersWithItems,
      subtotal: Math.round(subtotal * 100) / 100,
      grandTotal: Math.round(subtotal * 1.05 * 100) / 100,
      orderCount: ordersWithItems.filter(o => o.status !== 'pending_approval').length,
    };
  });

  res.json(result);
});

// Delete a bill history entry (soft-delete or hard-delete for closed sessions only)
router.delete('/bills-history/:sessionId', auth, (req, res) => {
  const { sessionId } = req.params;
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.status !== 'closed') {
    return res.status(400).json({ error: 'Cannot delete active sessions' });
  }

  const deleteSession = db.transaction(() => {
    db.prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE session_id = ?)').run(sessionId);
    db.prepare('DELETE FROM orders WHERE session_id = ?').run(sessionId);
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  });

  try {
    deleteSession();
    res.json({ success: true, message: 'Bill deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

// Cancel a single order item (only if order is still pending)
router.delete('/:orderId/items/:itemId', (req, res) => {
  const { orderId, itemId } = req.params;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!['pending', 'pending_approval'].includes(order.status)) {
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

// Cancel entire order (only if pending or pending_approval)
router.delete('/:orderId', (req, res) => {
  const { orderId } = req.params;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!['pending', 'pending_approval'].includes(order.status)) {
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

// Get all live orders for kitchen (excludes pending_approval — admin must approve first)
router.get('/live', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, t.table_number, t.label as table_label
    FROM orders o
    JOIN tables t ON o.table_id = t.id
    WHERE o.status NOT IN ('served', 'pending_approval')
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

// Get best seller items from closed bills
router.get('/best-sellers', auth, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT 
        mi.id,
        mi.name,
        mi.category,
        mi.price,
        COUNT(oi.id) as times_ordered,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.price_at_order) as total_revenue
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      JOIN sessions s ON o.session_id = s.id
      WHERE s.status = 'closed'
      GROUP BY mi.id
      ORDER BY total_quantity DESC
      LIMIT 20
    `).all();
    
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch best sellers' });
  }
});

// Generate shareable bill link (public endpoint)
router.get('/bill-share/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Bill not found' });
  }

  const orders = db.prepare('SELECT * FROM orders WHERE session_id = ? ORDER BY created_at ASC').all(sessionId);
  const ordersWithItems = orders.map(order => {
    const items = db.prepare(`
      SELECT oi.*, mi.name, mi.category
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `).all(order.id);
    return { ...order, items };
  });

  const subtotal = ordersWithItems.reduce((sum, o) =>
    sum + o.items.reduce((s, i) => s + i.price_at_order * i.quantity, 0), 0
  );

  const bill = {
    sessionId: session.id,
    tableNumber: session.table_number || 'N/A',
    groupId: session.group_id,
    createdAt: session.created_at,
    orders: ordersWithItems,
    subtotal: Math.round(subtotal * 100) / 100,
    grandTotal: Math.round(subtotal * 1.05 * 100) / 100,
  };

  res.json(bill);
});

// Close a bill and move to history
router.patch('/bills/:sessionId/close', auth, (req, res) => {
  const { sessionId } = req.params;
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    db.prepare("UPDATE sessions SET status = 'closed' WHERE id = ?").run(sessionId);
    
    const io = req.app.get('io');
    io.emit('bill_closed', { sessionId: Number(sessionId) });

    res.json({ success: true, message: 'Bill closed and moved to history' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to close bill' });
  }
});

// Send bill via SMS
router.post('/bill-share/send-sms', auth, async (req, res) => {
  const { sessionId, phoneNumber } = req.body;
  
  if (!sessionId || !phoneNumber) {
    return res.status(400).json({ error: 'sessionId and phoneNumber are required' });
  }

  try {
    const smsService = require('../services/smsService');
    const result = await smsService.sendBillShareSMS(phoneNumber, sessionId, 'A5 Confectioners');
    
    if (result.success) {
      res.json({ success: true, message: result.message, data: result });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (err) {
    console.error('SMS endpoint error:', err);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

// Get SMS text for manual sending
router.get('/bill-share/:sessionId/sms-text', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const smsService = require('../services/smsService');
    const smsText = smsService.generateBillSMSText(sessionId, 'A5 Confectioners');
    res.json({ smsText });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate SMS text' });
  }
});

module.exports = router;
