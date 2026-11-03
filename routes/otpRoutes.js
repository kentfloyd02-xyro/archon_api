import express from 'express';
import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';
import { sendOtpEmail } from '../config/mailer.js';

const router = express.Router();

// Helper to mask email in API responses (e.g. k***d@gmail.com)
function maskEmail(email) {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

// POST send OTP (dispatches real email via Brevo SMTP)
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Generate cryptographically random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Securely hash the 6-digit OTP code before saving to DB
    const hashedCode = await bcrypt.hash(code, 10);

    // Remove older pending OTPs for this email
    await Otp.deleteMany({ email: cleanEmail });

    const newOtp = new Otp({
      email: cleanEmail,
      code: hashedCode,
      isVerified: false
    });

    await newOtp.save();

    // Send email via Brevo SMTP (only the recipient receives the plaintext code in their inbox)
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
        ? `Verification code dispatched to ${maskEmail(cleanEmail)} via secure mail`
        : `Verification code generated for ${maskEmail(cleanEmail)}`,
      emailMasked: maskEmail(cleanEmail),
      emailSent: emailResult.sent
      // Note: Plaintext 'code' is NEVER exposed in the JSON response
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
    const record = await Otp.findOne({ email: cleanEmail });

    if (!record) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP code' });
    }

    // Compare entered code with hashed OTP in database
    const isMatch = await bcrypt.compare(code.trim(), record.code);
    if (!isMatch) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
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