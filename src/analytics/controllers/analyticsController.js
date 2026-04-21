import * as analyticsService from '../services/analyticsService.js';

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) return realIp;
  
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
};

export const trackEvents = async (req, res) => {
  try {
    const { events, flushedAt } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: events must be an array',
      });
    }

    if (events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: events array is empty',
      });
    }

    const clientIp = getClientIp(req);

    const eventsWithMetadata = events.map((event) => ({
      ...event,
      flushedAt,
      ip: clientIp,
    }));

    const result = await analyticsService.trackEvents(eventsWithMetadata);

    res.status(201).json({
      success: true,
      count: result.count,
      message: `${result.count} event(s) tracked successfully`,
    });
  } catch (error) {
    console.error('[ANALYTICS] Track events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track events',
      error: error.message,
    });
  }
};

export const getStats = async (req, res) => {
  try {
    const { range = '7d' } = req.query;

    if (!['7d', '30d', '90d'].includes(range)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid range. Allowed values: 7d, 30d, 90d',
      });
    }

    const stats = await analyticsService.getStats(range);

    res.json({
      success: true,
      data: stats,
      range,
    });
  } catch (error) {
    console.error('[ANALYTICS] Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics stats',
      error: error.message,
    });
  }
};

export const getSessions = async (req, res) => {
  try {
    const { range = '7d', limit = 50 } = req.query;

    if (!['7d', '30d', '90d'].includes(range)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid range. Allowed values: 7d, 30d, 90d',
      });
    }

    const sessions = await analyticsService.getSessions(range, parseInt(limit, 10));

    res.json({
      success: true,
      data: sessions,
      range,
    });
  } catch (error) {
    console.error('[ANALYTICS] Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sessions',
      error: error.message,
    });
  }
};

export const getSessionDetail = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required',
      });
    }

    const sessionDetail = await analyticsService.getSessionDetail(sessionId);

    if (!sessionDetail) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: sessionDetail,
    });
  } catch (error) {
    console.error('[ANALYTICS] Get session detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session detail',
      error: error.message,
    });
  }
};
