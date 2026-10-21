import express from 'express';
import Voucher from '../models/Voucher.js';

const router = express.Router();

router.get('/', async(req, res) => {
    try {
        const vouchers = await Voucher.find({ isActive: true });
        res.json(vouchers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch vouchers', details: err.message });
    }
});

router.post('/validate', async(req, res) => {
    try {
        const { code, subtotal = 0 } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'Voucher code is required' });
        }

        const cleanCode = code.trim().toUpperCase();
        const voucher = await Voucher.findOne({ code: cleanCode, isActive: true });

        if (!voucher) {
            return res.status(404).json({ valid: false, error: 'Invalid or expired voucher code' });
        }

        if (voucher.expiresAt && new Date() > voucher.expiresAt) {
            return res.status(400).json({ valid: false, error: 'Voucher code has expired' });
        }

        if (subtotal < voucher.minSpend) {
            return res.status(400).json({
                valid: false,
                error: `Minimum spend of PHP ${voucher.minSpend.toLocaleString()} required for this voucher`
            });
        }

        let discountAmount = 0;
        let label = '';

        if (voucher.discountType === 'PERCENTAGE') {
            discountAmount = Math.round(subtotal * (voucher.discountValue / 100));
            label = `${voucher.discountValue}% OFF Special Voucher`;
        } else if (voucher.discountType === 'FIXED_AMOUNT') {
            discountAmount = voucher.discountValue;
            label = `PHP ${voucher.discountValue} Discount Voucher`;
        } else if (voucher.discountType === 'FREE_SHIPPING') {
            discountAmount = 0; // handled by shipping fee waived
            label = 'Free Shipping Voucher';
        }

        res.json({
            valid: true,
            code: voucher.code,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            discountAmount,
            label
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to validate voucher', details: err.message });
    }
});

router.post('/', async(req, res) => {
    try {
        const newVoucher = new Voucher(req.body);
        const saved = await newVoucher.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create voucher', details: err.message });
    }
});

export default router;