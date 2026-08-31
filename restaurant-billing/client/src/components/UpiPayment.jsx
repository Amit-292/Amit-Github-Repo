import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api';

const STARS = [1, 2, 3, 4, 5];

function StarRating({ value, onChange, label }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', gap: 6 }}>
        {STARS.map((s) => (
          <span
            key={s}
            style={{ fontSize: '1.8rem', cursor: 'pointer', color: s <= (hovered || value) ? '#f39c12' : '#ddd', transition: 'color 0.1s' }}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(s)}
          >★</span>
        ))}
        {value > 0 && <span style={{ marginLeft: 6, alignSelf: 'center', fontSize: '0.85rem', color: '#888' }}>{['','Poor','Fair','Good','Great','Excellent'][value]}</span>}
      </div>
    </div>
  );
}

export default function UpiPayment({ amount, restaurantName, upiId, sessionId, tableId, groupId = '1' }) {
  const [stage, setStage] = useState('payment'); // 'payment' | 'feedback' | 'thankyou'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [feedback, setFeedback] = useState({
    foodRating: 0,
    staffRating: 0,
    improvements: '',
    contact: '',
    email: '',
    dob: '',
    anniversary: '',
  });

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(restaurantName)}&am=${amount}&tn=${encodeURIComponent('AS Confectioners Bill')}&cu=INR`;

  const handlePaid = async () => {
    setLoading(true);
    try {
      if (sessionId) await api.patch(`/orders/sessions/${sessionId}/close`);
      if (tableId) localStorage.removeItem(`session_${tableId}_${groupId}`);
    } catch (err) {
      console.error('Failed to close session', err);
    } finally {
      setLoading(false);
      setStage('feedback');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/feedback', { sessionId, tableNumber: tableId, groupId, ...feedback });
    } catch (err) {
      console.error('Feedback submit failed', err);
    } finally {
      setSubmitting(false);
      setStage('thankyou');
    }
  };

  const skipFeedback = () => setStage('thankyou');

  // ── THANK YOU ──
  if (stage === 'thankyou') {
    return (
      <div className="upi-section text-center">
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🙏</div>
        <h2 style={{ color: '#27ae60', marginBottom: 8 }}>Thank You!</h2>
        <p className="text-muted">Payment confirmed. Hope to see you again!</p>
        <p className="text-muted" style={{ marginTop: 8, fontSize: '0.8rem' }}>
          Scan the QR code on your table to start a new order.
        </p>
      </div>
    );
  }

  // ── FEEDBACK FORM ──
  if (stage === 'feedback') {
    return (
      <div style={{ padding: '8px 0' }}>
        <div className="text-center" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '2rem', marginBottom: 6 }}>😊</div>
          <h3 style={{ margin: 0 }}>How was your experience?</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>
            Your feedback helps us improve. Takes 30 seconds!
          </p>
        </div>

        <form onSubmit={handleFeedbackSubmit}>
          <StarRating
            label="🍛 Did you enjoy the food?"
            value={feedback.foodRating}
            onChange={(v) => setFeedback({ ...feedback, foodRating: v })}
          />
          <StarRating
            label="👨‍💼 Experience with staff?"
            value={feedback.staffRating}
            onChange={(v) => setFeedback({ ...feedback, staffRating: v })}
          />

          <div className="form-group">
            <label style={{ fontWeight: 600 }}>💡 Any improvements needed?</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Tell us what we can do better..."
              value={feedback.improvements}
              onChange={(e) => setFeedback({ ...feedback, improvements: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ borderTop: '1px dashed #eee', paddingTop: 16, marginTop: 8, marginBottom: 8 }}>
            <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 12 }}>
              📬 Stay in touch — share your details for special offers & anniversary surprises!
            </p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>📞 Contact Number</label>
              <input
                className="form-control"
                type="tel"
                placeholder="Your phone number"
                value={feedback.contact}
                onChange={(e) => setFeedback({ ...feedback, contact: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>📧 Email ID</label>
              <input
                className="form-control"
                type="email"
                placeholder="your@email.com"
                value={feedback.email}
                onChange={(e) => setFeedback({ ...feedback, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>🎂 Date of Birth</label>
              <input
                className="form-control"
                type="date"
                value={feedback.dob}
                onChange={(e) => setFeedback({ ...feedback, dob: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>💍 Marriage Anniversary</label>
              <input
                className="form-control"
                type="date"
                value={feedback.anniversary}
                onChange={(e) => setFeedback({ ...feedback, anniversary: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-8 mt-16">
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
              {submitting ? '⏳ Submitting...' : '📩 Submit Feedback'}
            </button>
            <button type="button" className="btn btn-outline" onClick={skipFeedback}>
              Skip
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── PAYMENT ──
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

      <button
        className="btn btn-success mt-16 w-full"
        onClick={handlePaid}
        disabled={loading}
      >
        {loading ? '⏳ Confirming...' : '✅ I Have Paid'}
      </button>
    </div>
  );
}
