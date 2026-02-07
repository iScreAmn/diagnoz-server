import express from 'express';
import { submitAppointment } from '../controllers/appointmentController.js';

const router = express.Router();

/**
 * POST /api/appointment/submit
 * Body: { doctor, name, phone, consent }
 * Sends appointment form (with selected doctor) to admin email
 */
router.post('/submit', submitAppointment);

/**
 * GET /api/appointment/test
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Appointment API is working',
    timestamp: new Date().toISOString()
  });
});

export default router;
