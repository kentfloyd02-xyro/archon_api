import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import voucherRoutes from './routes/voucherRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Global User Context Extractor for Audit Logging & Security
app.use((req, res, next) => {
    // 1. Try Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decoded = jwt.decode(token);
            if (decoded) {
                req.user = decoded;
            }
        } catch (e) {}
    }
    // 2. Try custom X-User headers
    if (!req.user && req.headers['x-user-email']) {
        req.user = {
            email: req.headers['x-user-email'],
            name: req.headers['x-user-name'] || req.headers['x-user-email'].split('@')[0],
            role: req.headers['x-user-role'] || 'admin',
            id: req.headers['x-user-id'] || null
        };
    }
    // 3. Try request body performedBy
    if (!req.user && req.body && req.body.performedBy) {
        req.user = req.body.performedBy;
    }
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'Archon Nell Industrial API is running',
        version: '1.1.0',
        endpoints: [
            '/api/auth',
            '/api/products',
            '/api/orders',
            '/api/projects',
            '/api/reviews',
            '/api/vouchers',
            '/api/otp',
            '/api/upload/image'
        ]
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/audit-logs', auditRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});


app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/archon_nell_db';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully to:', MONGO_URI);
        app.listen(PORT, () => {
            console.log(`Archon Nell API server listening on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        console.log('Starting server in offline mode...');
        app.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT} (Database not connected)`);
        });
    });