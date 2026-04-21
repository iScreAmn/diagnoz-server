import { getDB } from '../../config/db.js';

const COLLECTION_NAME = 'analytics_events';

export const insertEvents = async (events) => {
  const db = await getDB();
  const collection = db.collection(COLLECTION_NAME);
  
  const now = new Date();
  const documents = events.map((event) => ({
    ...event,
    timestamp: new Date(event.timestamp),
    receivedAt: now,
    flushedAt: event.flushedAt ? new Date(event.flushedAt) : now,
  }));

  const result = await collection.insertMany(documents);
  return result.insertedCount;
};

export const getEventsByDateRange = async (startDate, endDate, eventType = null) => {
  const db = await getDB();
  const collection = db.collection(COLLECTION_NAME);

  const query = {
    timestamp: { $gte: startDate, $lte: endDate },
  };

  if (eventType) {
    query.type = eventType;
  }

  return collection.find(query).toArray();
};

export const countEvents = async (startDate, eventType = null) => {
  const db = await getDB();
  const collection = db.collection(COLLECTION_NAME);

  const query = { timestamp: { $gte: startDate } };
  if (eventType) {
    query.type = eventType;
  }

  return collection.countDocuments(query);
};

export const getDistinctSessions = async (startDate) => {
  const db = await getDB();
  const collection = db.collection(COLLECTION_NAME);

  return collection.distinct('sessionId', { timestamp: { $gte: startDate } });
};

export const aggregateTopPages = async (startDate, limit = 10) => {
  const db = await getDB();
  const collection = db.collection(COLLECTION_NAME);

  return collection
    .aggregate([
      {
        $match: {
          type: 'page_view',
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$data.page',
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: limit },
      {
        $project: {
          name: '$_id',
          views: 1,
          _id: 0,
        },
      },
    ])
    .toArray();
};

export const aggregateTopActions = async (startDate, limit = 10) => {
  const db = await getDB();
  const collection = db.collection(COLLECTION_NAME);

  return collection
    .aggregate([
      {
        $match: {
          type: 'control_action',
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$data.action',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          name: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ])
    .toArray();
};

export const aggregateSessionDurations = async (startDate) => {
  const db = await getDB();
  const collection = db.collection(COLLECTION_NAME);

  return collection
    .aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$sessionId',
          start: { $min: '$timestamp' },
          end: { $max: '$timestamp' },
        },
      },
    ])
    .toArray();
};

export const aggregateHourlyActivity = async (startDate) => {
  const db = await getDB();
  const collection = db.collection(COLLECTION_NAME);

  return collection
    .aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $project: {
          hour: { $hour: { date: '$timestamp', timezone: 'Asia/Tbilisi' } },
        },
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();
};

export const ensureIndexes = async () => {
  const db = await getDB();
  const collection = db.collection(COLLECTION_NAME);

  await collection.createIndex({ timestamp: -1 });
  await collection.createIndex({ type: 1, timestamp: -1 });
  await collection.createIndex({ sessionId: 1, timestamp: 1 });
  await collection.createIndex({ userId: 1 }, { sparse: true });
  await collection.createIndex({ ip: 1 }, { sparse: true });

  console.log('[ANALYTICS] Indexes ensured');
};

export const aggregateSessions = async (startDate, limit = 50) => {
  const db = await getDB();
  const collection = db.collection(COLLECTION_NAME);

  return collection
    .aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $sort: { timestamp: 1 },
      },
      {
        $group: {
          _id: '$sessionId',
          firstEvent: { $first: '$$ROOT' },
          lastEvent: { $last: '$$ROOT' },
          start: { $min: '$timestamp' },
          end: { $max: '$timestamp' },
          eventsCount: { $sum: 1 },
          pages: { $addToSet: '$url' },
        },
      },
      {
        $project: {
          sessionId: '$_id',
          start: 1,
          end: 1,
          duration: { $subtract: ['$end', '$start'] },
          eventsCount: 1,
          pagesCount: { $size: '$pages' },
          ip: '$firstEvent.ip',
          referrer: '$firstEvent.referrer',
          device: '$firstEvent.device',
          locale: '$firstEvent.locale',
          timezone: '$firstEvent.timezone',
          _id: 0,
        },
      },
      { $sort: { start: -1 } },
      { $limit: limit },
    ])
    .toArray();
};

export const getSessionEvents = async (sessionId) => {
  const db = await getDB();
  const collection = db.collection(COLLECTION_NAME);

  return collection
    .find({ sessionId })
    .sort({ timestamp: 1 })
    .toArray();
};

export const getSessionSummary = async (sessionId) => {
  const db = await getDB();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection
    .aggregate([
      {
        $match: { sessionId },
      },
      {
        $sort: { timestamp: 1 },
      },
      {
        $group: {
          _id: '$sessionId',
          firstEvent: { $first: '$$ROOT' },
          lastEvent: { $last: '$$ROOT' },
          start: { $min: '$timestamp' },
          end: { $max: '$timestamp' },
          eventsCount: { $sum: 1 },
          pages: { $addToSet: '$url' },
          eventTypes: { $push: '$type' },
        },
      },
      {
        $project: {
          sessionId: '$_id',
          start: 1,
          end: 1,
          duration: { $subtract: ['$end', '$start'] },
          eventsCount: 1,
          pagesCount: { $size: '$pages' },
          pages: 1,
          eventTypes: 1,
          ip: '$firstEvent.ip',
          referrer: '$firstEvent.referrer',
          device: '$firstEvent.device',
          locale: '$firstEvent.locale',
          timezone: '$firstEvent.timezone',
          userAgent: '$firstEvent.userAgent',
          _id: 0,
        },
      },
    ])
    .toArray();

  return result[0] || null;
};
