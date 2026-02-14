import { ObjectId } from 'mongodb';
import { getDB } from '../../config/db.js';

const mapAppointment = (doc) => ({
  id: String(doc._id),
  doctor: doc.doctor,
  patientName: doc.patientName || doc.name || '',
  name: doc.name,
  phone: doc.phone,
  email: doc.email || '',
  appointmentDate: doc.appointmentDate,
  consent: Boolean(doc.consent),
  createdAt: doc.createdAt
});

const getCollection = () => getDB().collection('appointments');

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
      createdAt: new Date().toISOString()
    };

    const { insertedId } = await getCollection().insertOne(payload);
    return mapAppointment({ _id: insertedId, ...payload });
  },

  async findAll() {
    const docs = await getCollection()
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(mapAppointment);
  },

  async findUnavailableDates(doctor, from, to) {
    const query = {
      doctor: String(doctor || '').trim()
    };

    if (from || to) {
      query.appointmentDate = {};
      if (from) query.appointmentDate.$gte = from;
      if (to) query.appointmentDate.$lte = to;
    }

    const docs = await getCollection()
      .find(query, { projection: { _id: 0, appointmentDate: 1 } })
      .sort({ appointmentDate: 1 })
      .toArray();

    return docs.map((item) => item.appointmentDate);
  },

  async deleteById(id) {
    const normalizedId = String(id || '').trim();
    if (!ObjectId.isValid(normalizedId)) return null;

    const result = await getCollection().findOneAndDelete({
      _id: new ObjectId(normalizedId)
    });

    if (!result) return null;
    return mapAppointment(result);
  }
};
