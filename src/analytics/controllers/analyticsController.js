import * as analyticsService from '../services/analyticsService.js';

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

    const eventsWithFlushTime = events.map((event) => ({
      ...event,
      flushedAt,
    }));

    const result = await analyticsService.trackEvents(eventsWithFlushTime);

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
