import express from 'express';
import {
  deleteAppointment,
  getAllAppointments,
  updateAppointmentStatus
} from '../controllers/adminAppointmentsController.js';
import { loginAdmin } from '../controllers/adminAuthController.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/login', loginAdmin);

router.use(requireAdminAuth);

router.get('/appointments', getAllAppointments);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.delete('/appointments/:id', deleteAppointment);

export default router;
