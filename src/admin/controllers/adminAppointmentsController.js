import { appointmentRepository } from '../../appointment/repositories/appointmentRepository.js';

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

export const deleteAppointment = async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Missing appointment id'
    });
  }

  try {
    const removed = await appointmentRepository.deleteById(id);
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment removed',
      data: removed
    });
  } catch (error) {
    console.error('Delete appointment error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Unable to remove appointment'
    });
  }
};
