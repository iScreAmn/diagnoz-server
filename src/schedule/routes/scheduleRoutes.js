import express from 'express';
import { getPublicSchedules } from '../controllers/scheduleController.js';

const router = express.Router();

/** GET /api/schedule — public schedule map for the booking UI. */
router.get('/', getPublicSchedules);

export default router;
