import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import MenuItem from '../components/MenuItem';

const CATEGORY_ICONS = {
  Starters: '🥗',
  'Main Course': '🍛',
  Beverages: '🥤',
  Desserts: '🍮',
};

const STATUS_META = {
  pending_approval: { label: 'Waiting for Confirmation', icon: '🔔', color: '#8e44ad', bg: '#f5eef8' },
  pending:   { label: 'Order Received',   icon: '🕐', color: '#f39c12', bg: '#fff8e1' },
  preparing: { label: 'Being Prepared',   icon: '👨‍🍳', color: '#e67e22', bg: '#fff3e0' },
  ready:     { label: 'Ready to Serve!',  icon: '🎉', color: '#27ae60', bg: '#e8f5e9' },
  served:    { label: 'Served',           icon: '✅', color: '#7f8c8d', bg: '#f5f5f5' },
};

export default function CustomerMenu() {
  const { tableId, groupId = '1' } = useParams();
  const [session, setSession] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [myOrders, setMyOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'orders'
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState('');
  const [restaurantName, setRestaurantName] = useState('AS Confectioners');
  const socketRef = useRef(null);
  const sessionRef = useRef(null);

  // Load orders for this session
  const loadOrders = useCallback(async (sessionId) => {
    try {
      const res = await api.get(`/orders/session/${sessionId}`);
      setMyOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [sessionRes, menuRes, configRes] = await Promise.all([
          api.get(`/orders/sessions/${tableId}/${groupId}`),
          api.get('/menu?available=true'),
          api.get('/config'),
        ]);

        const s = sessionRes.data;
        setSession(s);
        sessionRef.current = s;
        localStorage.setItem(`session_${tableId}_${groupId}`, s.id);

        const items = menuRes.data;
        setMenuItems(items);
        const cats = ['All', ...new Set(items.map((i) => i.category))];
        setCategories(cats);
        setRestaurantName(configRes.data.restaurantName);

        await loadOrders(s.id);
      } catch (err) {
        console.error('Init error', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tableId, loadOrders]);

  // Socket.io — listen for kitchen status updates
  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('order_updated', (data) => {
      if (data.status === 'cancelled' || data.status === 'rejected') {
        setMyOrders((prev) => prev.filter((o) => o.id !== data.orderId));
        if (data.status === 'rejected') showToast('❌ Your order was declined. Please re-order or ask staff.');
      } else if (data.status === 'session_closed') {
        setSession((prev) => prev ? { ...prev, status: 'closed' } : prev);
      } else {
        setMyOrders((prev) =>
          prev.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o))
        );
      }
      if (data.status === 'ready') {
        showToast('🎉 Your food is ready! Please collect your order.');
      } else if (data.status === 'preparing') {
        showToast('👨‍🍳 Kitchen is preparing your order!');
      }
    });

    socket.on('new_order', (data) => {
      // Reload orders if this event is for our session
      if (sessionRef.current && data.sessionId === sessionRef.current.id) {
        loadOrders(sessionRef.current.id);
      }
    });

    return () => socket.disconnect();
  }, [loadOrders]);

  const updateCart = useCallback((itemId, qty) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (qty <= 0) delete updated[itemId];
      else updated[itemId] = qty;
      return updated;
    });
  }, []);

  const filtered = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter((i) => i.category === selectedCategory);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find((m) => m.id === Number(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const hasActiveOrders = myOrders.some((o) => o.status !== 'served');
  const hasReadyOrders  = myOrders.some((o) => o.status === 'ready');

  const placeOrder = async () => {
    if (!cartCount || !session) return;
    setPlacing(true);
    try {
      const items = Object.entries(cart).map(([menuItemId, quantity]) => ({
        menuItemId: Number(menuItemId),
        quantity,
      }));
      await api.post('/orders', { sessionId: session.id, tableId, items });
      setCart({});
      await loadOrders(session.id);
      setActiveTab('orders');
      showToast('✅ Order placed! Watch it get prepared below.');
    } catch (err) {
      showToast('❌ Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ paddingBottom: cartCount > 0 ? 90 : 20 }}>
      <header className="header" style={{ background: '#6B4423' }}>
        <div className="header-inner" style={{ maxWidth: '100%', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.jpg" alt="A5 Confectioners" style={{ height: '50px', borderRadius: '4px' }} />
            <div>
              <h1 style={{ margin: '0', color: 'white', fontSize: '24px' }}>A5 Confectioners</h1>
              <p style={{ margin: '4px 0', opacity: 0.9, fontSize: '0.85rem', color: '#F5E6D3' }}>
                Table {tableId}{groupId !== '1' ? ` · Group ${groupId}` : ''}
              </p>
            </div>
          </div>
          {myOrders.length > 0 && (
            <Link
              to={`/table/${tableId}/${groupId}/bill`}
              className="btn"
              style={{ background: hasReadyOrders ? '#6B9E78' : 'rgba(255,255,255,0.25)', color: 'white', fontSize: '0.8rem', padding: '8px 14px', borderRadius: 8, fontWeight: 600 }}
            >
              {hasReadyOrders ? '🎉 Pay Now' : '🧾 Bill'}
            </Link>
          )}
        </div>

        {/* Tab bar */}
        <div className="customer-tabs" style={{ background: '#8B5A3C', borderTop: '1px solid #F5E6D3' }}>
          <button
            className={`customer-tab ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            🍽️ Menu
          </button>
          <button
            className={`customer-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 My Orders
            {hasActiveOrders && <span className="tab-badge">{myOrders.filter(o => o.status !== 'served').length}</span>}
          </button>
        </div>
      </header>

      {/* ── MENU TAB ── */}
      {activeTab === 'menu' && (
        <div className="container" style={{ paddingTop: 16 }}>
          <div className="category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {CATEGORY_ICONS[cat] || '🍽️'} {cat}
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {filtered.map((item) => (
              <MenuItem
                key={item.id}
                item={item}
                quantity={cart[item.id] || 0}
                onQuantityChange={(qty) => updateCart(item.id, qty)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── MY ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <div className="container" style={{ paddingTop: 16 }}>
          {session?.status === 'closed' ? (
            <div className="card text-center" style={{ padding: '40px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🙏</div>
              <h3 style={{ color: '#27ae60', marginBottom: 8 }}>Payment Complete!</h3>
              <p className="text-muted">Thank you for dining with us.</p>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 8 }}>Scan the QR on your table to start a new order.</p>
            </div>
          ) : myOrders.length === 0 ? (
            <div className="card text-center" style={{ padding: '40px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🛒</div>
              <p className="text-muted">No orders yet.</p>
              <button className="btn btn-primary mt-16" onClick={() => setActiveTab('menu')}>
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {myOrders.map((order, idx) => {
                const meta = STATUS_META[order.status] || STATUS_META.pending;
                return (
                  <div key={order.id} className="order-status-card" style={{ background: meta.bg, borderColor: meta.color }}>
                    <div className="order-status-header">
                      <strong>Order #{idx + 1}</strong>
                      <span className="order-status-badge" style={{ background: meta.color }}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="order-progress">
                      {['pending_approval', 'pending', 'preparing', 'ready', 'served'].map((s, i) => {
                        const statuses = ['pending_approval', 'pending', 'preparing', 'ready', 'served'];
                        const currentIdx = statuses.indexOf(order.status);
                        const done = i <= currentIdx;
                        return (
                          <React.Fragment key={s}>
                            <div className={`progress-dot ${done ? 'done' : ''}`} style={done ? { background: meta.color } : {}} />
                            {i < 4 && <div className={`progress-line ${done && i < currentIdx ? 'done' : ''}`} style={done && i < currentIdx ? { background: meta.color } : {}} />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    <div className="order-progress-labels">
                      <span>Confirm</span><span>Received</span><span>Preparing</span><span>Ready</span><span>Served</span>
                    </div>

                    <div className="order-items-list">
                      {order.items.map((item) => (
                        <div key={item.id} className="order-item-row">
                          <span>{item.name} × {item.quantity}</span>
                          <span>₹{(item.price_at_order * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {hasReadyOrders && (
                <div className="ready-banner">
                  <div style={{ fontSize: '2rem' }}>🎉</div>
                  <div>
                    <strong>Your food is ready!</strong>
                    <p>Tap below to view your bill and pay.</p>
                  </div>
                </div>
              )}

              <Link to={`/table/${tableId}/${groupId}/bill`} className="btn btn-primary w-full" style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                🧾 View Bill &amp; Pay
              </Link>

              <button
                className="btn w-full"
                style={{ marginTop: 8, background: 'white', border: '1.5px solid #e67e22', color: '#e67e22' }}
                onClick={() => setActiveTab('menu')}
              >
                + Order More Items
              </button>
            </>
          )}
        </div>
      )}

      {/* Cart bar (only on menu tab) */}
      {activeTab === 'menu' && cartCount > 0 && (
        <div className="cart-bar">
          <div className="cart-bar-info">
            <div>{cartCount} item{cartCount > 1 ? 's' : ''}</div>
            <strong>₹{cartTotal.toFixed(2)}</strong>
          </div>
          <button className="btn btn-primary" onClick={placeOrder} disabled={placing}>
            {placing ? 'Placing...' : '🛒 Place Order'}
          </button>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
