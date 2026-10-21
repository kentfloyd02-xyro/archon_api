import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// POST /api/upload/image - Upload single image (GCash receipt proof or refund damage photo)
router.post('/image', (req, res) => {
  upload.single('file')(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please select an image file to upload.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  });
});

export default router;
