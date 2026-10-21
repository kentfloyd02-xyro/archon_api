import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    code: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 300 }
});

export default mongoose.model('Otp', otpSchema);
