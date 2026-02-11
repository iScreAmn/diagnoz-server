import { appointmentRepository } from '../../appointment/repositories/appointmentRepository.js';
import { unbookDate } from '../../appointment/services/bookingStore.js';

export const getAllAppointments = (req, res) => {
  const appointments = appointmentRepository.findAll();
  return res.status(200).json({
    success: true,
    data: appointments
  });
};

export const deleteAppointment = (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Missing appointment id'
    });
  }

  const removed = appointmentRepository.deleteById(id);
  if (!removed) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  unbookDate(removed.doctor, removed.appointmentDate);

  return res.status(200).json({
    success: true,
    message: 'Appointment removed',
    data: removed
  });
};
