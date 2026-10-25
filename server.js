import 'dotenv/config';
import dns from 'dns';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

dns.setServers(['8.8.8.8', '1.1.1.1']);

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

app.get('/api/health', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.json({
        status: isDbConnected ? 'ok' : 'degraded',
        database: isDbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
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

async function startServer() {
    let dbConnected = false;

    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('Online MongoDB Atlas connected successfully to:', MONGO_URI.replace(/:[^:]*@/, ':****@'));
        dbConnected = true;
    } catch (err) {
        console.error('Online MongoDB Atlas connection error:', err.message);
    }

    app.listen(PORT, () => {
        console.log(`Archon Nell API server listening on port ${PORT} [Online DB: ${dbConnected ? 'CONNECTED' : 'OFFLINE'}]`);
    });
}

startServer();