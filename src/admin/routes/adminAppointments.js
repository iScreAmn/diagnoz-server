import express from 'express';
import {
  createAdminAppointment,
  deleteAppointment,
  getAllAppointments,
  updateAppointmentStatus
} from '../controllers/adminAppointmentsController.js';
import { changeAdminPassword, createAdminUser, getAdminUsers, loginAdmin } from '../controllers/adminAuthController.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/login', loginAdmin);

router.use(requireAdminAuth);
router.patch('/me/password', changeAdminPassword);
router.get('/users', getAdminUsers);
router.post('/users', createAdminUser);

router.get('/appointments', getAllAppointments);
router.post('/appointments', createAdminAppointment);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.delete('/appointments/:id', deleteAppointment);

export default router;
