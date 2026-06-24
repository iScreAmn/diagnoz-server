import { getDB } from '../../config/db.js';
import { SEED_DOCTOR_SCHEDULES } from '../scheduleConstants.js';

const COLLECTION_NAME = 'doctor_schedules';

const getCollection = async () => {
  const db = await getDB();
  return db.collection(COLLECTION_NAME);
};

export const ensureScheduleIndexes = async () => {
  const collection = await getCollection();
  await collection.createIndex(
    { doctorKey: 1 },
    { unique: true, name: 'uniq_doctor_schedule_key' }
  );
};

/** Inserts seed documents for any doctorKey that is not yet present. */
export const seedSchedules = async () => {
  const collection = await getCollection();
  const existing = await collection.distinct('doctorKey');
  const existingSet = new Set(existing);

  const now = new Date().toISOString();
  const toInsert = Object.entries(SEED_DOCTOR_SCHEDULES)
    .filter(([doctorKey]) => !existingSet.has(doctorKey))
    .map(([doctorKey, ranges]) => ({
      doctorKey,
      ranges,
      updatedBy: 'system:seed',
      createdAt: now,
      updatedAt: now
    }));

  if (toInsert.length) {
    await collection.insertMany(toInsert);
    console.log(`[SCHEDULE] seeded ${toInsert.length} doctor schedule(s)`);
  }
};

export const getAllSchedules = async () => {
  const collection = await getCollection();
  return collection
    .find({}, { projection: { _id: 0 } })
    .sort({ doctorKey: 1 })
    .toArray();
};

/** Returns a plain map { doctorKey: ranges }. */
export const getScheduleMap = async () => {
  const docs = await getAllSchedules();
  return docs.reduce((acc, doc) => {
    acc[doc.doctorKey] = doc.ranges;
    return acc;
  }, {});
};

export const upsertSchedule = async (doctorKey, ranges, updatedBy) => {
  const collection = await getCollection();
  const now = new Date().toISOString();

  const result = await collection.findOneAndUpdate(
    { doctorKey },
    {
      $set: { ranges, updatedBy: updatedBy || 'unknown', updatedAt: now },
      $setOnInsert: { doctorKey, createdAt: now }
    },
    { upsert: true, returnDocument: 'after', projection: { _id: 0 } }
  );

  return result?.value || result || { doctorKey, ranges, updatedAt: now };
};
