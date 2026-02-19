import { appointmentRepository } from '../../appointment/repositories/appointmentRepository.js';

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

export const createAdminAppointment = async (req, res) => {
  try {
    const doctor = String(req.body?.doctor || '').trim();
    const patientName = String(req.body?.patientName || '').trim();
    const rawDate = req.body?.appointmentDate;
    const appointmentDate = new Date(rawDate);

    if (!doctor) {
      return res.status(400).json({ success: false, message: 'Missing required field: doctor' });
    }
    if (!patientName) {
      return res.status(400).json({ success: false, message: 'Missing required field: patientName' });
    }
    if (!rawDate || Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid appointmentDate. Expected a valid date-time string.' });
    }

    const saved = await appointmentRepository.create({
      doctor,
      patientName,
      appointmentDate,
      status: 'confirmed'
    });

    return res.status(201).json({
      success: true,
      data: {
        id: saved.id,
        doctor: saved.doctor,
        patientName: saved.patientName,
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
