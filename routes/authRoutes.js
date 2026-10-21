import express from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Otp from "../models/Otp.js";
import { generateToken, protect, requireAdmin } from "../middleware/authMiddleware.js";
import { sendOtpEmail } from "../config/mailer.js";
import { logAuditEvent } from "../utils/auditLogger.js";

const router = express.Router();

export function validatePasswordPolicy(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required." };
  }
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number (0-9)." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special character (!@#$%^&* etc.)." };
  }
  return { valid: true };
}

router.post("/login-init", async (req, res) => {
  try {
    const { email, password, deviceId, trustDevice } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      await logAuditEvent({
        action: "LOGIN_FAILED",
        req,
        target: cleanEmail,
        details: `Failed login attempt for non-existent email: ${cleanEmail}`
      });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.isPasswordResetRequired || (user.failedLoginAttempts || 0) >= 5) {
      return res.status(403).json({
        error: "Account locked after 5 failed password attempts. You must reset your password to regain access.",
        forcePasswordReset: true,
        email: cleanEmail
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= 5) {
        user.isPasswordResetRequired = true;
        await user.save();

        await logAuditEvent({
          action: "ACCOUNT_LOCKED_5_FAILED_ATTEMPTS",
          user,
          req,
          target: cleanEmail,
          details: `Account locked after 5 consecutive failed password attempts for: ${cleanEmail}. Password reset forced.`
        });

        return res.status(403).json({
          error: "Maximum password attempts exceeded (5/5). Your account is now locked. You must now reset your password.",
          forcePasswordReset: true,
          email: cleanEmail
        });
      } else {
        await user.save();
        const remaining = 5 - user.failedLoginAttempts;

        await logAuditEvent({
          action: "LOGIN_FAILED",
          user,
          req,
          target: cleanEmail,
          details: `Wrong password attempt ${user.failedLoginAttempts}/5 for: ${cleanEmail}`
        });

        return res.status(401).json({
          error: `Invalid email or password. Attempt ${user.failedLoginAttempts} of 5. (${remaining} attempt${remaining === 1 ? "" : "s"} remaining before account lock)`,
          failedAttempts: user.failedLoginAttempts,
          remainingAttempts: remaining
        });
      }
    }

    user.failedLoginAttempts = 0;
    user.isPasswordResetRequired = false;
    await user.save();

    const cleanDeviceId = deviceId ? String(deviceId).trim() : null;
    const now = new Date();
    const isDeviceTrusted = cleanDeviceId && Array.isArray(user.trustedDevices) && user.trustedDevices.some(
      d => d.deviceId === cleanDeviceId && new Date(d.expiresAt) > now
    );

    if (isDeviceTrusted) {
      const token = generateToken(user);
      await logAuditEvent({
        action: "LOGIN_TRUSTED_DEVICE",
        user,
        req,
        target: user.email,
        details: `Successful login via 5-day trusted device (${user.role.toUpperCase()}) - OTP bypassed`
      });

      return res.json({
        success: true,
        requireOtp: false,
        trustedDeviceBypass: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          company: user.company || "",
          role: user.role,
          defaultAddress: user.defaultAddress || "",
          preferences: user.preferences,
          privacyConsent: user.privacyConsent || { granted: true, consentedAt: user.createdAt || new Date(), policyVersion: 'RA10173-2026.1' }
        }
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email: cleanEmail });

    const newOtp = new Otp({
      email: cleanEmail,
      code,
      attempts: 0,
      lastSentAt: new Date(),
      isVerified: false
    });
    await newOtp.save();

    let emailResult = { sent: false };
    try {
      emailResult = await sendOtpEmail(cleanEmail, code, "Login 2FA Verification");
    } catch (mailErr) {
      console.error("Brevo Login OTP Error:", mailErr.message);
      emailResult = { sent: false, error: mailErr.message };
    }

    await logAuditEvent({
      action: "LOGIN_OTP_DISPATCHED",
      user,
      req,
      target: cleanEmail,
      details: `2FA security verification code sent via Brevo SMTP (Email sent: ${emailResult.sent})`
    });

    res.json({
      success: true,
      requireOtp: true,
      email: cleanEmail,
      emailSent: emailResult.sent,
      message: emailResult.sent 
        ? `Security verification code sent to ${cleanEmail}` 
        : `Verification code generated for ${cleanEmail}`
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

router.post("/login-verify-otp", async (req, res) => {
  try {
    const { email, code, deviceId, trustDevice } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and verification code are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: cleanEmail });

    if (!otpRecord) {
      return res.status(400).json({
        error: "No active verification code found or code has expired. Please click Resend Code.",
        otpAborted: true
      });
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteMany({ email: cleanEmail });
      await logAuditEvent({
        action: "OTP_ABORTED_MAX_ATTEMPTS",
        req,
        target: cleanEmail,
        details: `OTP aborted after 5 failed entries for: ${cleanEmail}`
      });
      return res.status(400).json({
        error: "Maximum OTP attempts exceeded (5/5). This code has been aborted. Please click Resend Code to request a new code.",
        otpAborted: true
      });
    }

    if (otpRecord.code !== code.trim()) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;

      if (otpRecord.attempts >= 5) {
        await Otp.deleteMany({ email: cleanEmail });
        await logAuditEvent({
          action: "OTP_ABORTED_MAX_ATTEMPTS",
          req,
          target: cleanEmail,
          details: `OTP code aborted on 5th failed attempt for: ${cleanEmail}`
        });
        return res.status(400).json({
          error: "Maximum OTP attempts exceeded (5/5). This verification code has been aborted. Please click Resend Code to receive a new one.",
          otpAborted: true
        });
      } else {
        await otpRecord.save();
        const remaining = 5 - otpRecord.attempts;

        await logAuditEvent({
          action: "OTP_INCORRECT_ATTEMPT",
          req,
          target: cleanEmail,
          details: `Wrong OTP entry attempt ${otpRecord.attempts}/5 for ${cleanEmail}`
        });

        return res.status(400).json({
          error: `Invalid verification code. Attempt ${otpRecord.attempts} of 5. (${remaining} attempt${remaining === 1 ? "" : "s"} remaining before code is aborted).`,
          attempts: otpRecord.attempts,
          remainingAttempts: remaining
        });
      }
    }

    await Otp.deleteMany({ email: cleanEmail });

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ error: "User account not found" });
    }

    user.failedLoginAttempts = 0;
    user.isPasswordResetRequired = false;

    if (trustDevice && deviceId) {
      const cleanDeviceId = String(deviceId).trim();
      const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
      user.trustedDevices = (user.trustedDevices || []).filter(
        d => new Date(d.expiresAt) > new Date() && d.deviceId !== cleanDeviceId
      );
      user.trustedDevices.push({
        deviceId: cleanDeviceId,
        expiresAt,
        userAgent: req.headers["user-agent"] || ""
      });
    }

    await user.save();
    const token = generateToken(user);

    await logAuditEvent({
      action: "LOGIN_2FA_SUCCESS",
      user,
      req,
      target: user.email,
      details: `Successful 2FA OTP verification for role: ${user.role.toUpperCase()}${trustDevice ? " (Device trusted for 5 days)" : ""}`
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        company: user.company || "",
        role: user.role,
        defaultAddress: user.defaultAddress || "",
        preferences: user.preferences,
        privacyConsent: user.privacyConsent || { granted: true, consentedAt: user.createdAt || new Date(), policyVersion: 'RA10173-2026.1' }
      }
    });
  } catch (err) {
    res.status(500).json({ error: "OTP verification failed", details: err.message });
  }
});

router.post("/forgot-password-init", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Please provide your registered email address" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ error: "No account found with this email address" });
    }

    const existingOtp = await Otp.findOne({ email: cleanEmail });
    if (existingOtp && existingOtp.lastSentAt) {
      const elapsedSec = (Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000;
      if (elapsedSec < 60) {
        const waitSec = Math.ceil(60 - elapsedSec);
        return res.status(429).json({
          error: `Please wait ${waitSec} second${waitSec === 1 ? "" : "s"} before requesting a new code.`,
          cooldownSeconds: waitSec
        });
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email: cleanEmail });

    const newOtp = new Otp({
      email: cleanEmail,
      code,
      attempts: 0,
      lastSentAt: new Date(),
      isVerified: false
    });
    await newOtp.save();

    let emailResult = { sent: false };
    try {
      emailResult = await sendOtpEmail(cleanEmail, code, "Password Reset");
    } catch (mailErr) {
      console.error("Brevo Password Reset Error:", mailErr.message);
      emailResult = { sent: false, error: mailErr.message };
    }

    await logAuditEvent({
      action: "PASSWORD_RESET_INIT",
      user,
      req,
      target: cleanEmail,
      details: `Password reset OTP dispatched to ${cleanEmail}`
    });

    res.json({
      success: true,
      requireOtp: true,
      email: cleanEmail,
      emailSent: emailResult.sent,
      message: `Password reset verification code dispatched to ${cleanEmail}`
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to process reset request", details: err.message });
  }
});

router.post("/forgot-password-verify", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, OTP code, and new password are required" });
    }

    const pwdCheck = validatePasswordPolicy(newPassword);
    if (!pwdCheck.valid) {
      return res.status(400).json({ error: pwdCheck.message });
    }

    const cleanEmail = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: cleanEmail });

    if (!otpRecord) {
      return res.status(400).json({ error: "No active verification code found or code has expired. Please click Resend Code." });
    }

    if (otpRecord.code !== code.trim()) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      if (otpRecord.attempts >= 5) {
        await Otp.deleteMany({ email: cleanEmail });
        return res.status(400).json({ error: "Maximum OTP attempts exceeded (5/5). Code aborted. Please request a new code.", otpAborted: true });
      }
      await otpRecord.save();
      return res.status(400).json({ error: `Invalid OTP code. Attempt ${otpRecord.attempts} of 5.` });
    }

    await Otp.deleteMany({ email: cleanEmail });

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = newPassword;
    user.failedLoginAttempts = 0;
    user.isPasswordResetRequired = false;
    await user.save();

    await logAuditEvent({
      action: "PASSWORD_RESET_SUCCESS",
      user,
      req,
      target: user.email,
      details: `Password reset successfully completed for ${user.email}. Account unlocked.`
    });

    res.json({
      success: true,
      message: "Password has been successfully updated! You can now log in."
    });
  } catch (err) {
    res.status(500).json({ error: "Password reset failed", details: err.message });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const { email, purpose = "Verification Code" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingOtp = await Otp.findOne({ email: cleanEmail });
    if (existingOtp && existingOtp.lastSentAt) {
      const elapsedSec = (Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000;
      if (elapsedSec < 60) {
        const waitSec = Math.ceil(60 - elapsedSec);
        return res.status(429).json({
          error: `Please wait ${waitSec} second${waitSec === 1 ? "" : "s"} before requesting a new code.`,
          cooldownSeconds: waitSec
        });
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email: cleanEmail });

    const newOtp = new Otp({
      email: cleanEmail,
      code,
      attempts: 0,
      lastSentAt: new Date(),
      isVerified: false
    });
    await newOtp.save();

    let emailResult = { sent: false };
    try {
      emailResult = await sendOtpEmail(cleanEmail, code, purpose);
    } catch (mailErr) {
      console.error("Brevo Resend OTP Error:", mailErr.message);
      emailResult = { sent: false, error: mailErr.message };
    }

    await logAuditEvent({
      action: "OTP_RESENT",
      req,
      target: cleanEmail,
      details: `New verification code resent to ${cleanEmail} (Purpose: ${purpose})`
    });

    res.json({
      success: true,
      message: `New verification code dispatched to ${cleanEmail}`,
      emailSent: emailResult.sent,
      cooldownSeconds: 60
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to resend OTP", details: err.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, company, defaultAddress } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const pwdCheck = validatePasswordPolicy(password);
    if (!pwdCheck.valid) {
      return res.status(400).json({ error: pwdCheck.message });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: phone || "",
      company: company || "",
      role: "customer",
      defaultAddress: defaultAddress || "",
      privacyConsent: {
        granted: true,
        consentedAt: new Date(),
        policyVersion: "RA10173-2026.1"
      }
    });

    const saved = await newUser.save();
    const token = generateToken(saved);

    await logAuditEvent({
      action: "USER_REGISTERED",
      user: saved,
      req,
      target: saved.email,
      details: `New customer registered: ${saved.name} (${saved.email}) [RA 10173 Consent Granted]`
    });

    res.status(201).json({
      success: true,
      message: "Customer account created successfully!",
      token,
      user: {
        id: saved._id,
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        company: saved.company,
        role: saved.role,
        defaultAddress: saved.defaultAddress,
        preferences: saved.preferences,
        privacyConsent: saved.privacyConsent
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      company: user.company || "",
      role: user.role,
      defaultAddress: user.defaultAddress || "",
      preferences: user.preferences,
      privacyConsent: user.privacyConsent || { granted: true, consentedAt: user.createdAt || new Date(), policyVersion: 'RA10173-2026.1' }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user profile", details: err.message });
  }
});

router.get("/customers", async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" }).select("-password").sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers", details: err.message });
  }
});

router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, phone, company, defaultAddress, preferences, privacyConsent } = req.body;
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (company !== undefined) user.company = company;
    if (defaultAddress !== undefined) user.defaultAddress = defaultAddress;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    if (privacyConsent !== undefined) {
      const isGranted = typeof privacyConsent === 'boolean'
        ? privacyConsent
        : Boolean(privacyConsent?.granted);
      user.privacyConsent = {
        granted: isGranted,
        consentedAt: new Date(),
        policyVersion: privacyConsent?.policyVersion || 'RA10173-2026.1'
      };
    }

    await user.save();

    await logAuditEvent({
      action: "PROFILE_UPDATED",
      user,
      req,
      target: user.email,
      details: `Profile updated by ${user.name} (Data Privacy Consent: ${user.privacyConsent?.granted ? 'GRANTED' : 'WITHHELD'})`
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
        role: user.role,
        defaultAddress: user.defaultAddress,
        preferences: user.preferences,
        privacyConsent: user.privacyConsent
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile", details: err.message });
  }
});

export default router;
