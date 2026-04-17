import { ObjectId } from 'mongodb';
import { getDB } from '../../config/db.js';

const USER_ROLES = ['admin', 'owner'];

const normalizeLogin = (value) => String(value || '').trim().toLowerCase();

const mapUser = (doc) => ({
  id: String(doc._id),
  login: doc.login,
  passwordHash: doc.passwordHash,
  role: USER_ROLES.includes(doc.role) ? doc.role : 'admin',
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const getCollection = async () => (await getDB()).collection('users');

export const userRepository = {
  normalizeLogin,

  async findByLogin(login) {
    const normalizedLogin = normalizeLogin(login);
    if (!normalizedLogin) return null;

    const collection = await getCollection();
    const user = await collection.findOne({ login: normalizedLogin });
    return user ? mapUser(user) : null;
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
      { $set: { passwordHash: nextHash, updatedAt: now } },
      { returnDocument: 'after' }
    );

    return updated ? mapUser(updated) : null;
  }
};
