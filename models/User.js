import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    company: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
    defaultAddress: { type: String, default: '' },
    preferences: {
        smsAlerts: { type: Boolean, default: true },
        emailReceipts: { type: Boolean, default: true }
    },
    privacyConsent: {
        granted: { type: Boolean, default: true },
        consentedAt: { type: Date, default: Date.now },
        policyVersion: { type: String, default: 'RA10173-2026.1' }
    },
    failedLoginAttempts: { type: Number, default: 0 },
    isPasswordResetRequired: { type: Boolean, default: false },
    trustedDevices: [{
        deviceId: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        userAgent: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
