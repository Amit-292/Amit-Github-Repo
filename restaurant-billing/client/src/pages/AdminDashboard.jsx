import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

const CATEGORIES = ['Starters', 'Main Course', 'Beverages', 'Desserts'];
const EMPTY_ITEM = { name: '', description: '', price: '', category: 'Main Course', image_url: '', available: true };
const GST_RATE = 0.05;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');

  // Menu state
  const [menuItems, setMenuItems] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);

  // Tables state
  const [tables, setTables] = useState([]);
  const [tableForm, setTableForm] = useState({ table_number: '', label: '' });
  const [qrModal, setQrModal] = useState(null);
  const [tableGroupCounts, setTableGroupCounts] = useState({});

  // Orders awaiting approval
  const [pendingOrders, setPendingOrders] = useState([]);

  // Bills (active sessions)
  const [bills, setBills] = useState([]);
  const [expandedBill, setExpandedBill] = useState(null);

  // Feedback
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackDateFilter, setFeedbackDateFilter] = useState('');
  const [selectedFeedbacks, setSelectedFeedbacks] = useState(new Set());

  // Bills History
  const [billsHistory, setBillsHistory] = useState([]);
  const [billsHistoryDate, setBillsHistoryDate] = useState('');
  const [expandedHistoryBill, setExpandedHistoryBill] = useState(null);

  const toggleFeedbackSelect = (id) => {
    setSelectedFeedbacks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (visibleIds) => {
    if (visibleIds.every(id => selectedFeedbacks.has(id))) {
      setSelectedFeedbacks(prev => { const n = new Set(prev); visibleIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelectedFeedbacks(prev => new Set([...prev, ...visibleIds]));
    }
  };

  const deleteSelectedFeedbacks = async () => {
    if (!selectedFeedbacks.size) return;
    if (!confirm(`Delete ${selectedFeedbacks.size} feedback record(s)? This cannot be undone.`)) return;
    try {
      await api.delete('/feedback', { data: { ids: [...selectedFeedbacks] } });
      setSelectedFeedbacks(new Set());
      loadFeedbacks();
    } catch (err) { alert('Failed to delete'); }
  };

  // Per-bill WhatsApp phone numbers
  const [billPhones, setBillPhones] = useState({});

  const buildAdminBillText = (bill) => {
    const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const lines = [
      `🍽️ *AS Confectioners*`,
      `📅 ${date} | Table ${bill.tableNumber}${bill.groupId && bill.groupId !== '1' ? ` · Group ${bill.groupId}` : ''}`,
      ``,
      `*ORDER SUMMARY*`,
      `━━━━━━━━━━━━━━━━━━━`,
    ];
    const allItems = bill.orders.flatMap(o => o.items || []);
    const itemMap = {};
    allItems.forEach(item => {
      if (itemMap[item.name]) {
        itemMap[item.name].quantity += item.quantity;
        itemMap[item.name].total += item.price_at_order * item.quantity;
      } else {
        itemMap[item.name] = { quantity: item.quantity, total: item.price_at_order * item.quantity };
      }
    });
    Object.entries(itemMap).forEach(([name, v]) => {
      lines.push(`• ${name} × ${v.quantity}  ₹${v.total.toFixed(2)}`);
    });
    lines.push(`━━━━━━━━━━━━━━━━━━━`);
    lines.push(`Subtotal: ₹${bill.subtotal.toFixed(2)}`);
    lines.push(`GST (5%): ₹${(bill.grandTotal - bill.subtotal).toFixed(2)}`);
    lines.push(`*TOTAL: ₹${bill.grandTotal.toFixed(2)}*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━`);
    lines.push(`Thank you for dining with us! 🙏`);
    return lines.join('\n');
  };

  const sendBillWhatsApp = (bill) => {
    const raw = (billPhones[bill.sessionId] || '').replace(/\D/g, '');
    if (raw.length < 10) return;
    const phone = raw.startsWith('91') ? raw : '91' + raw.replace(/^0/, '');
    const text = buildAdminBillText(bill);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const loadFeedbacks = useCallback(async () => {
    try {
      const res = await api.get('/feedback');
      setFeedbacks(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const loadBillsHistory = useCallback(async (date = '') => {
    try {
      const params = date ? { date } : {};
      const res = await api.get('/orders/bills-history', { params });
      setBillsHistory(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const deleteBillHistory = async (sessionId) => {
    if (!confirm('Delete this bill from history? This cannot be undone.')) return;
    try {
      await api.delete(`/orders/bills-history/${sessionId}`);
      loadBillsHistory(billsHistoryDate);
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete bill'); }
  };

  const exportFeedbacksToExcel = () => {
    const filteredFeedbacks = feedbackDateFilter
      ? feedbacks.filter(f => new Date(f.created_at + 'Z').toLocaleDateString('en-CA') === feedbackDateFilter)
      : feedbacks;

    if (filteredFeedbacks.length === 0) {
      alert('No feedbacks to export');
      return;
    }

    const data = filteredFeedbacks.map(f => ({
      'Date': new Date(f.created_at + 'Z').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      'Time': new Date(f.created_at + 'Z').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      'Table': `T${f.table_number}${f.group_id && f.group_id !== '1' ? `/G${f.group_id}` : ''}`,
      'Food Rating': f.food_rating ? '★'.repeat(f.food_rating) : '—',
      'Staff Rating': f.staff_rating ? '★'.repeat(f.staff_rating) : '—',
      'Improvements': f.improvements || '',
      'Contact': f.contact || '',
      'Email': f.email || '',
      'DOB': f.dob || '',
      'Anniversary': f.anniversary || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Feedbacks');
    XLSX.writeFile(wb, `feedbacks-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportFeedbacksToPDF = () => {
    const filteredFeedbacks = feedbackDateFilter
      ? feedbacks.filter(f => new Date(f.created_at + 'Z').toLocaleDateString('en-CA') === feedbackDateFilter)
      : feedbacks;

    if (filteredFeedbacks.length === 0) {
      alert('No feedbacks to export');
      return;
    }

    const html = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Customer Feedbacks Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f39c12; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Customer Feedback Report</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Table</th>
                <th>Food</th>
                <th>Staff</th>
                <th>Improvements</th>
                <th>Contact</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              ${filteredFeedbacks.map(f => `
                <tr>
                  <td>${new Date(f.created_at + 'Z').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>T${f.table_number}${f.group_id && f.group_id !== '1' ? `/G${f.group_id}` : ''}</td>
                  <td>${f.food_rating ? '★'.repeat(f.food_rating) : '—'}</td>
                  <td>${f.staff_rating ? '★'.repeat(f.staff_rating) : '—'}</td>
                  <td>${f.improvements || ''}</td>
                  <td>${f.contact || ''}</td>
                  <td>${f.email || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const options = {
      margin: 10,
      filename: `feedbacks-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(html).save();
  };

  const getGroupCount = (tableId) => tableGroupCounts[tableId] || 1;
  const changeGroupCount = (tableId, delta) => {
    setTableGroupCounts(prev => ({
      ...prev,
      [tableId]: Math.min(Math.max((prev[tableId] || 1) + delta, 1), 8),
    }));
  };

  const loadBills = useCallback(async () => {
    try {
      const res = await api.get('/orders/bills');
      setBills(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const loadPendingOrders = useCallback(async () => {
    try {
      // Pull pending_approval orders from bills data
      const res = await api.get('/orders/bills');
      setBills(res.data);
      const pending = [];
      res.data.forEach(bill => {
        bill.orders.forEach(order => {
          if (order.status === 'pending_approval') {
            pending.push({ ...order, tableNumber: bill.tableNumber, tableLabel: bill.tableLabel, groupId: bill.groupId });
          }
        });
      });
      setPendingOrders(pending);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    loadMenu();
    loadTables();
    loadPendingOrders();
  }, [loadPendingOrders]);

  // Socket for real-time order notifications
  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });

    socket.on('order_pending_approval', (order) => {
      setPendingOrders(prev => {
        if (prev.find(o => o.id === order.orderId)) return prev;
        return [...prev, { id: order.orderId, tableNumber: order.tableNumber, tableLabel: order.tableLabel, groupId: order.groupId, items: order.items, status: 'pending_approval', created_at: order.created_at }];
      });
      loadBills();
    });

    socket.on('session_closed', () => { loadBills(); });
    socket.on('order_updated', (data) => {
      if (data.status === 'pending') {
        setPendingOrders(prev => prev.filter(o => o.id !== data.orderId));
      }
      loadBills();
    });

    return () => socket.disconnect();
  }, [loadBills]);

  const loadMenu = async () => {
    const res = await api.get('/menu');
    setMenuItems(res.data);
  };

  const loadTables = async () => {
    const res = await api.get('/tables');
    setTables(res.data);
  };

  const approveOrder = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/approve`);
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      loadBills();
    } catch (err) { alert(err.response?.data?.error || 'Failed to approve'); }
  };

  const rejectOrder = async (orderId) => {
    if (!confirm('Reject this order? It will be removed.')) return;
    try {
      await api.patch(`/orders/${orderId}/reject`);
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      loadBills();
    } catch (err) { alert(err.response?.data?.error || 'Failed to reject'); }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  // Menu handlers
  const openAddItem = () => {
    setEditItem(null);
    setItemForm(EMPTY_ITEM);
    setShowItemForm(true);
  };

  const openEditItem = (item) => {
    setEditItem(item);
    setItemForm({ ...item, available: !!item.available });
    setShowItemForm(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    const data = { ...itemForm, price: parseFloat(itemForm.price), available: itemForm.available ? 1 : 0 };
    if (editItem) {
      await api.put(`/menu/${editItem.id}`, data);
    } else {
      await api.post('/menu', data);
    }
    setShowItemForm(false);
    loadMenu();
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    await api.delete(`/menu/${id}`);
    loadMenu();
  };

  const toggleAvailable = async (item) => {
    await api.put(`/menu/${item.id}`, { available: item.available ? 0 : 1 });
    loadMenu();
  };

  // Table handlers
  const addTable = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tables', tableForm);
      setTableForm({ table_number: '', label: '' });
      loadTables();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding table');
    }
  };

  const deleteTable = async (id) => {
    if (!confirm('Delete this table?')) return;
    await api.delete(`/tables/${id}`);
    loadTables();
  };

  const showQR = async (table) => {
    const count = getGroupCount(table.id);
    const res = await api.get(`/tables/${table.id}/qr?count=${count}`);
    setQrModal({ ...res.data, groupCount: count });
  };

  // Password change state
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwError('New passwords do not match');
    }
    try {
      await api.patch('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess(true);
      setTimeout(() => { setPwModal(false); setPwSuccess(false); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }, 1800);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>🍽️ AS Confectioners — Admin</h1>
        <div className="flex gap-8">
          <button className="btn btn-sm btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} onClick={() => { setPwModal(true); setPwError(''); setPwSuccess(false); }}>
            🔑 Change Password
          </button>
          <button className="btn btn-danger btn-sm" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          🔔 Incoming Orders
          {pendingOrders.length > 0 && (
            <span style={{ marginLeft: 6, background: '#e74c3c', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: '0.75rem', fontWeight: 700 }}>
              {pendingOrders.length}
            </span>
          )}
        </button>
        <button className={`admin-tab ${activeTab === 'bills' ? 'active' : ''}`} onClick={() => { setActiveTab('bills'); loadBills(); }}>
          🧾 Bills
          {bills.filter(b => b.orderCount > 0).length > 0 && (
            <span style={{ marginLeft: 6, background: '#27ae60', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: '0.75rem', fontWeight: 700 }}>
              {bills.filter(b => b.orderCount > 0).length}
            </span>
          )}
        </button>
        <button className={`admin-tab ${activeTab === 'bills-history' ? 'active' : ''}`} onClick={() => { setActiveTab('bills-history'); loadBillsHistory(); }}>
          📊 Bills History
        </button>
        <button className={`admin-tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
          🍛 Menu
        </button>
        <button className={`admin-tab ${activeTab === 'tables' ? 'active' : ''}`} onClick={() => setActiveTab('tables')}>
          🪑 Tables
        </button>
        <button className={`admin-tab ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => { setActiveTab('feedback'); loadFeedbacks(); }}>
          💬 Feedback
          {feedbacks.length > 0 && (
            <span style={{ marginLeft: 6, background: '#2980b9', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: '0.75rem', fontWeight: 700 }}>
              {feedbacks.length}
            </span>
          )}
        </button>
      </div>

      <div className="admin-content">

        {/* ── INCOMING ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <>
            <div className="flex-between mb-16">
              <h2>🔔 Incoming Orders</h2>
              <button className="btn btn-sm btn-outline" onClick={loadPendingOrders}>↻ Refresh</button>
            </div>
            {pendingOrders.length === 0 ? (
              <div className="card text-center" style={{ padding: '40px 20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
                <p className="text-muted">No orders waiting for approval.</p>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>New orders will appear here automatically.</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div key={order.id} className="card mb-16" style={{ borderLeft: '4px solid #8e44ad' }}>
                  <div className="flex-between mb-16">
                    <div>
                      <strong style={{ fontSize: '1.05rem' }}>
                        Table {order.tableNumber}
                        {order.groupId && order.groupId !== '1' ? ` · Group ${order.groupId}` : ''}
                      </strong>
                      {order.tableLabel && <span style={{ marginLeft: 8, color: '#888', fontSize: '0.85rem' }}>{order.tableLabel}</span>}
                    </div>
                    <span style={{ background: '#8e44ad', color: 'white', borderRadius: 12, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
                      🔔 Awaiting Approval
                    </span>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="bill-row">
                        <span>{item.name} × {item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="bill-row" style={{ fontWeight: 700, borderTop: '1px solid #eee', paddingTop: 8, marginTop: 4 }}>
                      <span>Total</span>
                      <span>₹{(order.items || []).reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-8">
                    <button className="btn btn-success" style={{ flex: 1 }} onClick={() => approveOrder(order.id)}>
                      ✅ Approve → Send to Kitchen
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => rejectOrder(order.id)}>
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── BILLS TAB ── */}
        {activeTab === 'bills' && (
          <>
            <div className="flex-between mb-16">
              <h2>🧾 Active Bills</h2>
              <button className="btn btn-sm btn-outline" onClick={loadBills}>↻ Refresh</button>
            </div>
            {bills.filter(b => b.orderCount > 0 || b.pendingApproval > 0).length === 0 ? (
              <div className="card text-center" style={{ padding: '40px 20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🧾</div>
                <p className="text-muted">No active bills right now.</p>
              </div>
            ) : (
              bills.filter(b => b.orderCount > 0 || b.pendingApproval > 0).map((bill) => {
                const isExpanded = expandedBill === bill.sessionId;
                return (
                  <div key={bill.sessionId} className="card mb-16">
                    <div
                      className="flex-between"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedBill(isExpanded ? null : bill.sessionId)}
                    >
                      <div>
                        <strong style={{ fontSize: '1.05rem' }}>
                          Table {bill.tableNumber}
                          {bill.groupId && bill.groupId !== '1' ? ` · Group ${bill.groupId}` : ''}
                        </strong>
                        {bill.tableLabel && <span style={{ marginLeft: 8, color: '#888', fontSize: '0.85rem' }}>{bill.tableLabel}</span>}
                        <div style={{ marginTop: 4, fontSize: '0.82rem', color: '#888' }}>
                          {bill.orderCount} order{bill.orderCount !== 1 ? 's' : ''}
                          {bill.pendingApproval > 0 && <span style={{ marginLeft: 6, color: '#8e44ad' }}>+ {bill.pendingApproval} pending</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#27ae60' }}>₹{bill.grandTotal.toFixed(2)}</div>
                        <div style={{ fontSize: '0.78rem', color: '#aaa' }}>incl. 5% GST</div>
                        <div style={{ fontSize: '0.85rem', marginTop: 4 }}>{isExpanded ? '▲ Hide' : '▼ View Bill'}</div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
                        {bill.orders.filter(o => o.status !== 'pending_approval').map((order, idx) => (
                          <div key={order.id} style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 6, color: '#666' }}>
                              Order #{idx + 1} —
                              <span style={{ marginLeft: 4, color: order.status === 'served' ? '#27ae60' : order.status === 'ready' ? '#27ae60' : '#e67e22' }}>
                                {order.status}
                              </span>
                            </div>
                            {order.items.map((item) => (
                              <div key={item.id} className="bill-row" style={{ fontSize: '0.88rem' }}>
                                <span>{item.name} × {item.quantity}</span>
                                <span>₹{(item.price_at_order * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                        <hr className="bill-divider" />
                        <div className="bill-row"><span>Subtotal</span><span>₹{bill.subtotal.toFixed(2)}</span></div>
                        <div className="bill-row"><span>GST (5%)</span><span>₹{(bill.grandTotal - bill.subtotal).toFixed(2)}</span></div>
                        <div className="bill-row" style={{ fontWeight: 700, fontSize: '1rem' }}><span>Grand Total</span><span>₹{bill.grandTotal.toFixed(2)}</span></div>

                        {/* Send bill to customer WhatsApp */}
                        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed #eee' }}>
                          <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, color: '#444' }}>
                            📲 Send bill to customer's WhatsApp
                          </p>
                          <div className="flex gap-8">
                            <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}>+91</span>
                            <input
                              className="form-control"
                              type="tel"
                              placeholder="Customer's WhatsApp number"
                              maxLength={10}
                              value={billPhones[bill.sessionId] || ''}
                              onChange={(e) => setBillPhones(prev => ({ ...prev, [bill.sessionId]: e.target.value.replace(/\D/g, '') }))}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              className="btn"
                              style={{ background: '#25D366', color: 'white', border: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                              disabled={(billPhones[bill.sessionId] || '').length < 10}
                              onClick={(e) => { e.stopPropagation(); sendBillWhatsApp(bill); }}
                            >
                              Send →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === 'menu' && (
          <>
            <div className="flex-between mb-16">
              <h2>Menu Items ({menuItems.length})</h2>
              <button className="btn btn-primary" onClick={openAddItem}>+ Add Item</button>
            </div>

            {showItemForm && (
              <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowItemForm(false)}>
                <div className="modal">
                  <div className="modal-header">
                    <h3>{editItem ? 'Edit Item' : 'Add Menu Item'}</h3>
                    <button className="btn btn-sm" onClick={() => setShowItemForm(false)}>✕</button>
                  </div>
                  <form onSubmit={saveItem}>
                    <div className="form-group">
                      <label>Name *</label>
                      <input className="form-control" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <input className="form-control" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Price (₹) *</label>
                        <input className="form-control" type="number" step="0.01" min="0" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Category</label>
                        <select className="form-control" value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}>
                          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Image URL</label>
                      <input className="form-control" value={itemForm.image_url} onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="form-group flex gap-8" style={{ alignItems: 'center' }}>
                      <label style={{ marginBottom: 0 }}>Available</label>
                      <label className="toggle">
                        <input type="checkbox" checked={!!itemForm.available} onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="flex gap-8 mt-16">
                      <button type="submit" className="btn btn-primary">{editItem ? 'Save Changes' : 'Add Item'}</button>
                      <button type="button" className="btn btn-outline" onClick={() => setShowItemForm(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        {item.description && <div style={{ fontSize: '0.8rem', color: '#888' }}>{item.description}</div>}
                      </td>
                      <td>{item.category}</td>
                      <td>₹{item.price.toFixed(2)}</td>
                      <td>
                        <label className="toggle">
                          <input type="checkbox" checked={!!item.available} onChange={() => toggleAvailable(item)} />
                          <span className="toggle-slider"></span>
                        </label>
                      </td>
                      <td>
                        <div className="flex gap-8">
                          <button className="btn btn-sm btn-outline" onClick={() => openEditItem(item)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteItem(item.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'tables' && (
          <>
            <div className="flex-between mb-16">
              <h2>Tables ({tables.length})</h2>
            </div>

            <div className="card mb-16" style={{ background: '#fff8e1', border: '1px solid #f39c12' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#7a5000' }}>
                💡 <strong>Multiple families at one table?</strong> Set the number of groups for that table, then click <em>Show QR Codes</em> to get a separate QR for each family.
              </p>
            </div>

            <div className="card mb-16">
              <h3 style={{ marginBottom: 16 }}>Add New Table</h3>
              <form onSubmit={addTable} className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                <input
                  className="form-control"
                  style={{ flex: '0 0 120px' }}
                  placeholder="Table number"
                  value={tableForm.table_number}
                  onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                  required
                />
                <input
                  className="form-control"
                  style={{ flex: 1, minWidth: 160 }}
                  placeholder="Label (e.g. Window Seat)"
                  value={tableForm.label}
                  onChange={(e) => setTableForm({ ...tableForm, label: e.target.value })}
                />
                <button type="submit" className="btn btn-primary">Add Table</button>
              </form>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Table #</th>
                    <th>Label</th>
                    <th style={{ minWidth: 160 }}>Groups at table</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((table) => {
                    const gc = getGroupCount(table.id);
                    return (
                      <tr key={table.id}>
                        <td><strong>Table {table.table_number}</strong></td>
                        <td>{table.label || '—'}</td>
                        <td>
                          <div className="flex gap-8" style={{ alignItems: 'center' }}>
                            <button
                              className="btn btn-sm btn-outline"
                              style={{ padding: '2px 10px', fontWeight: 700 }}
                              onClick={() => changeGroupCount(table.id, -1)}
                              disabled={gc <= 1}
                            >−</button>
                            <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{gc}</span>
                            <button
                              className="btn btn-sm btn-outline"
                              style={{ padding: '2px 10px', fontWeight: 700 }}
                              onClick={() => changeGroupCount(table.id, 1)}
                              disabled={gc >= 8}
                            >+</button>
                            <span style={{ fontSize: '0.78rem', color: '#888' }}>
                              {gc === 1 ? 'QR code' : 'QR codes'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-8">
                            <button className="btn btn-sm btn-primary" onClick={() => showQR(table)}>
                              Show QR{gc > 1 ? 's' : ''}
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => deleteTable(table.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── FEEDBACK TAB ── */}
        {activeTab === 'feedback' && (
          <>
            <div className="flex-between mb-16">
              <h2>💬 Customer Feedback ({feedbacks.length})</h2>
              <div className="flex gap-8">
                <input
                  type="date"
                  className="form-control"
                  style={{ width: 150 }}
                  value={feedbackDateFilter}
                  onChange={(e) => setFeedbackDateFilter(e.target.value)}
                  title="Filter by date"
                />
                <input
                  className="form-control"
                  style={{ width: 200 }}
                  placeholder="Search phone / email..."
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                />
                <button className="btn btn-sm btn-success" onClick={exportFeedbacksToExcel} title="Export to Excel">
                  📊 Excel
                </button>
                <button className="btn btn-sm btn-outline" onClick={exportFeedbacksToPDF} title="Export to PDF">
                  📄 PDF
                </button>
                <button className="btn btn-sm btn-outline" onClick={loadFeedbacks}>↻ Refresh</button>
              </div>
            </div>

            {feedbacks.length === 0 ? (
              <div className="card text-center" style={{ padding: '40px 20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💬</div>
                <p className="text-muted">No feedback submitted yet.</p>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Total Responses', value: feedbacks.length, icon: '📋' },
                    { label: 'Avg Food Rating', value: (feedbacks.filter(f => f.food_rating).reduce((s, f) => s + f.food_rating, 0) / (feedbacks.filter(f => f.food_rating).length || 1)).toFixed(1) + ' ★', icon: '🍛' },
                    { label: 'Avg Staff Rating', value: (feedbacks.filter(f => f.staff_rating).reduce((s, f) => s + f.staff_rating, 0) / (feedbacks.filter(f => f.staff_rating).length || 1)).toFixed(1) + ' ★', icon: '👨‍💼' },
                    { label: 'With Contact', value: feedbacks.filter(f => f.contact).length, icon: '📞' },
                  ].map(stat => (
                    <div key={stat.label} className="card text-center" style={{ padding: '12px 8px' }}>
                      <div style={{ fontSize: '1.4rem' }}>{stat.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', margin: '4px 0' }}>{stat.value}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Bulk delete toolbar */}
                {selectedFeedbacks.size > 0 && (
                  <div className="flex gap-8 mb-16" style={{ alignItems: 'center', padding: '10px 14px', background: '#fff3e0', border: '1px solid #f39c12', borderRadius: 8 }}>
                    <span style={{ fontWeight: 600, color: '#7a5000' }}>{selectedFeedbacks.size} selected</span>
                    <button className="btn btn-sm btn-danger" onClick={deleteSelectedFeedbacks}>
                      🗑 Delete Selected
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => setSelectedFeedbacks(new Set())}>
                      Clear selection
                    </button>
                  </div>
                )}

                {/* Feedback table */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>
                          {(() => {
                            const visibleIds = feedbacks
                              .filter(f => {
                                if (feedbackDateFilter && new Date(f.created_at + 'Z').toLocaleDateString('en-CA') !== feedbackDateFilter) return false;
                                if (!feedbackSearch) return true;
                                const q = feedbackSearch.toLowerCase();
                                return (f.contact||'').includes(q)||(f.email||'').toLowerCase().includes(q);
                              })
                              .map(f => f.id);
                            const allChecked = visibleIds.length > 0 && visibleIds.every(id => selectedFeedbacks.has(id));
                            return <input type="checkbox" checked={allChecked} onChange={() => toggleSelectAll(visibleIds)} />;
                          })()}
                        </th>
                        <th>Date</th>
                        <th>Table</th>
                        <th>Food ★</th>
                        <th>Staff ★</th>
                        <th>Improvements</th>
                        <th>Contact</th>
                        <th>Email</th>
                        <th>DOB</th>
                        <th>Anniversary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbacks
                        .filter(f => {
                          if (feedbackDateFilter && new Date(f.created_at + 'Z').toLocaleDateString('en-CA') !== feedbackDateFilter) return false;
                          if (!feedbackSearch) return true;
                          const q = feedbackSearch.toLowerCase();
                          return (f.contact||'').includes(q)||(f.email||'').toLowerCase().includes(q);
                        })
                        .map(f => (
                          <tr key={f.id} style={{ background: selectedFeedbacks.has(f.id) ? '#fff8e1' : '' }}>
                            <td>
                              <input type="checkbox" checked={selectedFeedbacks.has(f.id)} onChange={() => toggleFeedbackSelect(f.id)} />
                            </td>
                            <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', color: '#888' }}>
                              {new Date(f.created_at + 'Z').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              T{f.table_number}{f.group_id && f.group_id !== '1' ? `/G${f.group_id}` : ''}
                            </td>
                            <td style={{ textAlign: 'center', color: '#f39c12' }}>{f.food_rating ? '★'.repeat(f.food_rating) : '—'}</td>
                            <td style={{ textAlign: 'center', color: '#f39c12' }}>{f.staff_rating ? '★'.repeat(f.staff_rating) : '—'}</td>
                            <td style={{ maxWidth: 200, fontSize: '0.82rem' }}>{f.improvements || <span style={{ color: '#bbb' }}>—</span>}</td>
                            <td>{f.contact || <span style={{ color: '#bbb' }}>—</span>}</td>
                            <td style={{ fontSize: '0.82rem' }}>{f.email || <span style={{ color: '#bbb' }}>—</span>}</td>
                            <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{f.dob || <span style={{ color: '#bbb' }}>—</span>}</td>
                            <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{f.anniversary || <span style={{ color: '#bbb' }}>—</span>}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'bills-history' && (
          <>
            <div className="flex-between mb-16">
              <h2>📊 Bills History</h2>
              <div className="flex gap-8">
                <input
                  type="date"
                  className="form-control"
                  style={{ width: 150 }}
                  value={billsHistoryDate}
                  onChange={(e) => {
                    setBillsHistoryDate(e.target.value);
                    loadBillsHistory(e.target.value);
                  }}
                  title="Filter by date"
                />
                <button className="btn btn-sm btn-outline" onClick={() => loadBillsHistory(billsHistoryDate)}>↻ Refresh</button>
              </div>
            </div>

            {billsHistory.length === 0 ? (
              <div className="card text-center" style={{ padding: '40px 20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📊</div>
                <p className="text-muted">No bill history found{billsHistoryDate ? ' for this date' : ''}.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Total Bills', value: billsHistory.length, icon: '🧾' },
                    { label: 'Grand Total', value: '₹' + billsHistory.reduce((sum, b) => sum + b.grandTotal, 0).toFixed(2), icon: '💰' },
                    { label: 'Total (w/o GST)', value: '₹' + billsHistory.reduce((sum, b) => sum + b.subtotal, 0).toFixed(2), icon: '📋' },
                  ].map(stat => (
                    <div key={stat.label} className="card text-center" style={{ padding: '12px 8px' }}>
                      <div style={{ fontSize: '1.4rem' }}>{stat.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', margin: '4px 0', wordBreak: 'break-word' }}>{stat.value}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {billsHistory.map(bill => {
                  const isExpanded = expandedHistoryBill === bill.sessionId;
                  return (
                    <div key={bill.sessionId} className="card mb-16">
                      <div
                        className="flex-between"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpandedHistoryBill(isExpanded ? null : bill.sessionId)}
                      >
                        <div>
                          <strong style={{ fontSize: '1.05rem' }}>
                            Table {bill.tableNumber}
                            {bill.groupId && bill.groupId !== '1' ? ` · Group ${bill.groupId}` : ''}
                          </strong>
                          {bill.tableLabel && <span style={{ marginLeft: 8, color: '#888', fontSize: '0.85rem' }}>{bill.tableLabel}</span>}
                          <div style={{ marginTop: 4, fontSize: '0.82rem', color: '#888' }}>
                            📅 {new Date(bill.createdAt + 'Z').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#27ae60' }}>₹{bill.grandTotal.toFixed(2)}</div>
                          <div style={{ fontSize: '0.78rem', color: '#aaa' }}>incl. 5% GST</div>
                          <div style={{ fontSize: '0.85rem', marginTop: 4 }}>{isExpanded ? '▲ Hide' : '▼ View Details'}</div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
                          {bill.orders.map((order, idx) => (
                            <div key={order.id} style={{ marginBottom: 12 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 6, color: '#666' }}>
                                Order #{idx + 1} — <span style={{ color: '#27ae60' }}>{order.status}</span>
                              </div>
                              {order.items.map((item) => (
                                <div key={item.id} className="bill-row" style={{ fontSize: '0.88rem' }}>
                                  <span>{item.name} × {item.quantity}</span>
                                  <span>₹{(item.price_at_order * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                          <hr className="bill-divider" />
                          <div className="bill-row"><span>Subtotal</span><span>₹{bill.subtotal.toFixed(2)}</span></div>
                          <div className="bill-row"><span>GST (5%)</span><span>₹{(bill.grandTotal - bill.subtotal).toFixed(2)}</span></div>
                          <div className="bill-row" style={{ fontWeight: 700, fontSize: '1rem' }}><span>Grand Total</span><span>₹{bill.grandTotal.toFixed(2)}</span></div>

                          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed #eee' }}>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => deleteBillHistory(bill.sessionId)}
                              style={{ marginRight: 8 }}
                            >
                              🗑 Delete Bill
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {qrModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setQrModal(null)}>
          <div className="modal" style={{ maxWidth: 640, width: '95vw' }}>
            <div className="modal-header">
              <h3>
                🪑 Table {qrModal.tableNumber}
                {qrModal.tableLabel ? ` — ${qrModal.tableLabel}` : ''}
                {qrModal.groupCount > 1 ? ` · ${qrModal.groupCount} Groups` : ''}
              </h3>
              <button className="btn btn-sm" onClick={() => setQrModal(null)}>✕</button>
            </div>

            {qrModal.groupCount > 1 && (
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 16, marginTop: -8 }}>
                Print and place each QR code in front of the respective family — orders stay completely separate.
              </p>
            )}

            {/* QR code grid */}
            {Array.isArray(qrModal.qrCodes) && qrModal.qrCodes.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: qrModal.qrCodes.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {qrModal.qrCodes.map(({ group, qr, url }) => (
                  <div key={group} className="card text-center" style={{ padding: 16 }}>
                    {qrModal.groupCount > 1 && (
                      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '1rem', color: '#e67e22' }}>
                        👨‍👩‍👧 Family / Group {group}
                      </div>
                    )}
                    <img src={qr} alt={`QR Group ${group}`} style={{ width: 190, height: 190, margin: '0 auto', display: 'block', borderRadius: 6 }} />
                    <p className="text-muted" style={{ wordBreak: 'break-all', fontSize: '0.7rem', margin: '8px 0' }}>{url}</p>
                    <div className="flex gap-8" style={{ justifyContent: 'center', marginTop: 8 }}>
                      <a href={qr} download={`table-${qrModal.tableNumber}${qrModal.groupCount > 1 ? `-group${group}` : ''}-qr.png`} className="btn btn-sm btn-success">
                        ⬇️ Download
                      </a>
                      <button className="btn btn-sm btn-outline" onClick={() => navigator.clipboard.writeText(url)}>
                        📋 Copy URL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center">Failed to load QR codes. Please try again.</p>
            )}
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {pwModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setPwModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>🔑 Change Password</h3>
              <button className="btn btn-sm" onClick={() => setPwModal(false)}>✕</button>
            </div>
            {pwSuccess ? (
              <div className="text-center" style={{ padding: '24px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✅</div>
                <p style={{ fontWeight: 600, color: '#27ae60' }}>Password changed successfully!</p>
              </div>
            ) : (
              <form onSubmit={changePassword}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    className="form-control"
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>New Password <span style={{ color: '#888', fontSize: '0.8rem' }}>(min. 6 characters)</span></label>
                  <input
                    className="form-control"
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    className="form-control"
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                {pwError && (
                  <p style={{ color: '#e74c3c', fontSize: '0.88rem', marginBottom: 12 }}>⚠️ {pwError}</p>
                )}
                <div className="flex gap-8">
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save New Password</button>
                  <button type="button" className="btn btn-outline" onClick={() => setPwModal(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
