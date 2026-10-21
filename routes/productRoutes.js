import express from 'express';
import Product from '../models/Product.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = express.Router();

router.get('/', async(req, res) => {
    try {
        const { category, search } = req.query;
        const filter = { isActive: true };

        if (category && category !== 'all') {
            filter.category = category;
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products', details: err.message });
    }
});

router.get('/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOne({
            $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product', details: err.message });
    }
});

router.post('/', async(req, res) => {
    try {
        const count = await Product.countDocuments();
        const customId = req.body.customId || `prod-${count + 1}-${Date.now().toString().slice(-4)}`;

        const newProduct = new Product({
            ...req.body,
            customId
        });

        const saved = await newProduct.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create product', details: err.message });
    }
});

router.put('/:id/stock', async(req, res) => {
    try {
        const { id } = req.params;
        const { delta } = req.body; // e.g. +5, -1

        if (typeof delta !== 'number') {
            return res.status(400).json({ error: 'delta must be a number' });
        }

        const product = await Product.findOne({
            $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        product.stock = Math.max(0, product.stock + delta);
        await product.save();

        await logAuditEvent({
            action: 'STOCK_ADJUSTED',
            req,
            target: product.title,
            details: `Inventory stock adjusted by ${delta > 0 ? `+${delta}` : delta} unit(s). Current stock: ${product.stock}`
        });

        res.json({ success: true, stock: product.stock, product });
    } catch (err) {
        res.status(500).json({ error: 'Failed to adjust stock', details: err.message });
    }
});

router.put('/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const updated = await Product.findOneAndUpdate({ $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
            req.body, { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update product', details: err.message });
    }
});

router.delete('/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOneAndUpdate({ $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] }, { isActive: false }, { new: true });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product', details: err.message });
    }
});

export default router;