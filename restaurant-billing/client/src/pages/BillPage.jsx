import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import UpiPayment from '../components/UpiPayment';

const STATUS_META = {
  pending:   { label: 'Order Received', icon: '🕐', color: '#f39c12' },
  preparing: { label: 'Being Prepared', icon: '👨‍🍳', color: '#e67e22' },
  ready:     { label: 'Ready! 🎉',      icon: '🎉', color: '#27ae60' },
  served:    { label: 'Served',         icon: '✅', color: '#7f8c8d' },
};

const GST_RATE = 0.05;

export default function BillPage() {
  const { tableId, groupId = '1' } = useParams();
  const [orders, setOrders] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [config, setConfig] = useState({ upiId: '', restaurantName: 'AS Confectioners' });
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null); // itemId or orderId being removed

  const sessionId = localStorage.getItem(`session_${tableId}_${groupId}`);

  const loadBill = useCallback(async () => {
    if (!sessionId) { setLoading(false); return; }
    try {
      const [billRes, configRes] = await Promise.all([
        api.get(`/orders/session/${sessionId}`),
        api.get('/config'),
      ]);
      setOrders(billRes.data.orders);
      setSubtotal(billRes.data.total);
      setConfig(configRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { loadBill(); }, [loadBill]);

  // Real-time status updates
  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socket.on('order_updated', (data) => {
      if (data.status === 'cancelled') {
        setOrders((prev) => prev.filter((o) => o.id !== data.orderId));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o))
        );
      }
    });
    return () => socket.disconnect();
  }, []);

  // Recalculate subtotal whenever orders change
  useEffect(() => {
    const total = orders.reduce((sum, order) =>
      sum + order.items.reduce((s, item) => s + item.price_at_order * item.quantity, 0), 0
    );
    setSubtotal(Math.round(total * 100) / 100);
  }, [orders]);

  const removeItem = async (orderId, itemId, itemName) => {
    if (!window.confirm(`Remove "${itemName}" from your order?`)) return;
    setRemoving(itemId);
    try {
      const res = await api.delete(`/orders/${orderId}/items/${itemId}`);
      if (res.data.orderCancelled) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        setOrders((prev) => prev.map((o) =>
          o.id === orderId ? { ...o, items: o.items.filter((i) => i.id !== itemId) } : o
        ));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove item');
    } finally {
      setRemoving(null);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this entire order?')) return;
    setRemoving(`order_${orderId}`);
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setRemoving(null);
    }
  };

  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  const grandTotal = Math.round((subtotal + gst) * 100) / 100;

  const anyReady  = orders.some((o) => o.status === 'ready');
  const allServed = orders.length > 0 && orders.every((o) => o.status === 'served');

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <div>
            <h1>🧾 Your Bill</h1>
            <p style={{ opacity: 0.85, fontSize: '0.85rem' }}>
                Table {tableId}{groupId !== '1' ? ` · Group ${groupId}` : ''}
              </p>
          </div>
          <Link
            to={`/table/${tableId}/${groupId}`}
            className="btn"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.85rem', padding: '8px 14px', borderRadius: 8 }}
          >
            ← Menu
          </Link>
        </div>
      </header>

      <div className="container" style={{ paddingTop: 20 }}>
        {orders.length === 0 ? (
          <div className="card text-center" style={{ padding: '40px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🛒</div>
            <p className="text-muted">No orders yet. Head back to the menu!</p>
            <Link to={`/table/${tableId}/${groupId}`} className="btn btn-primary mt-16" style={{ display: 'inline-flex' }}>
              Go to Menu
            </Link>
          </div>
        ) : (
          <>
            {anyReady && !allServed && (
              <div className="ready-banner" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '2rem' }}>🎉</div>
                <div>
                  <strong>Your food is ready!</strong>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Please pay below to complete your visit.</p>
                </div>
              </div>
            )}

            {orders.map((order, idx) => {
              const meta = STATUS_META[order.status] || STATUS_META.pending;
              const isPending = order.status === 'pending';
              return (
                <div key={order.id} className="card mb-16">
                  <div className="flex-between mb-16">
                    <strong>Order #{idx + 1}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="order-status-badge" style={{ background: meta.color, fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20, color: 'white', fontWeight: 600 }}>
                        {meta.icon} {meta.label}
                      </span>
                      {isPending && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          disabled={removing === `order_${order.id}`}
                          style={{ background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          {removing === `order_${order.id}` ? '...' : '🗑 Cancel Order'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isPending && (
                    <p style={{ fontSize: '0.75rem', color: '#f39c12', marginBottom: 10, marginTop: -8 }}>
                      ⚡ Tap ✕ to remove an item before kitchen starts
                    </p>
                  )}

                  {order.items.map((item) => (
                    <div key={item.id} className="bill-row" style={{ alignItems: 'center' }}>
                      <span style={{ flex: 1 }}>{item.name} × {item.quantity}</span>
                      <span style={{ marginRight: isPending ? 10 : 0 }}>₹{(item.price_at_order * item.quantity).toFixed(2)}</span>
                      {isPending && (
                        <button
                          onClick={() => removeItem(order.id, item.id, item.name)}
                          disabled={removing === item.id}
                          style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '1.1rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                          title="Remove item"
                        >
                          {removing === item.id ? '…' : '✕'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            <div className="card mb-16">
              <div className="bill-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="bill-row">
                <span>GST (5%)</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <hr className="bill-divider" />
              <div className="bill-row bill-total">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="card" style={anyReady ? { border: '2px solid #27ae60', boxShadow: '0 4px 20px rgba(39,174,96,0.2)' } : {}}>
              {!anyReady && !allServed && (
                <p className="text-muted text-center" style={{ marginBottom: 12, fontSize: '0.85rem' }}>
                  ⏳ You can pay once your food is ready
                </p>
              )}
              <UpiPayment amount={grandTotal} restaurantName={config.restaurantName} upiId={config.upiId} sessionId={sessionId} tableId={tableId} />
            </div>

            <Link
              to={`/table/${tableId}/${groupId}`}
              className="btn w-full"
              style={{ display: 'flex', justifyContent: 'center', marginTop: 12, background: 'white', border: '1.5px solid #e67e22', color: '#e67e22' }}
            >
              + Order More Items
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
