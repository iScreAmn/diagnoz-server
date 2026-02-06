import express from 'express';
import { submitCallback } from '../controllers/callbackController.js';

const router = express.Router();

/**
 * POST /api/callback/submit
 * Body: { name, phone, consent }
 * Sends callback form data to admin Gmail
 */
router.post('/submit', submitCallback);

/**
 * GET /api/callback/test
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Callback API is working',
    timestamp: new Date().toISOString()
  });
});

export default router;
