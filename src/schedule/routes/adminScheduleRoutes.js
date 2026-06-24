import express from 'express';
import { getAdminSchedules, updateSchedule } from '../controllers/scheduleController.js';
import { requireAdminAuth } from '../../admin/middleware/adminAuth.js';

const router = express.Router();

// Any authenticated panel user (admin, owner, developer) can read and edit schedules.
router.use(requireAdminAuth);

router.get('/', getAdminSchedules);
router.put('/:doctorKey', updateSchedule);

export default router;
