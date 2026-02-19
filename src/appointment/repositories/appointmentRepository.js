import { ObjectId } from 'mongodb';
import { getDB } from '../../config/db.js';

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

const mapAppointment = (doc) => ({
  id: String(doc._id),
  doctor: doc.doctor,
  patientName: doc.patientName || doc.name || '',
  name: doc.name,
  phone: doc.phone,
  email: doc.email || '',
  appointmentDate: doc.appointmentDate,
  consent: Boolean(doc.consent),
  status: STATUSES.includes(doc.status) ? doc.status : 'pending',
  createdAt: doc.createdAt
});

const getCollection = async () => (await getDB()).collection('appointments');

export const appointmentRepository = {
  async create(record) {
    const payload = {
      doctor: record.doctor,
      patientName: record.patientName || record.name || '',
      name: record.name,
      phone: record.phone,
      email: record.email || '',
      appointmentDate: record.appointmentDate,
      consent: Boolean(record.consent),
      status: STATUSES.includes(record.status) ? record.status : 'pending',
      createdAt: new Date().toISOString()
    };

    const collection = await getCollection();
    const { insertedId } = await collection.insertOne(payload);
    return mapAppointment({ _id: insertedId, ...payload });
  },

  async findAll() {
    const collection = await getCollection();
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(mapAppointment);
  },

  async findUnavailableDates(doctor, from, to) {
    const query = {
      doctor: String(doctor || '').trim(),
      $or: [
        { status: { $in: ['pending', 'confirmed'] } },
        { status: { $exists: false } }
      ]
    };

    if (from || to) {
      query.appointmentDate = {};
      if (from) query.appointmentDate.$gte = from;
      if (to) query.appointmentDate.$lte = to;
    }

    const collection = await getCollection();
    const docs = await collection
      .find(query, { projection: { _id: 0, appointmentDate: 1 } })
      .sort({ appointmentDate: 1 })
      .toArray();

    return docs.map((item) => item.appointmentDate);
  },

  async existsActiveSlot(doctor, localSlot, utcDate) {
    const normalizedDoctor = String(doctor || '').trim();
    if (!normalizedDoctor || !localSlot || !utcDate) return false;

    const collection = await getCollection();
    const isoValue = utcDate.toISOString();

    const conflict = await collection.findOne({
      doctor: normalizedDoctor,
      $or: [
        { status: { $in: ['pending', 'confirmed'] } },
        { status: { $exists: false } }
      ],
      appointmentDate: {
        $in: [localSlot, utcDate, isoValue]
      }
    }, {
      projection: { _id: 1 }
    });

    return Boolean(conflict);
  },

  async updateStatus(id, status) {
    const normalizedId = String(id || '').trim();
    if (!ObjectId.isValid(normalizedId)) return null;
    if (!STATUSES.includes(status)) return null;

    const collection = await getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(normalizedId) },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    if (!result) return null;
    return mapAppointment(result);
  },

  async deleteById(id) {
    const normalizedId = String(id || '').trim();
    if (!ObjectId.isValid(normalizedId)) return null;

    const collection = await getCollection();
    const result = await collection.findOneAndDelete({
      _id: new ObjectId(normalizedId)
    });

    if (!result) return null;
    return mapAppointment(result);
  }
};
