import React, { useState } from 'react';
import api from '../api';

export default function ForgotPasswordModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('username'); // username, otp, reset
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { username });
      setOtpSent(true);
      setStep('otp');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }
    if (!newPassword.trim()) {
      setError('New password is required');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { username, otp, newPassword });
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}>
        <h2 style={{ color: '#6B4423', marginBottom: '20px', textAlign: 'center' }}>
          Reset Password
        </h2>

        {step === 'username' && (
          <form onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label style={{ color: '#6B4423', fontWeight: '600' }}>Username</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={{ borderColor: '#D4C4B0' }}
              />
            </div>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
              We'll send you an OTP via email.
            </p>
            {error && (
              <div style={{ color: '#C85C54', fontSize: '0.9rem', marginBottom: '15px', textAlign: 'center' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                background: '#6B4423',
                color: 'white',
                padding: '10px',
                fontWeight: '600',
                borderRadius: '6px',
              }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                background: '#f0f0f0',
                color: '#666',
                padding: '10px',
                fontWeight: '600',
                borderRadius: '6px',
                marginTop: '10px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label style={{ color: '#6B4423', fontWeight: '600' }}>OTP</label>
              <input
                type="text"
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                style={{ borderColor: '#D4C4B0', textAlign: 'center', letterSpacing: '5px', fontSize: '18px' }}
              />
            </div>
            <div className="form-group">
              <label style={{ color: '#6B4423', fontWeight: '600' }}>New Password</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{ borderColor: '#D4C4B0' }}
              />
            </div>
            <div className="form-group">
              <label style={{ color: '#6B4423', fontWeight: '600' }}>Confirm Password</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                style={{ borderColor: '#D4C4B0' }}
              />
            </div>
            <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '15px' }}>
              OTP is valid for 15 minutes
            </p>
            {error && (
              <div style={{ color: '#C85C54', fontSize: '0.9rem', marginBottom: '15px', textAlign: 'center' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                background: '#6B4423',
                color: 'white',
                padding: '10px',
                fontWeight: '600',
                borderRadius: '6px',
              }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('username');
                setError('');
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              style={{
                width: '100%',
                background: '#f0f0f0',
                color: '#666',
                padding: '10px',
                fontWeight: '600',
                borderRadius: '6px',
                marginTop: '10px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          </form>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>✓</div>
            <p style={{ color: '#27AE60', fontSize: '1.1rem', fontWeight: '600' }}>
              Password reset successfully!
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '10px' }}>
              Redirecting to login...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
