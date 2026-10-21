import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'],
        required: true
    },
    discountValue: { type: Number, required: true },
    minSpend: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Voucher', voucherSchema);