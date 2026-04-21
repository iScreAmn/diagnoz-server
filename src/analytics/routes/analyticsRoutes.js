import express from 'express';
import { trackEvents, getStats, getSessions, getSessionDetail } from '../controllers/analyticsController.js';
import { requireAdminAuth, requireDeveloperRole } from '../../admin/middleware/adminAuth.js';

const router = express.Router();

router.post('/', trackEvents);

router.get('/stats', requireAdminAuth, requireDeveloperRole, getStats);
router.get('/sessions', requireAdminAuth, requireDeveloperRole, getSessions);
router.get('/sessions/:sessionId', requireAdminAuth, requireDeveloperRole, getSessionDetail);

export default router;
