import { getScheduleMap } from '../repositories/scheduleRepository.js';
import {
  DEFAULT_SCHEDULE,
  SEED_DOCTOR_SCHEDULES,
  resolveDoctorScheduleKey
} from '../scheduleConstants.js';

/**
 * Small in-memory cache so per-appointment validation does not hit the DB on
 * every request. Schedules change rarely; the cache is invalidated explicitly
 * whenever an admin saves a change.
 */
const CACHE_TTL_MS = 60 * 1000;
let cachedMap = null;
let cachedAt = 0;

export const invalidateScheduleCache = () => {
  cachedMap = null;
  cachedAt = 0;
};

const getCachedScheduleMap = async () => {
  const now = Date.now();
  if (cachedMap && now - cachedAt < CACHE_TTL_MS) {
    return cachedMap;
  }
  try {
    cachedMap = await getScheduleMap();
    cachedAt = now;
  } catch (error) {
    console.error('[SCHEDULE] failed to load schedules, using fallback:', error?.message);
    cachedMap = cachedMap || {};
  }
  return cachedMap;
};

/**
 * Resolves the working ranges for a (possibly localized) doctor display name.
 * Falls back to the seeded schedule and finally to DEFAULT_SCHEDULE.
 */
export const getRangesForDoctor = async (doctorName) => {
  const key = resolveDoctorScheduleKey(doctorName);
  const map = await getCachedScheduleMap();

  if (key && Array.isArray(map[key])) return map[key];
  if (key && SEED_DOCTOR_SCHEDULES[key]) return SEED_DOCTOR_SCHEDULES[key];
  return DEFAULT_SCHEDULE;
};
