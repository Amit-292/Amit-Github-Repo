import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CATEGORIES = ['Starters', 'Main Course', 'Beverages', 'Desserts'];
const EMPTY_ITEM = { name: '', description: '', price: '', category: 'Main Course', image_url: '', available: true };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('menu');

  // Menu state
  const [menuItems, setMenuItems] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);

  // Tables state
  const [tables, setTables] = useState([]);
  const [tableForm, setTableForm] = useState({ table_number: '', label: '' });
  const [qrModal, setQrModal] = useState(null);

  useEffect(() => {
    loadMenu();
    loadTables();
  }, []);

  const loadMenu = async () => {
    const res = await api.get('/menu');
    setMenuItems(res.data);
  };

  const loadTables = async () => {
    const res = await api.get('/tables');
    setTables(res.data);
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
    const res = await api.get(`/tables/${table.id}/qr`);
    setQrModal({ ...res.data, tableLabel: table.label });
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>🍽️ AS Confectioners — Admin</h1>
        <button className="btn btn-danger btn-sm" onClick={logout}>Logout</button>
      </header>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
          🍛 Menu Management
        </button>
        <button className={`admin-tab ${activeTab === 'tables' ? 'active' : ''}`} onClick={() => setActiveTab('tables')}>
          🪑 Table Management
        </button>
      </div>

      <div className="admin-content">
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
                    <th>Customer URL</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((table) => (
                    <tr key={table.id}>
                      <td><strong>Table {table.table_number}</strong></td>
                      <td>{table.label || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: '#888' }}>/table/{table.table_number}</td>
                      <td>
                        <div className="flex gap-8">
                          <button className="btn btn-sm btn-primary" onClick={() => showQR(table)}>QR Code</button>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteTable(table.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {qrModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setQrModal(null)}>
          <div className="modal text-center">
            <div className="modal-header">
              <h3>QR Code — Table {qrModal.tableNumber}</h3>
              <button className="btn btn-sm" onClick={() => setQrModal(null)}>✕</button>
            </div>
            <img src={qrModal.qr} alt={`QR for Table ${qrModal.tableNumber}`} style={{ width: 240, height: 240, margin: '16px auto', display: 'block', borderRadius: 8 }} />
            <p className="text-muted mt-8" style={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>
              {qrModal.url}
            </p>
            <div className="flex gap-8 mt-16" style={{ justifyContent: 'center' }}>
              <a href={qrModal.qr} download={`table-${qrModal.tableNumber}-qr.png`} className="btn btn-success">
                ⬇️ Download QR
              </a>
              <button className="btn btn-outline" onClick={() => navigator.clipboard.writeText(qrModal.url)}>
                📋 Copy URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
