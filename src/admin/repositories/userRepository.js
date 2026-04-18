import { ObjectId } from 'mongodb';
import { getDB } from '../../config/db.js';

const USER_ROLES = ['admin', 'owner', 'developer'];

const normalizeLogin = (value) => String(value || '').trim().toLowerCase();

const mapUser = (doc) => ({
  id: String(doc._id),
  login: doc.login,
  passwordHash: doc.passwordHash,
  role: USER_ROLES.includes(doc.role) ? doc.role : 'admin',
  passwordUpdatedAt: doc.passwordUpdatedAt || doc.updatedAt || '',
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const getCollection = async () => (await getDB()).collection('users');

export const userRepository = {
  normalizeLogin,

  async findAll() {
    const collection = await getCollection();
    const users = await collection
      .find({})
      .sort({ role: 1, createdAt: 1 })
      .toArray();

    return users.map(mapUser);
  },

  async findByLogin(login) {
    const normalizedLogin = normalizeLogin(login);
    if (!normalizedLogin) return null;

    const collection = await getCollection();
    const user = await collection.findOne({ login: normalizedLogin });
    return user ? mapUser(user) : null;
  },

  async create(record) {
    const normalizedLogin = normalizeLogin(record?.login);
    const passwordHash = String(record?.passwordHash || '').trim();
    const role = USER_ROLES.includes(record?.role) ? record.role : 'admin';
    if (!normalizedLogin || !passwordHash) return null;

    const collection = await getCollection();
    const now = new Date().toISOString();
    const payload = {
      login: normalizedLogin,
      passwordHash,
      role,
      passwordUpdatedAt: now,
      createdAt: now,
      updatedAt: now
    };

    const { insertedId } = await collection.insertOne(payload);
    return mapUser({ _id: insertedId, ...payload });
  },

  async findById(id) {
    const normalizedId = String(id || '').trim();
    if (!ObjectId.isValid(normalizedId)) return null;

    const collection = await getCollection();
    const user = await collection.findOne({ _id: new ObjectId(normalizedId) });
    return user ? mapUser(user) : null;
  },

  async updatePasswordHash(id, passwordHash) {
    const normalizedId = String(id || '').trim();
    const nextHash = String(passwordHash || '').trim();
    if (!ObjectId.isValid(normalizedId) || !nextHash) return null;

    const collection = await getCollection();
    const now = new Date().toISOString();

    const updated = await collection.findOneAndUpdate(
      { _id: new ObjectId(normalizedId) },
      { $set: { passwordHash: nextHash, passwordUpdatedAt: now, updatedAt: now } },
      { returnDocument: 'after' }
    );

    return updated ? mapUser(updated) : null;
  },

  async updateLogin(id, login) {
    const normalizedId = String(id || '').trim();
    const nextLogin = normalizeLogin(login);
    if (!ObjectId.isValid(normalizedId) || !nextLogin) return null;

    const collection = await getCollection();
    const now = new Date().toISOString();

    const updated = await collection.findOneAndUpdate(
      { _id: new ObjectId(normalizedId) },
      { $set: { login: nextLogin, updatedAt: now } },
      { returnDocument: 'after' }
    );

    return updated ? mapUser(updated) : null;
  },

  async deleteById(id) {
    const normalizedId = String(id || '').trim();
    if (!ObjectId.isValid(normalizedId)) return false;

    const collection = await getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(normalizedId) });
    return result.deletedCount > 0;
  }
};
