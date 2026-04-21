import * as analyticsRepo from '../repositories/analyticsRepository.js';

const RANGE_MAP = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
};

export const trackEvents = async (events) => {
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('Events must be a non-empty array');
  }

  const count = await analyticsRepo.insertEvents(events);
  return { success: true, count };
};

export const getStats = async (range = '7d') => {
  const rangeMs = RANGE_MAP[range] || RANGE_MAP['7d'];
  const startDate = new Date(Date.now() - rangeMs);

  const [
    totalEvents,
    pageViews,
    uniqueSessions,
    topPages,
    topActions,
    sessions,
    hourlyActivity,
  ] = await Promise.all([
    analyticsRepo.countEvents(startDate),
    analyticsRepo.countEvents(startDate, 'page_view'),
    analyticsRepo.getDistinctSessions(startDate),
    analyticsRepo.aggregateTopPages(startDate, 10),
    analyticsRepo.aggregateTopActions(startDate, 10),
    analyticsRepo.aggregateSessionDurations(startDate),
    analyticsRepo.aggregateHourlyActivity(startDate),
  ]);

  const avgSessionDuration = calculateAvgSessionDuration(sessions);
  const hourlyActivityFormatted = formatHourlyActivity(hourlyActivity);

  return {
    totalEvents,
    pageViews,
    uniqueUsers: uniqueSessions.length,
    avgSessionDuration,
    topPages,
    topActions,
    hourlyActivity: hourlyActivityFormatted,
  };
};

const calculateAvgSessionDuration = (sessions) => {
  if (sessions.length === 0) return '0m';

  const totalMs = sessions.reduce((sum, session) => {
    const duration = session.end - session.start;
    return sum + duration;
  }, 0);

  const avgMs = totalMs / sessions.length;
  const minutes = Math.round(avgMs / 60000);

  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const formatHourlyActivity = (rawActivity) => {
  if (rawActivity.length === 0) return [];

  const maxCount = Math.max(...rawActivity.map((h) => h.count), 1);

  return rawActivity.map((item) => ({
    hour: item._id,
    count: item.count,
    percentage: (item.count / maxCount) * 100,
  }));
};

export const getSessions = async (range = '7d', limit = 50) => {
  const rangeMs = RANGE_MAP[range] || RANGE_MAP['7d'];
  const startDate = new Date(Date.now() - rangeMs);

  const sessions = await analyticsRepo.aggregateSessions(startDate, limit);

  return sessions.map((session) => ({
    ...session,
    durationFormatted: formatDuration(session.duration),
  }));
};

export const getSessionDetail = async (sessionId) => {
  const [summary, events] = await Promise.all([
    analyticsRepo.getSessionSummary(sessionId),
    analyticsRepo.getSessionEvents(sessionId),
  ]);

  if (!summary) return null;

  return {
    ...summary,
    durationFormatted: formatDuration(summary.duration),
    events: events.map((event) => ({
      ...event,
      timestamp: event.timestamp,
    })),
  };
};

const formatDuration = (durationMs) => {
  if (durationMs < 1000) return '<1s';
  
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};
