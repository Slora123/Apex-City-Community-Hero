'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { analyseImage } = require('../services/aiAnalysis');

/**
 * POST /api/analyze
 * Accepts an image and returns AI analysis results.
 * Can be called before submitting a full issue report (preview step).
 */
router.post('/', requireAuth, (req, res) => {
  req.uploadSubDir = 'analyze';
  upload.single('photo')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'An image is required for analysis' });
    }

    try {
      const analysis = await analyseImage(req.file.path);

      res.json({
        success: true,
        analysis,
        tempPhotoUrl: `/uploads/analyze/${req.file.filename}`,
        tempPhotoPath: `analyze/${req.file.filename}`,
        message: 'AI analysis complete'
      });
    } catch (err) {
      console.error('Analyze error:', err);
      res.status(500).json({ error: 'AI analysis failed: ' + err.message });
    }
  });
});

module.exports = router;
