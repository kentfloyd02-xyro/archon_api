import mongoose from 'mongoose';

// Subdocument: Item snapshot in order
const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    customId: { type: String }, // e.g. 'prod-1'
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true }
}, { _id: false });

// Subdocument: 5-stage shipment progression
const trackingStepSchema = new mongoose.Schema({
    step: { type: String, required: true }, // e.g. 'Order Placed', 'Factory Packed'
    time: { type: String, default: '' },
    done: { type: Boolean, default: false },
    isCancelled: { type: Boolean, default: false }
}, { _id: false });

// Subdocument: Refund claim details
const refundDetailsSchema = new mongoose.Schema({
    reason: { type: String },
    details: { type: String },
    damagePhoto: { type: String },
    refundStatus: {
        type: String,
        enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED'],
        default: 'PENDING_REVIEW'
    },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    deliveryNotes: { type: String, default: '' },

    paymentMethod: {
        type: String,
        enum: ['GCash', 'Maya', 'Bank', 'COD'],
        required: true
    },
    gcashRefNumber: { type: String, default: '' },
    proofImage: { type: String, default: null },

    items: [orderItemSchema],

    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountType: { type: String, default: '' },
    totalAmount: { type: Number, required: true },

    status: {
        type: String,
        enum: ['CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED'],
        default: 'CONFIRMED',
        index: true
    },
    cancelReason: { type: String },
    cancelledAt: { type: Date },

    trackingTimeline: [trackingStepSchema],
    refundDetails: refundDetailsSchema
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);