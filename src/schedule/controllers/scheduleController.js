import {
  getAllSchedules,
  getScheduleMap,
  upsertSchedule
} from '../repositories/scheduleRepository.js';
import { invalidateScheduleCache } from '../services/scheduleService.js';
import {
  DAYS,
  DOCTOR_ALIASES,
  validateScheduleRanges
} from '../scheduleConstants.js';

const KNOWN_DOCTOR_KEYS = new Set(Object.keys(DOCTOR_ALIASES));

/**
 * GET /api/schedule
 * Public — returns the schedule map { doctorKey: ranges } used by the client
 * booking UI, plus the day index reference.
 */
export const getPublicSchedules = async (req, res) => {
  try {
    const schedules = await getScheduleMap();
    res.json({ success: true, data: { schedules, days: DAYS } });
  } catch (error) {
    console.error('[SCHEDULE] getPublicSchedules error:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to load schedules.' });
  }
};

/**
 * GET /api/admin/schedules
 * Admin — full list of stored schedules.
 */
export const getAdminSchedules = async (req, res) => {
  try {
    const schedules = await getAllSchedules();
    res.json({ success: true, data: { schedules, days: DAYS } });
  } catch (error) {
    console.error('[SCHEDULE] getAdminSchedules error:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to load schedules.' });
  }
};

/**
 * PUT /api/admin/schedules/:doctorKey
 * Admin — replaces the working ranges for a single doctor.
 */
export const updateSchedule = async (req, res) => {
  try {
    const doctorKey = String(req.params?.doctorKey || '').trim();
    if (!doctorKey) {
      return res.status(400).json({ success: false, message: 'Missing doctorKey.' });
    }
    if (!KNOWN_DOCTOR_KEYS.has(doctorKey)) {
      return res.status(400).json({ success: false, message: `Unknown doctorKey: ${doctorKey}` });
    }

    const validation = validateScheduleRanges(req.body?.ranges);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const updatedBy = req.admin?.login || req.admin?.sub || 'admin';
    const saved = await upsertSchedule(doctorKey, validation.ranges, updatedBy);
    invalidateScheduleCache();

    res.json({
      success: true,
      data: {
        doctorKey,
        ranges: saved.ranges ?? validation.ranges,
        updatedAt: saved.updatedAt
      }
    });
  } catch (error) {
    console.error('[SCHEDULE] updateSchedule error:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to save schedule.' });
  }
};
