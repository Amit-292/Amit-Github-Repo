import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { BRAND_COLORS } from '../constants';

export default function BillShare() {
  const { sessionId } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBill();
  }, [sessionId]);

  const loadBill = async () => {
    try {
      const res = await api.get(`/orders/bill-share/${sessionId}`);
      setBill(res.data);
    } catch (err) {
      setError('Bill not found or has expired');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!bill) return;

    const billContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bill Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: ${BRAND_COLORS.light}; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid ${BRAND_COLORS.primary}; padding-bottom: 20px; }
            .header h1 { color: ${BRAND_COLORS.primary}; margin: 0; font-size: 28px; }
            .header p { color: ${BRAND_COLORS.accent}; margin: 5px 0; }
            .bill-info { margin-bottom: 20px; padding: 15px; background: ${BRAND_COLORS.secondary}; border-radius: 6px; }
            .bill-info p { margin: 5px 0; color: ${BRAND_COLORS.text}; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid ${BRAND_COLORS.border}; }
            th { background-color: ${BRAND_COLORS.primary}; color: white; font-weight: bold; }
            .order-section { margin-bottom: 20px; padding: 15px; border-left: 4px solid ${BRAND_COLORS.accent}; }
            .order-section h3 { color: ${BRAND_COLORS.primary}; margin: 0 0 10px 0; }
            .summary { background: ${BRAND_COLORS.secondary}; padding: 20px; border-radius: 6px; }
            .summary-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 16px; color: ${BRAND_COLORS.text}; }
            .summary-row.total { font-weight: bold; font-size: 20px; border-top: 2px solid ${BRAND_COLORS.border}; padding-top: 10px; margin-top: 10px; color: ${BRAND_COLORS.primary}; }
            .footer { text-align: center; margin-top: 30px; color: ${BRAND_COLORS.accent}; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍽️ A5 Confectioners</h1>
              <p>BILL RECEIPT</p>
            </div>

            <div class="bill-info">
              <p><strong>Table:</strong> ${bill.tableNumber}${bill.groupId && bill.groupId !== '1' ? ` (Group ${bill.groupId})` : ''}</p>
              <p><strong>Date:</strong> ${new Date(bill.createdAt + 'Z').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p><strong>Bill ID:</strong> #${bill.sessionId}</p>
            </div>

            ${bill.orders.map((order, idx) => `
              <div class="order-section">
                <h3>Order #${idx + 1} - ${order.status.toUpperCase()}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items.map(item => `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>₹${item.price_at_order.toFixed(2)}</td>
                        <td>₹${(item.price_at_order * item.quantity).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `).join('')}

            <div class="summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>₹${bill.subtotal.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>GST (5%):</span>
                <span>₹${(bill.grandTotal - bill.subtotal).toFixed(2)}</span>
              </div>
              <div class="summary-row total">
                <span>GRAND TOTAL:</span>
                <span>₹${bill.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for dining with us! 🙏</p>
              <p style="margin-top: 10px; font-size: 12px;">Generated on ${new Date().toLocaleString('en-IN')}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const options = {
      margin: 10,
      filename: `bill-${bill.sessionId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(billContent).save();
  };

  const shareWhatsApp = () => {
    if (!bill) return;
    const text = `🍽️ *A5 Confectioners Bill*\n\nTable: ${bill.tableNumber}\n📅 ${new Date(bill.createdAt + 'Z').toLocaleDateString('en-IN')}\n\n💰 *Total: ₹${bill.grandTotal.toFixed(2)}*\n(incl. 5% GST)\n\nThank you! 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareSMS = () => {
    if (!bill) return;
    const phoneNumber = prompt('Enter phone number to send bill via SMS:');
    if (!phoneNumber) return;
    
    const smsText = `🍽️ A5 Confectioners Bill\n\nTable: ${bill.tableNumber}\n💰 Total: ₹${bill.grandTotal.toFixed(2)}\n(incl. 5% GST)\n\nThank you! 🙏`;
    const encodedText = encodeURIComponent(smsText);
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : '+91' + phoneNumber;
    window.location.href = `sms:${formattedPhone}?body=${encodedText}`;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: BRAND_COLORS.secondary
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: BRAND_COLORS.primary, fontSize: '18px' }}>Loading bill...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: BRAND_COLORS.secondary
      }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '40px', borderRadius: '8px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>❌</div>
          <p style={{ color: BRAND_COLORS.primary, fontSize: '18px' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BRAND_COLORS.secondary, minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img src="/logo.jpg" alt="A5 Confectioners" style={{ height: '80px', marginBottom: '20px' }} />
          <h1 style={{ color: BRAND_COLORS.primary, margin: '10px 0' }}>Bill Receipt</h1>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ 
            padding: '20px', 
            background: BRAND_COLORS.secondary, 
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <p><strong>Table:</strong> {bill.tableNumber}{bill.groupId && bill.groupId !== '1' ? ` (Group ${bill.groupId})` : ''}</p>
            <p><strong>Date:</strong> {new Date(bill.createdAt + 'Z').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Bill ID:</strong> #{bill.sessionId}</p>
          </div>

          {bill.orders.map((order, idx) => (
            <div key={order.id} style={{ marginBottom: '20px', paddingLeft: '15px', borderLeft: `4px solid ${BRAND_COLORS.accent}` }}>
              <h3 style={{ color: BRAND_COLORS.primary, margin: '0 0 10px 0' }}>Order #{idx + 1}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: BRAND_COLORS.primary }}>
                    <th style={{ padding: '10px', color: 'white', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '10px', color: 'white', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px', color: 'white', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map(item => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${BRAND_COLORS.border}` }}>
                      <td style={{ padding: '10px' }}>{item.name}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>₹{(item.price_at_order * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div style={{ 
            padding: '20px', 
            background: BRAND_COLORS.secondary, 
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: '16px' }}>
              <span>Subtotal:</span>
              <span>₹{bill.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: '16px' }}>
              <span>GST (5%):</span>
              <span>₹{(bill.grandTotal - bill.subtotal).toFixed(2)}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              margin: '15px 0 0 0',
              paddingTop: '15px',
              borderTop: `2px solid ${BRAND_COLORS.border}`,
              fontSize: '20px',
              fontWeight: 'bold',
              color: BRAND_COLORS.primary
            }}>
              <span>TOTAL:</span>
              <span>₹{bill.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={downloadPDF}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px 20px',
                background: BRAND_COLORS.primary,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.3s'
              }}
              onMouseOver={(e) => e.target.style.background = BRAND_COLORS.primaryDark}
              onMouseOut={(e) => e.target.style.background = BRAND_COLORS.primary}
            >
              📥 Download PDF
            </button>
            <button
              onClick={shareWhatsApp}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px 20px',
                background: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.3s'
              }}
              onMouseOver={(e) => e.target.style.background = '#1FA854'}
              onMouseOut={(e) => e.target.style.background = '#25D366'}
            >
              💬 Share on WhatsApp
            </button>
            <button
              onClick={shareSMS}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px 20px',
                background: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.3s'
              }}
              onMouseOver={(e) => e.target.style.background = '#0051D5'}
              onMouseOut={(e) => e.target.style.background = '#007AFF'}
            >
              💌 Share via SMS
            </button>
          </div>

          <p style={{ textAlign: 'center', color: BRAND_COLORS.accent, marginTop: '20px' }}>
            Thank you for dining with us! 🙏
          </p>
        </div>
      </div>
    </div>
  );
}
