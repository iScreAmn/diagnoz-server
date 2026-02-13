import { MongoClient } from 'mongodb';

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
    try {
      console.log('[DB] connecting to MongoDB...');
      if (!client) {
        client = new MongoClient(mongoUri, {
          maxPoolSize: 10
        });
      }

      await client.connect();
      console.log('[DB] MongoClient connected');

      const dbName = resolveDbName();
      db = client.db(dbName);
      console.log('[DB] using database:', dbName);

      await db.collection('appointments').createIndex(
        { doctor: 1, appointmentDate: 1 },
        { unique: true, name: 'uniq_doctor_appointmentDate' }
      );
      console.log('[DB] appointments index ensured');

      return db;
    } catch (error) {
      console.error('[DB] connection failed:', error?.message);
      connectPromise = null;
      throw error;
    }
  })();

  return connectPromise;
};

export const getDB = () => {
  if (!db) {
    throw new Error('Database is not connected. Call connectDB() first.');
  }
  return db;
};
