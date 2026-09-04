import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/OrderReview.css';

export default function OrderReview() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState({});
  const [menuItems, setMenuItems] = useState({});
  const [specialNotes, setSpecialNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const storedCart = sessionStorage.getItem('orderCart');
    const storedSession = sessionStorage.getItem('orderSession');

    if (storedCart && storedSession) {
      setCart(JSON.parse(storedCart));
      setSession(JSON.parse(storedSession));
    } else {
      navigate(`/table/${tableId}`);
      return;
    }

    loadMenuItems();
  }, [tableId, navigate]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/menu');
      const itemsMap = {};
      response.data.forEach(item => {
        itemsMap[item.id] = item;
      });
      setMenuItems(itemsMap);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    Object.entries(cart).forEach(([menuItemId, quantity]) => {
      const item = menuItems[menuItemId];
      if (item) {
        subtotal += item.price * quantity;
      }
    });
    const gst = subtotal * 0.05;
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  const handleQuantityChange = (menuItemId, change) => {
    setCart(prev => {
      const newCart = { ...prev };
      const newQuantity = (newCart[menuItemId] || 0) + change;
      if (newQuantity <= 0) {
        delete newCart[menuItemId];
      } else {
        newCart[menuItemId] = newQuantity;
      }
      return newCart;
    });
  };

  const handleRemoveItem = (menuItemId) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[menuItemId];
      return newCart;
    });
  };

  const handleBackToMenu = () => {
    sessionStorage.setItem('orderCart', JSON.stringify(cart));
    navigate(`/table/${tableId}`);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (Object.keys(cart).length === 0) {
      setError('❌ Please add items to your order');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const items = Object.entries(cart).map(([menuItemId, quantity]) => ({
        menuItemId: Number(menuItemId),
        quantity,
      }));

      await api.post('/orders', {
        sessionId: session.id,
        tableId: Number(tableId),
        items,
        specialNotes: specialNotes || undefined,
      });

      // Clear stored data
      sessionStorage.removeItem('orderCart');
      sessionStorage.removeItem('orderSession');
      setCart({});

      // Show success and navigate back to menu
      navigate(`/table/${tableId}`, {
        state: { success: '✅ Order submitted for approval!' },
      });
    } catch (err) {
      setError('❌ Failed to place order. Please try again.');
      console.error('Order submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const cartItems = Object.entries(cart)
    .map(([menuItemId, quantity]) => ({
      id: menuItemId,
      quantity,
      ...menuItems[menuItemId],
    }))
    .filter(item => item.name);

  const { subtotal, gst, total } = calculateTotals();

  if (loading) {
    return (
      <div className="order-review-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-review-container">
      <div className="review-wrapper">
        {/* Header */}
        <div className="review-header">
          <h1>🔍 Review Your Order</h1>
          <p className="review-subtitle">Table {tableId} • Make any changes before sending to kitchen</p>
        </div>

        {/* Error Message */}
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmitOrder} className="review-form">
          {/* Items Section */}
          <div className="review-section items-section">
            <h2 className="section-title">📋 Order Items</h2>

            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <p className="empty-icon">🛒</p>
                <p className="empty-text">No items in your cart</p>
              </div>
            ) : (
              <div className="items-list">
                {cartItems.map(item => (
                  <div key={item.id} className="review-item">
                    <div className="item-details">
                      <div className="item-header">
                        <h3 className="item-name">{item.name}</h3>
                        <span className="item-category">{item.category}</span>
                      </div>
                      <p className="item-price">₹{item.price.toFixed(2)}</p>
                    </div>

                    <div className="item-controls">
                      <div className="quantity-control">
                        <button
                          type="button"
                          className="qty-btn qty-minus"
                          onClick={() => handleQuantityChange(item.id, -1)}
                        >
                          −
                        </button>
                        <span className="qty-display">{item.quantity}</span>
                        <button
                          type="button"
                          className="qty-btn qty-plus"
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                      <p className="item-subtotal">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Special Instructions Section */}
          <div className="review-section notes-section">
            <h2 className="section-title">✏️ Special Instructions</h2>
            <textarea
              className="notes-input"
              placeholder="Any special requests or allergies? (optional)"
              value={specialNotes}
              onChange={e => setSpecialNotes(e.target.value)}
              maxLength={500}
            />
            <p className="char-count">{specialNotes.length}/500</p>
          </div>

          {/* Billing Section */}
          <div className="review-section billing-section">
            <h2 className="section-title">💰 Billing</h2>
            <div className="billing-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="billing-row">
              <span>GST (5%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
            <div className="billing-row total-row">
              <span>Total Amount</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBackToMenu}
              disabled={submitting}
            >
              ← Back to Menu
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || cartItems.length === 0}
            >
              {submitting ? '⏳ Sending...' : '✓ Send to Kitchen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
