import express from 'express';
import Otp from '../models/Otp.js';
import { sendOtpEmail } from '../config/mailer.js';

const router = express.Router();

// POST send OTP (dispatches real email via Brevo SMTP)
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove older pending OTPs for this email
    await Otp.deleteMany({ email: cleanEmail });

    const newOtp = new Otp({
      email: cleanEmail,
      code,
      isVerified: false
    });

    await newOtp.save();

    // Send email via Brevo SMTP
    let emailResult = { sent: false };
    try {
      emailResult = await sendOtpEmail(cleanEmail, code);
    } catch (mailErr) {
      console.error('Brevo SMTP Send Error:', mailErr.message);
      emailResult = { sent: false, error: mailErr.message };
    }

    res.json({
      success: true,
      message: emailResult.sent
        ? `Verification code dispatched to ${cleanEmail} via Brevo`
        : `Verification code generated for ${cleanEmail}`,
      email: cleanEmail,
      emailSent: emailResult.sent,
      code // Included for testing and developer preview
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate OTP', details: err.message });
  }
});

// POST verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 6-digit code are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const record = await Otp.findOne({
      email: cleanEmail,
      code: code.trim()
    });

    if (!record) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP code' });
    }

    record.isVerified = true;
    await record.save();

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify OTP', details: err.message });
  }
});

export default router;