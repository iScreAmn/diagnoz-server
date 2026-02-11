import express from 'express';
import { deleteAppointment, getAllAppointments } from '../controllers/adminAppointmentsController.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.use(requireAdminAuth);

router.get('/appointments', getAllAppointments);
router.delete('/appointments/:id', deleteAppointment);

export default router;
