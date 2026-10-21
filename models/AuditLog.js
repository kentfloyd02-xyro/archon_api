import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        index: true
    },
    performedBy: {
        email: { type: String, default: 'System' },
        name: { type: String, default: 'System' },
        role: { type: String, default: 'admin' },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    target: {
        type: String,
        default: ''
    },
    details: {
        type: String,
        required: true
    },
    ip: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    }
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
