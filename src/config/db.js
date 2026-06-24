import { MongoClient } from 'mongodb';
import { seedInitialAdminUser } from '../admin/services/adminBootstrap.js';
import { ensureIndexes as ensureAnalyticsIndexes } from '../analytics/repositories/analyticsRepository.js';
import { ensureScheduleIndexes, seedSchedules } from '../schedule/repositories/scheduleRepository.js';

const mongoUri = String(process.env.MONGODB_URI || '').trim();

if (!mongoUri) {
  throw new Error('MONGODB_URI is not configured');
}

const dbNameFromEnv = String(process.env.MONGODB_DB_NAME || '').trim();
let client;
let db;
let connectPromise;

const resolveDbName = () => {
  if (dbNameFromEnv) return dbNameFromEnv;

  const parsedUri = new URL(mongoUri);
  const dbNameFromUri = parsedUri.pathname.replace('/', '').trim();
  return dbNameFromUri || 'diagnoz';
};

const MAX_CONNECT_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

export const connectDB = async () => {
  console.log('[DB] connectDB() called');
  if (db) {
    console.log('[DB] already connected, reusing');
    return db;
  }
  if (connectPromise) {
    console.log('[DB] connection in progress, awaiting');
    return connectPromise;
  }

  connectPromise = (async () => {
    for (let attempt = 1; attempt <= MAX_CONNECT_RETRIES; attempt++) {
      try {
        console.log(`[DB] connecting to MongoDB (attempt ${attempt}/${MAX_CONNECT_RETRIES})...`);
        if (!client) {
          client = new MongoClient(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000
          });
        }

        await client.connect();
        console.log('[DB] MongoClient connected');

        const dbName = resolveDbName();
        db = client.db(dbName);
        console.log('[DB] using database:', dbName);

        const coll = db.collection('appointments');
        try {
          await coll.dropIndex('uniq_doctor_appointmentDate');
        } catch {
          /* ignore if index does not exist */
        }
        try {
          await coll.dropIndex('uniq_doctor_appointment_slot');
        } catch {
          /* ignore if index does not exist */
        }
        await coll.createIndex(
          { doctor: 1, appointmentDate: 1 },
          {
            unique: true,
            name: 'uniq_doctor_appointment_slot'
          }
        );
        console.log('[DB] appointments index ensured');

        await seedInitialAdminUser(db);
        console.log('[DB] users index/admin seed ensured');

        await ensureAnalyticsIndexes();
        console.log('[DB] analytics indexes ensured');

        await ensureScheduleIndexes();
        await seedSchedules();
        console.log('[DB] doctor schedules index/seed ensured');

        return db;
      } catch (error) {
        console.error(`[DB] connection failed (attempt ${attempt}):`, error?.message);
        if (attempt === MAX_CONNECT_RETRIES) {
          connectPromise = null;
          throw error;
        }
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
    connectPromise = null;
    throw new Error('MongoDB connection failed after retries');
  })();

  return connectPromise;
};

export const getDB = async () => {
  if (!db) {
    console.log('[DB] getDB() called but not connected, connecting now...');
    await connectDB();
  }
  return db;
};
