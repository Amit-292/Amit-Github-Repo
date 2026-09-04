import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin');
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ background: 'linear-gradient(135deg, #6B4423 0%, #4a2c17 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(107, 68, 35, 0.2)', padding: '40px', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/logo.jpg" alt="A5 Confectioners" style={{ height: '60px', marginBottom: '12px' }} />
        </div>
        <h1 style={{ textAlign: 'center', color: '#6B4423', marginBottom: '8px' }}>Admin Login</h1>
        <p style={{ textAlign: 'center', color: '#8B5A3C', marginBottom: '24px' }}>Restaurant Management</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ color: '#6B4423', fontWeight: '600' }}>Username</label>
            <input
              className="form-control"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              style={{ borderColor: '#D4C4B0' }}
            />
          </div>
          <div className="form-group">
            <label style={{ color: '#6B4423', fontWeight: '600' }}>Password</label>
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ borderColor: '#D4C4B0' }}
            />
          </div>
          {error && (
            <div style={{ color: '#C85C54', fontSize: '0.9rem', marginBottom: 16, textAlign: 'center', fontWeight: '500' }}>
              {error}
            </div>
          )}
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ background: '#6B4423', color: 'white', width: '100%', fontWeight: '600', padding: '12px', borderRadius: '6px' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
