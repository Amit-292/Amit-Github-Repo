import React from 'react';

const STATUS_LABEL = { pending: 'Pending', preparing: 'Preparing', ready: 'Ready! 🎉', served: 'Served' };

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr + 'Z')) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function OrderCard({ order, onStatusChange }) {
  return (
    <div className={`order-card-kitchen ${order.status}`}>
      <div className="table-num">Table {order.table_number}</div>
      <div className="order-time">{timeAgo(order.created_at)}</div>
      <span className={`badge badge-${order.status}`}>{STATUS_LABEL[order.status]}</span>
      <div style={{ margin: '10px 0' }}>
        {(order.items || []).map((item, i) => (
          <div key={i} className="item-line">
            <span className="item-qty">×{item.quantity}</span> {item.name}
          </div>
        ))}
      </div>
      {onStatusChange && (
        <button className="btn btn-primary btn-sm w-full" onClick={() => onStatusChange(order)}>
          Next Status
        </button>
      )}
    </div>
  );
}
