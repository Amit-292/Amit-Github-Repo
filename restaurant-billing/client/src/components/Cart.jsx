import React from 'react';

export default function Cart({ cart, menuItems, onQuantityChange, onPlaceOrder, placing }) {
  const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
  const total = cartEntries.reduce((sum, [id, qty]) => {
    const item = menuItems.find((m) => m.id === Number(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);
  const count = cartEntries.reduce((s, [, q]) => s + q, 0);

  if (count === 0) return null;

  return (
    <div className="cart-bar">
      <div className="cart-bar-info">
        <div>{count} item{count > 1 ? 's' : ''}</div>
        <strong>₹{total.toFixed(2)}</strong>
      </div>
      <button className="btn btn-primary" onClick={onPlaceOrder} disabled={placing}>
        {placing ? 'Placing...' : '🛒 Place Order'}
      </button>
    </div>
  );
}
