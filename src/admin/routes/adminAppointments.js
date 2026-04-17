import express from 'express';
import {
  createAdminAppointment,
  deleteAppointment,
  getAllAppointments,
  updateAppointmentStatus
} from '../controllers/adminAppointmentsController.js';
import { changeAdminPassword, createAdminUser, getAdminUsers, loginAdmin } from '../controllers/adminAuthController.js';
import { requireAdminAuth, requireOwner } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/login', loginAdmin);

router.use(requireAdminAuth);
router.patch('/me/password', changeAdminPassword);
router.get('/users', requireOwner, getAdminUsers);
router.post('/users', requireOwner, createAdminUser);

router.get('/appointments', getAllAppointments);
router.post('/appointments', createAdminAppointment);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.delete('/appointments/:id', deleteAppointment);

export default router;
