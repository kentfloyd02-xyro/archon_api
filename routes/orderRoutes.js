import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = express.Router();

router.get('/', async(req, res) => {
    try {
        const { status, search } = req.query;
        const filter = {};

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } },
                { gcashRefNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(filter).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
    }
});

router.get('/:orderNumber', async(req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order', details: err.message });
    }
});

router.post('/', async(req, res) => {
    try {
        const {
            customerName,
            customerEmail,
            customerPhone,
            deliveryAddress,
            deliveryNotes,
            paymentMethod,
            gcashRefNumber,
            proofImage,
            items,
            subtotal,
            shippingFee,
            discountAmount,
            discountType,
            totalAmount,
            userId
        } = req.body;

        if (!items || !items.length) {
            return res.status(400).json({ error: 'Order must contain at least one item' });
        }

        if (customerEmail) {
            const User = (await import('../models/User.js')).default;
            const user = await User.findOne({ email: customerEmail.toLowerCase().trim() });
            if (user && user.role === 'admin') {
                return res.status(403).json({ error: 'Admin accounts cannot place orders. Only customer accounts are permitted to purchase products.' });
            }
        }

        if (userId) {
            const User = (await import('../models/User.js')).default;
            const user = await User.findById(userId);
            if (user && user.role === 'admin') {
                return res.status(403).json({ error: 'Admin accounts cannot place orders. Only customer accounts are permitted to purchase products.' });
            }
        }

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const jwt = (await import('jsonwebtoken')).default;
                const decoded = jwt.decode(token);
                if (decoded && decoded.role === 'admin') {
                    return res.status(403).json({ error: 'Admin accounts cannot place orders. Only customer accounts are permitted to purchase products.' });
                }
            } catch (e) {}
        }

        for (const item of items) {
            const product = await Product.findOne({
                $or: [
                    { customId: item.customId || item.id },
                    { _id: (item.productId && item.productId.match(/^[0-9a-fA-F]{24}$/)) ? item.productId : null }
                ]
            });

            if (!product) {
                return res.status(400).json({ error: `Product not found: ${item.title}` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for ${product.title}. Available: ${product.stock}, requested: ${item.quantity}`
                });
            }
        }

        for (const item of items) {
            await Product.findOneAndUpdate({
                $or: [
                    { customId: item.customId || item.id },
                    { _id: (item.productId && item.productId.match(/^[0-9a-fA-F]{24}$/)) ? item.productId : null }
                ]
            }, {
                $inc: { stock: -item.quantity, sold: item.quantity }
            });
        }

        const randomSuffix = Math.floor(10000 + Math.random() * 90000);
        const orderNumber = `AN-ORD-${new Date().getFullYear()}-${randomSuffix}`;

        const nowStr = new Date().toLocaleString();
        const trackingTimeline = [
            { step: 'Order Placed', time: nowStr, done: true, isCancelled: false },
            { step: 'Payment Review', time: paymentMethod === 'COD' ? 'Approved (COD)' : 'Payment Verified', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Estimated 2-4 hours', done: false, isCancelled: false },
            { step: 'Out for Delivery', time: 'In dispatch queue', done: false, isCancelled: false },
            { step: 'Delivered', time: 'Pending transit', done: false, isCancelled: false }
        ];

        const newOrder = new Order({
            orderNumber,
            user: userId || null,
            customerName,
            customerEmail,
            customerPhone,
            deliveryAddress,
            deliveryNotes: deliveryNotes || '',
            paymentMethod,
            gcashRefNumber: gcashRefNumber || '',
            proofImage: proofImage || null,
            items: items.map(i => ({
                customId: i.customId || i.id,
                productId: i.productId,
                title: i.title,
                price: i.price,
                quantity: i.quantity,
                total: i.total || i.price * i.quantity
            })),
            subtotal,
            shippingFee: shippingFee || 0,
            discountAmount: discountAmount || 0,
            discountType: discountType || '',
            totalAmount,
            status: 'CONFIRMED',
            trackingTimeline
        });

        const saved = await newOrder.save();

        await logAuditEvent({
            action: 'ORDER_CREATED',
            req,
            target: saved.orderNumber,
            details: `New order #${saved.orderNumber} placed by ${customerName} (Payment: ${paymentMethod}, Total: PHP ${totalAmount.toLocaleString()})`
        });

        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create order', details: err.message });
    }
});

router.put('/:orderNumber/status', async(req, res) => {
    try {
        const { orderNumber } = req.params;
        const { newStatus, performedBy } = req.body;

        const order = await Order.findOne({ orderNumber });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const currentStatus = order.status;

        if (currentStatus === 'DELIVERED') {
            return res.status(400).json({ error: 'Order is already Delivered. Status cannot be modified.' });
        }
        if (currentStatus === 'CANCELLED') {
            return res.status(400).json({ error: 'Order is Cancelled. Status cannot be modified.' });
        }
        if (['REFUNDED', 'REFUND_REQUESTED'].includes(currentStatus)) {
            return res.status(400).json({ error: 'Order is under return/refund. Status cannot be modified.' });
        }

        const statusMap = {
            'pending': 'CONFIRMED',
            'confirmed': 'CONFIRMED',
            'preparing': 'PREPARING',
            'shipped': 'IN_TRANSIT',
            'in_transit': 'IN_TRANSIT',
            'delivered': 'DELIVERED'
        };

        const targetStatus = statusMap[newStatus?.toLowerCase()] || newStatus?.toUpperCase();

        const allowedNextMap = {
            'CONFIRMED': 'PREPARING',
            'PENDING': 'PREPARING',
            'PREPARING': 'IN_TRANSIT',
            'IN_TRANSIT': 'DELIVERED'
        };

        const allowedNext = allowedNextMap[currentStatus];
        if (targetStatus !== allowedNext) {
            return res.status(400).json({
                error: `Cannot change status backwards or skip stages. Current: ${currentStatus}, Allowed next: ${allowedNext || 'None'}.`
            });
        }

        const nowStr = new Date().toLocaleString();
        if (targetStatus === 'PREPARING') {
            if (order.trackingTimeline[2]) {
                order.trackingTimeline[2].done = true;
                order.trackingTimeline[2].time = nowStr;
            }
        } else if (targetStatus === 'IN_TRANSIT') {
            if (order.trackingTimeline[2]) order.trackingTimeline[2].done = true;
            if (order.trackingTimeline[3]) {
                order.trackingTimeline[3].done = true;
                order.trackingTimeline[3].time = nowStr;
            }
        } else if (targetStatus === 'DELIVERED') {
            if (order.trackingTimeline[2]) order.trackingTimeline[2].done = true;
            if (order.trackingTimeline[3]) order.trackingTimeline[3].done = true;
            if (order.trackingTimeline[4]) {
                order.trackingTimeline[4].done = true;
                order.trackingTimeline[4].time = nowStr;
            }
        }

        order.status = targetStatus;
        await order.save();

        const actor = req.user || performedBy || {
            email: req.headers['x-user-email'] || 'admin@archon.com',
            name: req.headers['x-user-name'] || 'Admin Nell',
            role: req.headers['x-user-role'] || 'admin'
        };

        await logAuditEvent({
            action: 'DELIVERY_STATUS_UPDATED',
            user: actor,
            req,
            target: order.orderNumber,
            details: `Order #${order.orderNumber} status advanced from ${currentStatus} to ${targetStatus}`
        });

        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order status', details: err.message });
    }
});

router.put('/:orderNumber/cancel', async(req, res) => {
    try {
        const { orderNumber } = req.params;
        const { reason, performedBy } = req.body;

        const order = await Order.findOne({ orderNumber });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Order is already cancelled' });
        }

        if (order.status !== 'CONFIRMED' && order.status !== 'PENDING') {
            return res.status(400).json({ error: `Cannot cancel order with status ${order.status}. Only pending orders can be cancelled.` });
        }

        for (const item of order.items) {
            await Product.findOneAndUpdate({
                $or: [
                    { customId: item.customId },
                    { _id: item.productId }
                ]
            }, {
                $inc: { stock: item.quantity, sold: -item.quantity }
            });
        }

        order.status = 'CANCELLED';
        order.cancelReason = reason || 'Customer request';
        order.cancelledAt = new Date();
        order.trackingTimeline.push({
            step: `Cancelled: ${order.cancelReason}`,
            time: new Date().toLocaleString(),
            done: true,
            isCancelled: true
        });

        await order.save();

        const actor = req.user || performedBy || {
            email: req.headers['x-user-email'] || 'admin@archon.com',
            name: req.headers['x-user-name'] || 'Admin Nell',
            role: req.headers['x-user-role'] || 'admin'
        };

        await logAuditEvent({
            action: 'ORDER_CANCELLED',
            user: actor,
            req,
            target: order.orderNumber,
            details: `Order #${order.orderNumber} cancelled. Reason: ${order.cancelReason}. Stock restored to catalog.`
        });

        res.json({ success: true, message: 'Order cancelled and stock restored', order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to cancel order', details: err.message });
    }
});

router.put('/:orderNumber/refund', async(req, res) => {
    try {
        const { orderNumber } = req.params;
        const { reason, details, damagePhoto } = req.body;

        const order = await Order.findOne({ orderNumber });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status !== 'DELIVERED') {
            return res.status(400).json({ error: 'Refunds can only be requested for delivered orders' });
        }

        order.status = 'REFUND_REQUESTED';
        order.refundDetails = {
            reason,
            details,
            damagePhoto,
            refundStatus: 'PENDING_REVIEW',
            requestedAt: new Date()
        };

        await order.save();
        res.json({ success: true, message: 'Refund claim submitted successfully', order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit refund claim', details: err.message });
    }
});

router.put('/:orderNumber/refund/approve', async(req, res) => {
    try {
        const { orderNumber } = req.params;
        const { restoreStock = true, performedBy } = req.body;

        const order = await Order.findOne({ orderNumber });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status !== 'REFUND_REQUESTED') {
            return res.status(400).json({ error: 'Only pending refund requests can be approved' });
        }

        if (restoreStock) {
            for (const item of order.items) {
                await Product.findOneAndUpdate({
                    $or: [
                        { customId: item.customId },
                        { _id: item.productId }
                    ]
                }, {
                    $inc: { stock: item.quantity, sold: -item.quantity }
                });
            }
        }

        order.status = 'REFUNDED';
        if (!order.refundDetails) order.refundDetails = {};
        order.refundDetails.refundStatus = 'APPROVED';
        order.refundDetails.approvedAt = new Date();

        await order.save();

        const actor = req.user || performedBy || {
            email: req.headers['x-user-email'] || 'admin@archon.com',
            name: req.headers['x-user-name'] || 'Admin Nell',
            role: req.headers['x-user-role'] || 'admin'
        };

        await logAuditEvent({
            action: 'REFUND_APPROVED',
            user: actor,
            req,
            target: order.orderNumber,
            details: `Refund approved for Order #${order.orderNumber}. Inventory restored: ${restoreStock}`
        });

        res.json({ success: true, message: 'Refund approved and stock updated', order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve refund', details: err.message });
    }
});

router.put('/:orderNumber/rate', async(req, res) => {
    try {
        const { orderNumber } = req.params;
        const { rating, notes } = req.body;

        const numRating = Number(rating);
        if (!numRating || numRating < 1 || numRating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5 stars' });
        }

        const trimmedNotes = String(notes || '').trim();
        if (trimmedNotes.length < 15) {
            return res.status(400).json({ error: 'Notes must be at least 15 characters' });
        }
        if (trimmedNotes.length > 60) {
            return res.status(400).json({ error: 'Notes cannot exceed 60 characters' });
        }

        const order = await Order.findOne({ orderNumber });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status !== 'DELIVERED') {
            return res.status(400).json({ error: 'Only delivered orders can be rated' });
        }

        order.rating = numRating;
        order.notes = trimmedNotes;
        order.ratedAt = new Date();

        await order.save();
        res.json({ success: true, message: 'Order rated successfully', order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to rate order', details: err.message });
    }
});

export default router;