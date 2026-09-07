const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');
const { sendOTPEmail } = require('../services/emailService');

const router = express.Router();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOTPExpiry = () => {
  return Date.now() + 15 * 60 * 1000;
};

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { id: admin.id, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  res.json({ token, username: admin.username });
});

router.patch('/change-password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.user.id);
  if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, admin.id);
  res.json({ success: true, message: 'Password changed successfully' });
});

router.post('/forgot-password', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin) {
    return res.status(404).json({ error: 'User not found' });
  }

  const otp = generateOTP();
  const otpExpiry = getOTPExpiry();

  db.prepare('UPDATE admins SET otp_code = ?, otp_expiry = ? WHERE id = ?').run(
    otp,
    otpExpiry,
    admin.id
  );

  const emailResult = await sendOTPEmail(admin.username, otp);
  if (!emailResult.success) {
    return res.status(500).json({ error: 'Failed to send OTP email' });
  }

  res.json({ success: true, message: 'OTP sent to your registered email' });
});

router.post('/verify-otp', (req, res) => {
  const { username, otp, newPassword } = req.body;
  if (!username || !otp || !newPassword) {
    return res.status(400).json({ error: 'Username, OTP, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!admin.otp_code || !admin.otp_expiry) {
    return res.status(400).json({ error: 'No OTP request found. Please request OTP first' });
  }

  if (admin.otp_code !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  if (Date.now() > admin.otp_expiry) {
    db.prepare('UPDATE admins SET otp_code = NULL, otp_expiry = NULL WHERE id = ?').run(admin.id);
    return res.status(400).json({ error: 'OTP has expired. Please request a new one' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password_hash = ?, otp_code = NULL, otp_expiry = NULL WHERE id = ?').run(
    newHash,
    admin.id
  );

  res.json({ success: true, message: 'Password reset successfully' });
});

module.exports = router;
