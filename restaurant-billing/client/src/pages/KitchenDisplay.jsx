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
    <div className="kitchen-bg">
      <div className="kitchen-header">
        <h1>🍳 Kitchen Display</h1>
        <div className="flex gap-12" style={{ alignItems: 'center' }}>
          <span className="text-muted" style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>
            {orders.length} active order{orders.length !== 1 ? 's' : ''}
          </span>
          <span className="live-badge">● LIVE</span>
        </div>
      </div>

      <div className="kitchen-columns">
        {['pending', 'preparing', 'ready'].map((status) => (
          <div key={status} className={`kitchen-column ${status}`}>
            <h2>
              {status === 'pending' && '⏳ Pending'}
              {status === 'preparing' && '🔥 Preparing'}
              {status === 'ready' && '✅ Ready'}
              <span style={{ marginLeft: 8, opacity: 0.7, fontWeight: 400, fontSize: '0.9rem' }}>
                ({byStatus(status).length})
              </span>
            </h2>
            {byStatus(status).length === 0 && (
              <p style={{ color: '#505070', textAlign: 'center', fontSize: '0.85rem', padding: '20px 0' }}>
                No orders
              </p>
            )}
            {byStatus(status).map((order) => {
              const action = STATUS_ACTIONS[status];
              return (
                <div key={order.id} className={`order-card-kitchen ${status}`}>
                  <div className="table-num">Table {order.table_number}</div>
                  <div className="order-time">{timeAgo(order.created_at)}</div>
                  <div style={{ marginBottom: 12 }}>
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="item-line">
                        <span className="item-qty">×{item.quantity}</span>{' '}
                        {item.name}
                      </div>
                    ))}
                  </div>
                  {action && (
                    <button
                      className={`btn ${action.btnClass} btn-sm w-full`}
                      onClick={() => updateStatus(order.id, action.next)}
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
