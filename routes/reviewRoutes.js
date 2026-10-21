import express from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';

const router = express.Router();

router.get('/:productId', async(req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({
            $or: [
                { productCustomId: productId },
                { productId: productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }
            ]
        }).sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reviews', details: err.message });
    }
});

router.post('/', async(req, res) => {
    try {
        const { productId, productCustomId, userName, rating, comment } = req.body;

        const prodTarget = productCustomId || productId;
        if (!prodTarget || !userName || !rating || !comment) {
            return res.status(400).json({ error: 'Missing required review fields' });
        }

        const newReview = new Review({
            productId: productId && productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null,
            productCustomId: prodTarget,
            userName: userName.trim(),
            rating: Number(rating),
            comment: comment.trim(),
            verified: false
        });

        const saved = await newReview.save();

        const allProdReviews = await Review.find({ productCustomId: prodTarget });
        if (allProdReviews.length > 0) {
            const avg = allProdReviews.reduce((sum, r) => sum + r.rating, 0) / allProdReviews.length;
            await Product.findOneAndUpdate({ $or: [{ customId: prodTarget }, { _id: prodTarget.match(/^[0-9a-fA-F]{24}$/) ? prodTarget : null }] }, { rating: Number(avg.toFixed(1)) });
        }

        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: 'Failed to submit review', details: err.message });
    }
});

export default router;