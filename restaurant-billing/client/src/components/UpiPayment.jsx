import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function UpiPayment({ amount, restaurantName, upiId }) {
  const [paid, setPaid] = useState(false);

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(restaurantName)}&am=${amount}&tn=${encodeURIComponent('Restaurant Bill')}&cu=INR`;

  if (paid) {
    return (
      <div className="upi-section">
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🙏</div>
        <h2 style={{ color: '#27ae60', marginBottom: 8 }}>Thank You!</h2>
        <p className="text-muted">Your payment is confirmed. Enjoy your meal!</p>
      </div>
    );
  }

  return (
    <div className="upi-section">
      <p className="text-muted" style={{ marginBottom: 4 }}>Total Amount</p>
      <div className="upi-amount">₹{amount.toFixed(2)}</div>

      <a href={upiUrl} className="upi-btn">
        💳 Pay ₹{amount.toFixed(2)} via UPI
      </a>

      <div className="upi-qr">
        <QRCodeSVG value={upiUrl} size={180} level="M" includeMargin />
      </div>

      <p className="upi-note">📱 Scan with any UPI app or tap the button on mobile</p>
      <p className="upi-note" style={{ marginTop: 4 }}>
        Pay to: <strong>{upiId}</strong>
      </p>

      <button className="btn btn-success mt-16 w-full" onClick={() => setPaid(true)}>
        ✅ I Have Paid
      </button>
    </div>
  );
}
