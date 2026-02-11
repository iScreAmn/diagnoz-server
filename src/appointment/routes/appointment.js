import express from 'express';
import { getAppointmentCalendar, submitAppointment } from '../controllers/appointmentController.js';

const router = express.Router();

/**
 * POST /api/appointment/submit
 * Body: { doctor, name, phone, appointmentDate, consent }
 * Sends appointment form (with selected doctor) to admin email
 */
router.post('/submit', submitAppointment);

/**
 * GET /api/appointment/calendar?doctor=...&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns unavailable dates for selected doctor
 */
router.get('/calendar', getAppointmentCalendar);

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
