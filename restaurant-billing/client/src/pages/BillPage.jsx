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
  const { tableId } = useParams();
  const [orders, setOrders] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [config, setConfig] = useState({ upiId: '', restaurantName: 'My Restaurant' });
  const [loading, setLoading] = useState(true);

  const sessionId = localStorage.getItem(`session_${tableId}`);

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

  // Real-time status updates via Socket.io
  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socket.on('order_updated', (data) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o))
      );
    });
    return () => socket.disconnect();
  }, []);

  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  const grandTotal = Math.round((subtotal + gst) * 100) / 100;

  const allReady   = orders.length > 0 && orders.every((o) => o.status === 'ready' || o.status === 'served');
  const anyReady   = orders.some((o) => o.status === 'ready');
  const allServed  = orders.length > 0 && orders.every((o) => o.status === 'served');

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <div>
            <h1>🧾 Your Bill</h1>
            <p style={{ opacity: 0.85, fontSize: '0.85rem' }}>Table {tableId}</p>
          </div>
          <Link
            to={`/table/${tableId}`}
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
            <Link to={`/table/${tableId}`} className="btn btn-primary mt-16" style={{ display: 'inline-flex' }}>
              Go to Menu
            </Link>
          </div>
        ) : (
          <>
            {/* Ready banner */}
            {anyReady && !allServed && (
              <div className="ready-banner" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '2rem' }}>🎉</div>
                <div>
                  <strong>Your food is ready!</strong>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Please pay below to complete your visit.</p>
                </div>
              </div>
            )}

            {/* Order cards */}
            {orders.map((order, idx) => {
              const meta = STATUS_META[order.status] || STATUS_META.pending;
              return (
                <div key={order.id} className="card mb-16">
                  <div className="flex-between mb-16">
                    <strong>Order #{idx + 1}</strong>
                    <span className="order-status-badge" style={{ background: meta.color, fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20, color: 'white', fontWeight: 600 }}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                  {order.items.map((item) => (
                    <div key={item.id} className="bill-row">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{(item.price_at_order * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Totals */}
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

            {/* UPI Payment — always visible but prominent when food is ready */}
            <div className="card" style={allReady || anyReady ? { border: '2px solid #27ae60', boxShadow: '0 4px 20px rgba(39,174,96,0.2)' } : {}}>
              {!anyReady && !allServed && (
                <p className="text-muted text-center" style={{ marginBottom: 12, fontSize: '0.85rem' }}>
                  ⏳ You can pay once your food is ready
                </p>
              )}
              <UpiPayment
                amount={grandTotal}
                restaurantName={config.restaurantName}
                upiId={config.upiId}
              />
            </div>

            <Link
              to={`/table/${tableId}`}
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
