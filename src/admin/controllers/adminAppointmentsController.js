import { appointmentRepository } from '../../appointment/repositories/appointmentRepository.js';

const phoneRegex = /^\+?[0-9]{7,15}$/;
const normalizePhone = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length >= 10) return `+${cleaned}`;
  return cleaned;
};

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

export const createAdminAppointment = async (req, res) => {
  try {
    const doctor = String(req.body?.doctor || '').trim();
    const patientName = String(req.body?.patientName || '').trim();
    const rawDate = req.body?.appointmentDate;
    const appointmentDate = new Date(rawDate);
    const rawPhone = String(req.body?.phone || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!doctor) {
      return res.status(400).json({ success: false, message: 'Missing required field: doctor' });
    }
    if (!patientName) {
      return res.status(400).json({ success: false, message: 'Missing required field: patientName' });
    }
    if (!rawDate || Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid appointmentDate. Expected a valid date-time string.' });
    }

    let phone = '+0000000000';
    if (rawPhone) {
      const normalized = normalizePhone(rawPhone);
      if (!phoneRegex.test(normalized)) {
        return res.status(400).json({ success: false, message: 'Invalid phone format. Expected 7-15 digits (optionally with +).' });
      }
      phone = normalized;
    }

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tbilisi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(appointmentDate);
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
    const localSlot = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
    const slotUtcDate = new Date(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:00+04:00`);

    console.log('[createAdminAppointment] Creating slot:', {
      doctor,
      localSlot,
      slotUtcDate: slotUtcDate.toISOString(),
      rawDate
    });

    const occupied = await appointmentRepository.existsActiveSlot(doctor, localSlot, slotUtcDate);
    if (occupied) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked' });
    }

    const saved = await appointmentRepository.create({
      doctor,
      patientName,
      name: patientName,
      phone,
      email,
      appointmentDate: localSlot,
      status: 'confirmed'
    });

    return res.status(201).json({
      success: true,
      data: {
        id: saved.id,
        doctor: saved.doctor,
        patientName: saved.patientName,
        phone: saved.phone,
        email: saved.email,
        appointmentDate: saved.appointmentDate,
        status: saved.status,
        createdAt: saved.createdAt
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked' });
    }
    console.error('Admin create appointment error:', error?.message || error);
    return res.status(500).json({ success: false, message: 'Unable to create appointment' });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await appointmentRepository.findAll();
    return res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Get all appointments error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load appointments'
    });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  const id = String(req.params.id || '').trim();
  const status = String(req.body?.status || '').trim().toLowerCase();

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Missing appointment id'
    });
  }

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`
    });
  }

  try {
    if (status === 'confirmed') {
      const appointment = await appointmentRepository.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      if (appointment.status !== 'confirmed') {
        const localSlot = appointment.appointmentDate;
        const slotUtcDate = new Date(`${localSlot}:00+04:00`);
        
        const occupied = await appointmentRepository.existsActiveSlotExcludingId(
          appointment.doctor,
          localSlot,
          slotUtcDate,
          id
        );
        
        if (occupied) {
          return res.status(409).json({
            success: false,
            message: 'This time slot is already booked by another appointment'
          });
        }
      }
    }

    const updated = await appointmentRepository.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Status updated',
      data: updated
    });
  } catch (error) {
    console.error('Update appointment status error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Unable to update status'
    });
  }
};

export const deleteAppointment = async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Missing appointment id'
    });
  }

  try {
    const deleted = await appointmentRepository.deleteById(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment deleted',
      data: deleted
    });
  } catch (error) {
    console.error('Delete appointment error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Unable to delete appointment'
    });
  }
};
