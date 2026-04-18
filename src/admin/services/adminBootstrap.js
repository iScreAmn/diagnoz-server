import bcrypt from 'bcryptjs';

const normalizeLogin = (value) => String(value || '').trim().toLowerCase();

const resolveSeedPasswordHash = async () => {
  const hashFromEnv = String(process.env.ADMIN_PASSWORD_HASH || '').trim();
  if (hashFromEnv) return hashFromEnv;

  const plainPassword = String(process.env.ADMIN_PASSWORD || '');
  if (!plainPassword) return '';

  return bcrypt.hash(plainPassword, 10);
};

export const seedInitialAdminUser = async (db) => {
  const usersCollection = db.collection('users');

  await usersCollection.createIndex(
    { login: 1 },
    {
      unique: true,
      name: 'uniq_user_login'
    }
  );

  const usersCount = await usersCollection.estimatedDocumentCount();
  if (usersCount > 0) return;

  const login = normalizeLogin(process.env.ADMIN_LOGIN);
  const passwordHash = await resolveSeedPasswordHash();
  if (!login || !passwordHash) {
    console.warn('[DB] users is empty and admin seed credentials are missing');
    return;
  }

  const now = new Date().toISOString();
  await usersCollection.insertOne({
    login,
    passwordHash,
    role: 'owner',
    passwordUpdatedAt: now,
    createdAt: now,
    updatedAt: now
  });

  console.log(`[DB] seeded initial admin user: ${login}`);
};
