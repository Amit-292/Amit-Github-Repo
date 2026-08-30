import React from 'react';

const CATEGORY_ICONS = { Starters: '🥗', 'Main Course': '🍛', Beverages: '🥤', Desserts: '🍮' };
const CATEGORY_COLORS = { Starters: '#27ae60', 'Main Course': '#e67e22', Beverages: '#3498db', Desserts: '#9b59b6' };

export default function MenuItem({ item, quantity, onQuantityChange }) {
  const icon = CATEGORY_ICONS[item.category] || '🍽️';
  const color = CATEGORY_COLORS[item.category] || '#e67e22';

  return (
    <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', opacity: item.available ? 1 : 0.5 }}>
      <div style={{
        width: 72, height: 72, borderRadius: 10, flexShrink: 0,
        overflow: 'hidden', background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
        ) : null}
        <span style={{ fontSize: '2rem', display: item.image_url ? 'none' : 'flex' }}>{icon}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex-between">
          <strong style={{ fontSize: '0.95rem' }}>{item.name}</strong>
          <span style={{ color: '#e67e22', fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', marginLeft: 8 }}>₹{item.price}</span>
        </div>
        {item.description && (
          <p style={{ fontSize: '0.8rem', color: '#888', marginTop: 2, marginBottom: 8 }}>{item.description}</p>
        )}

        {!item.available ? (
          <span className="badge badge-served">Unavailable</span>
        ) : quantity === 0 ? (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onQuantityChange(1)}
          >
            + Add
          </button>
        ) : (
          <div className="qty-control">
            <button className="qty-btn" onClick={() => onQuantityChange(quantity - 1)}>−</button>
            <span className="qty-count">{quantity}</span>
            <button className="qty-btn" onClick={() => onQuantityChange(quantity + 1)}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}
