import express from 'express';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { search, action, limit = 100 } = req.query;
        const query = {};

        if (action && action !== 'all') {
            query.action = action;
        }

        if (search) {
            query.$or = [
                { 'performedBy.email': { $regex: search, $options: 'i' } },
                { 'performedBy.name': { $regex: search, $options: 'i' } },
                { target: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } }
            ];
        }

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit, 10));

        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
    }
});

export default router;
