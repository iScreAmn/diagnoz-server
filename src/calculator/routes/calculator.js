import express from 'express';
import { submitCalculator } from '../controllers/calculatorController.js';

const router = express.Router();

router.post('/submit', submitCalculator);

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Calculator API is working',
    timestamp: new Date().toISOString()
  });
});

export default router;
