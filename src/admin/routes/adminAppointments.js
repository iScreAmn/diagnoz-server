import express from 'express';
import { deleteAppointment, getAllAppointments } from '../controllers/adminAppointmentsController.js';
import { loginAdmin } from '../controllers/adminAuthController.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/login', loginAdmin);

router.use(requireAdminAuth);

router.get('/appointments', getAllAppointments);
router.delete('/appointments/:id', deleteAppointment);

export default router;
