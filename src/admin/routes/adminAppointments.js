import express from 'express';
import {
  createAdminAppointment,
  deleteAppointment,
  getAllAppointments,
  updateAppointmentStatus
} from '../controllers/adminAppointmentsController.js';
import {
  changeAdminPassword,
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  loginAdmin,
  updateAdminUserLogin,
  updateAdminUserRole,
  updateAdminUserPassword
} from '../controllers/adminAuthController.js';
import { requireAdminAuth, requireServiceAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/login', loginAdmin);

router.use(requireAdminAuth);
router.patch('/me/password', changeAdminPassword);
router.get('/users', requireServiceAdmin, getAdminUsers);
router.post('/users', requireServiceAdmin, createAdminUser);
router.patch('/users/:id/login', requireServiceAdmin, updateAdminUserLogin);
router.patch('/users/:id/role', requireServiceAdmin, updateAdminUserRole);
router.patch('/users/:id/password', requireServiceAdmin, updateAdminUserPassword);
router.delete('/users/:id', requireServiceAdmin, deleteAdminUser);

router.get('/appointments', getAllAppointments);
router.post('/appointments', createAdminAppointment);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.delete('/appointments/:id', deleteAppointment);

export default router;
