import express from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';

const router = express.Router();

router.get('/', async(req, res) => {
    try {
        const reviews = await Review.find({}).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reviews', details: err.message });
    }
});

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

router.post('/analyze', async(req, res) => {
    try {
        const { reviews, productId } = req.body;
        let reviewList = reviews;

        if ((!reviewList || !reviewList.length) && productId) {
            const dbReviews = await Review.find({
                $or: [
                    { productCustomId: productId },
                    { productId: productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }
                ]
            });
            reviewList = dbReviews.map(r => ({
                rating: r.rating,
                comment: r.comment,
                verifiedPurchase: r.verified
            }));
        }

        if (!Array.isArray(reviewList) || reviewList.length === 0) {
            return res.status(400).json({ error: 'Provide at least 1 review comment to analyze.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(503).json({ error: 'Gemini API key is not configured in .env' });
        }

        const model = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
        const candidateModels = [model, 'gemini-flash-latest', 'gemini-pro-latest'];

        const productInfo = req.body.productTitle || (reviewList[0] && reviewList[0].product) || 'this product';
        const prompt = [
            `You are summarizing customer reviews for "${productInfo}".`,
            'Write a clear, concise 2-3 sentence summary focusing directly on what customers experienced and reported in their actual reviews.',
            'Highlight:',
            '1. What customers praised most about this product (e.g. curing speed, compressive strength, slump retention, workability, waterproofing seal).',
            '2. Any specific user observations, contractor tips, or concerns mentioned in the reviews.',
            'Guidelines:',
            '- Base your summary strictly on the customer comments provided below.',
            '- Do not invent facts, standards, or claims not mentioned by the reviewers.',
            '- Make it read like an authentic customer feedback digest for this product.',
            'Customer Reviews:',
            JSON.stringify(reviewList.slice(0, 50).map(r => ({
                product: r.product || productInfo,
                rating: `${r.rating}/5 stars`,
                comment: r.comment,
                verified: Boolean(r.verifiedPurchase ?? r.verified)
            })))
        ].join('\n\n');

        let lastError = null;
        for (const candidateModel of candidateModels) {
            try {
                const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidateModel)}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 500
                        }
                    })
                });

                const data = await geminiRes.json();
                if (geminiRes.ok) {
                    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                    if (analysis) {
                        return res.json({
                            analysis,
                            model: candidateModel,
                            reviewCount: reviewList.length,
                            timestamp: new Date().toISOString()
                        });
                    }
                } else {
                    lastError = data.error?.message || `Status ${geminiRes.status}`;
                }
            } catch (err) {
                lastError = err.message;
            }
        }

        return res.status(502).json({ error: `Gemini AI failed: ${lastError || 'Unable to generate analysis'}` });
    } catch (err) {
        res.status(500).json({ error: 'Analysis server error', details: err.message });
    }
});

export default router;