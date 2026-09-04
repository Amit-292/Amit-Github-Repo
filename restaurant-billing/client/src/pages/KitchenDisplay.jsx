import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api';

const STATUS_ACTIONS = {
  pending: { label: '👨‍🍳 Start Preparing', next: 'preparing', btnClass: 'btn-primary' },
  preparing: { label: '✅ Mark Ready', next: 'ready', btnClass: 'btn-success' },
  ready: { label: '🍽️ Mark Served', next: 'served', btnClass: 'btn-outline' },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr + 'Z')) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/orders/live');
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();

    const socket = io();
    socket.on('new_order', (order) => {
      // Only show orders that have been approved by admin
      if (order.status !== 'pending_approval') {
        setOrders((prev) => [...prev, order]);
      }
    });
    socket.on('order_updated', ({ orderId, status }) => {
      if (status === 'served') {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    });

    const timer = setInterval(() => forceUpdate((n) => n + 1), 30000);

    return () => {
      socket.disconnect();
      clearInterval(timer);
    };
  }, []);

  const updateStatus = async (orderId, nextStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const byStatus = (status) => orders.filter((o) => o.status === status);

  return (
    <div className="kitchen-bg" style={{ background: 'linear-gradient(135deg, #F5E6D3 0%, #FAF6F1 100%)', minHeight: '100vh' }}>
      <div className="kitchen-header" style={{ background: '#6B4423', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #4a2c17' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.jpg" alt="A5 Confectioners" style={{ height: '50px' }} />
          <h1 style={{ color: 'white', margin: 0 }}>🍳 Kitchen Display</h1>
        </div>
        <div className="flex gap-12" style={{ alignItems: 'center' }}>
          <span className="text-muted" style={{ color: '#F5E6D3', fontSize: '0.85rem' }}>
            {orders.length} active order{orders.length !== 1 ? 's' : ''}
          </span>
          <span className="live-badge" style={{ background: '#C85C54', color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: '600', fontSize: '0.8rem' }}>● LIVE</span>
        </div>
      </div>

      <div className="kitchen-columns" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', padding: '20px' }}>
        {['pending', 'preparing', 'ready'].map((status) => (
          <div key={status} className={`kitchen-column ${status}`} style={{ background: 'white', borderRadius: '8px', border: '2px solid #D4C4B0', boxShadow: '0 2px 8px rgba(107, 68, 35, 0.1)', padding: '16px' }}>
            <h2 style={{ color: '#6B4423', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #8B5A3C' }}>
              {status === 'pending' && '⏳ Pending'}
              {status === 'preparing' && '🔥 Preparing'}
              {status === 'ready' && '✅ Ready'}
              <span style={{ marginLeft: 8, opacity: 0.7, fontWeight: 400, fontSize: '0.9rem' }}>
                ({byStatus(status).length})
              </span>
            </h2>
            {byStatus(status).length === 0 && (
              <p style={{ color: '#999', textAlign: 'center', fontSize: '0.85rem', padding: '20px 0' }}>
                No orders
              </p>
            )}
            {byStatus(status).map((order) => {
              const action = STATUS_ACTIONS[status];
              return (
                <div key={order.id} className={`order-card-kitchen ${status}`} style={{ background: '#F5E6D3', border: '1px solid #D4C4B0', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                  <div className="table-num" style={{ background: '#6B4423', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Table {order.table_number}</div>
                  <div className="order-time" style={{ color: '#8B5A3C', fontSize: '0.8rem', marginBottom: '8px' }}>{timeAgo(order.created_at)}</div>
                  <div style={{ marginBottom: 12 }}>
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="item-line" style={{ color: '#3D2817', fontSize: '0.9rem', marginBottom: '4px' }}>
                        <span className="item-qty" style={{ background: '#8B5A3C', color: 'white', padding: '2px 6px', borderRadius: '3px', marginRight: '6px' }}>×{item.quantity}</span>{' '}
                        {item.name}
                      </div>
                    ))}
                  </div>
                  {action && (
                    <button
                      className={`btn ${action.btnClass} btn-sm w-full`}
                      onClick={() => updateStatus(order.id, action.next)}
                      style={{ background: '#6B4423', color: 'white', fontWeight: '600' }}
                    >
                      {action.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
