import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    customId: { type: String, unique: true },
    title: { type: String, required: true, trim: true },
    category: {
        type: String,
        required: true,
        enum: ['mortar', 'epoxy', 'admixture', 'waterproof'],
        index: true
    },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 5.0, min: 1, max: 5 },
    discount: { type: String, default: '' },
    badge: { type: String, default: '' },
    image: { type: String, required: true },
    specs: [{ type: String }],
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);