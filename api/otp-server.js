const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.MAIL_API_PORT || 4001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://gsd-reservation.vercel.app';
const allowedOrigins = ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

// Configure CORS with multiple allowed origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// In-memory OTP stores
const loginOtpStore = new Map(); // key: user_id || email, value: { otp, email, fullName, expiresAt }
const passwordOtpStore = new Map(); // key: email, value: { otp, email, fullName, expiresAt }
const twoFactorOtpStore = new Map(); // key: user_id, value: { otp, email, fullName, expiresAt }
const emailVerificationStore = new Map(); // key: email, value: { otp, email, fullName, expiresAt }

function generateOtp() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const secure = String(process.env.SMTP_SECURE).toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error('SMTP configuration is missing. Please check your environment variables.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

function isExpired(expiresAt) {
  return !expiresAt || new Date(expiresAt).getTime() < Date.now();
}

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/send-login-otp', async (req, res) => {
  try {
    const { user_id, email, fullName } = req.body || {};
    if (!user_id && !email) {
      return res.status(400).json({ status: 'error', message: 'User ID or Email is required' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    const normalizedEmail = (email || '').trim().toLowerCase();
    const key = user_id || normalizedEmail;
    loginOtpStore.set(key, { otp, email: normalizedEmail || email, fullName, expiresAt });

    console.log('[OTP SRV] send-login-otp', {
      key,
      email: normalizedEmail || email,
      otp_tail: String(otp).slice(-2),
      expiresAt: expiresAt.toISOString()
    });

    const transporter = createTransport();
    const recipientEmail = normalizedEmail || email;
    const recipientName = fullName || 'User';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h2 style="color: #333;">General Services Department</h2>
          <p style="color: #666; margin: 5px 0;">Reservation & Monitoring System</p>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>You have requested to login to your account. Please use the following One-Time Password (OTP) to complete your authentication:</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2c5530; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <ul>
            <li>OTP is valid for 3 minutes</li>
            <li>Do not share this OTP</li>
            <li>If you did not request this login, please ignore this email</li>
          </ul>
          <p>Thank you for using our reservation system.</p>
          <p>Best regards,<br/>General Services Department</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          This is an automated message. Please do not reply.
        </div>
      </div>
    `;

    await transporter.sendMail({ from: process.env.MAIL_FROM, to: recipientEmail, subject: 'Login Authentication Code - GSD Reservation', html });
    return res.status(200).json({ status: 'success', message: 'OTP sent successfully', requires_2fa: true, otp });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to send OTP email' });
  }
});

// Validate Login OTP
app.post('/validate-login-otp', (req, res) => {
  try {
    const { user_id, otp, email } = req.body || {};
    const normalizedEmail = (email || '').trim().toLowerCase();
    const key = user_id || normalizedEmail;
    if (!key || !otp) {
      return res.status(400).json({ status: 'error', message: 'user_id/email and otp are required' });
    }

    const record = loginOtpStore.get(key);
    console.log('[OTP SRV] validate-login-otp request', { key, otp_tail: String(otp).slice(-2) });
    if (!record) {
      return res.status(400).json({ status: 'error', message: 'OTP not found. Please request a new one.' });
    }

    if (isExpired(record.expiresAt)) {
      loginOtpStore.delete(key);
      return res.status(400).json({ status: 'error', message: 'OTP expired. Please request a new one.' });
    }

    if (String(record.otp) !== String(otp)) {
      return res.status(400).json({ status: 'error', message: 'Invalid OTP' });
    }

    loginOtpStore.delete(key);
    return res.status(200).json({ status: 'success', message: 'OTP validated' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to validate OTP' });
  }
});

// Send Password Reset OTP
app.post('/send-password-reset-otp', async (req, res) => {
  try {
    const { email, fullName } = req.body || {};
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const normalizedEmail = (email || '').trim().toLowerCase();
    passwordOtpStore.set(normalizedEmail, { otp, email: normalizedEmail, fullName, expiresAt });
    console.log('[OTP SRV] send-password-reset-otp', { email: normalizedEmail, otp_tail: String(otp).slice(-2), expiresAt: expiresAt.toISOString() });

    const transporter = createTransport();
    const recipientName = fullName || 'User';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h2 style="color: #333;">General Services Department</h2>
          <p style="color: #666; margin: 5px 0;">Reservation & Monitoring System</p>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>You have requested to reset your password. Please use the following One-Time Password (OTP) to complete your password reset:</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2c5530; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <ul>
            <li>OTP is valid for 10 minutes</li>
            <li>Do not share this OTP</li>
            <li>If you did not request this password reset, please ignore this email</li>
          </ul>
          <p>Thank you for using our reservation system.</p>
          <p>Best regards,<br/>General Services Department</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          This is an automated message. Please do not reply.
        </div>
      </div>
    `;

    await transporter.sendMail({ from: process.env.MAIL_FROM, to: normalizedEmail, subject: 'Password Reset OTP - GSD Reservation', html });
    return res.status(200).json({ status: 'success', message: 'Password reset OTP sent successfully', otp });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to send OTP email' });
  }
});

// Validate Password Reset OTP
app.post('/validate-password-reset-otp', (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ status: 'error', message: 'email and otp are required' });
    }

    const normalizedEmail = (email || '').trim().toLowerCase();
    const record = passwordOtpStore.get(normalizedEmail);
    console.log('[OTP SRV] validate-password-reset-otp request', { email: normalizedEmail, otp_tail: String(otp).slice(-2) });
    if (!record) {
      return res.status(400).json({ status: 'error', message: 'OTP not found. Please request a new one.' });
    }

    if (isExpired(record.expiresAt)) {
      passwordOtpStore.delete(normalizedEmail);
      return res.status(400).json({ status: 'error', message: 'OTP expired. Please request a new one.' });
    }

    if (String(record.otp) !== String(otp)) {
      return res.status(400).json({ status: 'error', message: 'Invalid OTP' });
    }

    passwordOtpStore.delete(normalizedEmail);
    return res.status(200).json({ status: 'success', message: 'OTP validated' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to validate OTP' });
  }
});

// Send 2FA Email Verification OTP
app.post('/send-2fa-otp', async (req, res) => {
  try {
    const { user_id, email, fullName } = req.body || {};
    if (!user_id || !email) {
      return res.status(400).json({ status: 'error', message: 'User ID and Email are required' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    twoFactorOtpStore.set(user_id, { otp, email, fullName, expiresAt });
    console.log('[OTP SRV] send-2fa-otp', { user_id, email, otp_tail: String(otp).slice(-2), expiresAt: expiresAt.toISOString() });

    const transporter = createTransport();
    const recipientName = fullName || 'User';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h2 style="color: #333;">General Services Department</h2>
          <p style="color: #666; margin: 5px 0;">Reservation & Monitoring System</p>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>You have requested to enable Two-Factor Authentication (2FA) for your account. Please use the following One-Time Password (OTP) to verify your email address:</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2c5530; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <ul>
            <li>OTP is valid for 5 minutes</li>
            <li>Do not share this OTP with anyone</li>
            <li>If you did not request this verification, please contact your administrator immediately</li>
          </ul>
          <p>Once verified, Two-Factor Authentication will be enabled for your account, providing an extra layer of security.</p>
          <p>Thank you for using our reservation system.</p>
          <p>Best regards,<br/>General Services Department</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          This is an automated message. Please do not reply.
        </div>
      </div>
    `;

    await transporter.sendMail({ from: process.env.MAIL_FROM, to: email, subject: '2FA Email Verification - GSD Reservation', html });
    return res.status(200).json({ status: 'success', message: '2FA verification OTP sent successfully', otp });
  } catch (err) {
    console.error('[OTP SRV] send-2fa-otp error:', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to send 2FA verification email' });
  }
});

// Validate 2FA Email Verification OTP
app.post('/validate-2fa-otp', (req, res) => {
  try {
    const { user_id, otp } = req.body || {};
    if (!user_id || !otp) {
      return res.status(400).json({ status: 'error', message: 'User ID and OTP are required' });
    }

    const record = twoFactorOtpStore.get(user_id);
    console.log('[OTP SRV] validate-2fa-otp request', { user_id, otp_tail: String(otp).slice(-2) });
    
    if (!record) {
      return res.status(400).json({ status: 'error', message: 'No OTP found for this user. Please request a new verification code.' });
    }

    if (isExpired(record.expiresAt)) {
      twoFactorOtpStore.delete(user_id);
      return res.status(400).json({ status: 'error', message: 'OTP has expired. Please request a new verification code.' });
    }

    if (String(record.otp) !== String(otp)) {
      return res.status(400).json({ status: 'error', message: 'Invalid OTP. Please check and try again.' });
    }

    // OTP is valid - remove it from storage (one-time use)
    twoFactorOtpStore.delete(user_id);
    return res.status(200).json({ status: 'success', message: 'OTP validated successfully' });
  } catch (err) {
    console.error('[OTP SRV] validate-2fa-otp error:', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to validate OTP' });
  }
});

// Send Email Verification OTP (for profile email verification)
app.post('/send-email-verification', async (req, res) => {
  try {
    const { email, fullName } = req.body || {};
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    const normalizedEmail = (email || '').trim().toLowerCase();
    emailVerificationStore.set(normalizedEmail, { otp, email: normalizedEmail, fullName, expiresAt });
    console.log('[OTP SRV] send-email-verification', { email: normalizedEmail, otp_tail: String(otp).slice(-2), expiresAt: expiresAt.toISOString() });

    const transporter = createTransport();
    const recipientName = fullName || 'User';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h2 style="color: #333;">General Services Department</h2>
          <p style="color: #666; margin: 5px 0;">Reservation & Monitoring System</p>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>You have requested to verify your email address. Please use the following One-Time Password (OTP) to complete your email verification:</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2c5530; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <ul>
            <li>OTP is valid for 3 minutes</li>
            <li>Do not share this OTP with anyone</li>
            <li>If you did not request this verification, please ignore this email</li>
          </ul>
          <p>Thank you for using our reservation system.</p>
          <p>Best regards,<br/>General Services Department</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          This is an automated message. Please do not reply.
        </div>
      </div>
    `;

    await transporter.sendMail({ from: process.env.MAIL_FROM, to: normalizedEmail, subject: 'Email Verification - GSD Reservation', html });
    return res.status(200).json({ status: 'success', message: 'Email verification OTP sent successfully', otp });
  } catch (err) {
    console.error('[OTP SRV] send-email-verification error:', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to send email verification' });
  }
});

// Validate Email Verification OTP
app.post('/validate-email-verification', (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ status: 'error', message: 'Email and OTP are required' });
    }

    const normalizedEmail = (email || '').trim().toLowerCase();
    const record = emailVerificationStore.get(normalizedEmail);
    console.log('[OTP SRV] validate-email-verification request', { email: normalizedEmail, otp_tail: String(otp).slice(-2) });
    
    if (!record) {
      return res.status(400).json({ status: 'error', message: 'No OTP found for this email. Please request a new verification code.' });
    }

    if (isExpired(record.expiresAt)) {
      emailVerificationStore.delete(normalizedEmail);
      return res.status(400).json({ status: 'error', message: 'OTP has expired. Please request a new verification code.' });
    }

    if (String(record.otp) !== String(otp)) {
      return res.status(400).json({ status: 'error', message: 'Invalid OTP. Please check and try again.' });
    }

    // OTP is valid - remove it from storage (one-time use)
    emailVerificationStore.delete(normalizedEmail);
    return res.status(200).json({ status: 'success', message: 'Email verified successfully' });
  } catch (err) {
    console.error('[OTP SRV] validate-email-verification error:', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to validate email verification' });
  }
});

app.listen(PORT, () => {
  console.log(`OTP API server listening on http://localhost:${PORT}`);
});
