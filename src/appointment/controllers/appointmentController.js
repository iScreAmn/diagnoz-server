import { sendAppointmentAdminEmail } from '../services/emailService.js';
import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { normalizeAppointmentDate } from '../services/bookingStore.js';
import {
  validateDoctorWorkingDay,
  validateDoctorWorkingHours
} from '../services/doctorSchedule.js';

const phoneRegex = /^\+?[0-9]{7,15}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizePhone = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length >= 10 && !cleaned.startsWith('+')) return `+${cleaned}`;
  return cleaned;
};

const getTodayDateTbilisi = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

const getClinicDateTimeParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`
  };
};

export const createAppointment = async (req, res) => {
  try {
    const doctor = String(req.body?.doctor || '').trim();
    const patientName = String(req.body?.patientName || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const rawAppointmentDate = String(req.body?.appointmentDate || '').trim();
    const appointmentDate = new Date(rawAppointmentDate);

    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: doctor'
      });
    }

    if (!patientName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: patientName'
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: phone'
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone format. Expected 7-15 digits (optionally with +).'
      });
    }

    if (email && !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    if (!rawAppointmentDate || Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointmentDate. Expected a valid date-time string.'
      });
    }

    const scheduleValidation = await validateDoctorWorkingHours(doctor, appointmentDate);
    if (!scheduleValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: scheduleValidation.message
      });
    }

    const clinicDateTime = getClinicDateTimeParts(appointmentDate);
    const localSlot = `${clinicDateTime.date}T${clinicDateTime.time}`;
    const slotUtcDate = new Date(`${clinicDateTime.date}T${clinicDateTime.time}:00+04:00`);

    console.log('[createAppointment] Checking slot:', {
      doctor,
      localSlot,
      slotUtcDate: slotUtcDate.toISOString(),
      clinicDateTime
    });

    const occupied = await appointmentRepository.existsActiveSlot(doctor, localSlot, slotUtcDate);
    if (occupied) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    const emailData = {
      doctor,
      name: patientName,
      phone: normalizedPhone,
      email,
      appointmentDate: localSlot,
      consent: Boolean(req.body?.consent),
      submitted_at: new Date().toLocaleString('ru-RU', {
        timeZone: 'Asia/Tbilisi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent') || 'Unknown'
    };

    await sendAppointmentAdminEmail(emailData);

    const savedAppointment = await appointmentRepository.create({
      doctor,
      patientName,
      name: patientName,
      phone: normalizedPhone,
      email,
      appointmentDate: localSlot,
      status: 'pending',
      consent: Boolean(req.body?.consent)
    });

    return res.status(201).json({
      success: true,
      data: {
        id: savedAppointment.id,
        doctor: savedAppointment.doctor,
        patientName: savedAppointment.patientName,
        phone: savedAppointment.phone,
        email: savedAppointment.email,
        appointmentDate: savedAppointment.appointmentDate,
        status: savedAppointment.status,
        createdAt: savedAppointment.createdAt
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    console.error('Create appointment error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Unable to create appointment'
    });
  }
};

export const submitAppointment = async (req, res) => {
  try {
    const { doctor, name, phone, email, appointmentDate: rawAppointmentDate, consent } = req.body;

    if (!doctor || !String(doctor).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: doctor',
        required: ['doctor', 'name', 'phone', 'appointmentDate']
      });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: name',
        required: ['doctor', 'name', 'phone', 'appointmentDate']
      });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: phone',
        required: ['doctor', 'name', 'phone', 'appointmentDate']
      });
    }

    const appointmentDate = normalizeAppointmentDate(rawAppointmentDate);
    if (!appointmentDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid required field: appointmentDate',
        required: ['doctor', 'name', 'phone', 'appointmentDate']
      });
    }

    const todayDate = getTodayDateTbilisi();
    if (appointmentDate < todayDate) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past.'
      });
    }

    const doctorName = String(doctor).trim();
    const appointmentDateForSchedule = new Date(`${appointmentDate}T12:00:00+04:00`);
    const scheduleDayValidation = await validateDoctorWorkingDay(doctorName, appointmentDateForSchedule);
    if (!scheduleDayValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: scheduleDayValidation.message
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone format. Expected 7-15 digits (optionally with +).'
      });
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (normalizedEmail && !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    const emailData = {
      doctor: doctorName,
      name: String(name).trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      appointmentDate,
      consent: Boolean(consent),
      submitted_at: new Date().toLocaleString('ru-RU', {
        timeZone: 'Asia/Tbilisi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent') || 'Unknown'
    };

    await sendAppointmentAdminEmail(emailData);
    const savedAppointment = await appointmentRepository.create({
      doctor: emailData.doctor,
      name: emailData.name,
      phone: emailData.phone,
      email: emailData.email,
      appointmentDate: emailData.appointmentDate,
      consent: emailData.consent
    });

    console.log('Appointment submission:', {
      id: savedAppointment.id,
      doctor: emailData.doctor,
      name: emailData.name,
      phone: emailData.phone,
      email: emailData.email || '-',
      appointmentDate: emailData.appointmentDate,
      timestamp: emailData.submitted_at
    });

    return res.status(200).json({
      success: true,
      message: 'Заявка успешно отправлена!',
      data: {
        id: savedAppointment.id,
        timestamp: emailData.submitted_at,
        appointmentDate: emailData.appointmentDate
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        code: 'DATE_UNAVAILABLE',
        message: 'Selected date is unavailable for this doctor.',
        errorCode: 'E11000'
      });
    }

    const errMsg = error?.message || String(error);
    console.error('Appointment submission error:', errMsg);
    if (error?.stack) console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при отправке заявки. Пожалуйста, попробуйте позже.',
      error: errMsg
    });
  }
};

export const getAppointmentCalendar = async (req, res) => {
  const { doctor, from, to } = req.query;
  const doctorName = String(doctor || '').trim();

  if (!doctorName) {
    return res.status(400).json({
      success: false,
      message: 'Query param "doctor" is required.'
    });
  }

  const fromDate = from ? normalizeAppointmentDate(from) : '';
  const toDate = to ? normalizeAppointmentDate(to) : '';

  if (from && !fromDate) {
    return res.status(400).json({
      success: false,
      message: 'Invalid "from" date. Expected YYYY-MM-DD.'
    });
  }

  if (to && !toDate) {
    return res.status(400).json({
      success: false,
      message: 'Invalid "to" date. Expected YYYY-MM-DD.'
    });
  }

  if (fromDate && toDate && fromDate > toDate) {
    return res.status(400).json({
      success: false,
      message: '"from" date must be less than or equal to "to" date.'
    });
  }

  try {
    const unavailableDates = await appointmentRepository.findUnavailableDates(
      doctorName,
      fromDate,
      toDate
    );

    return res.status(200).json({
      success: true,
      data: {
        doctor: doctorName,
        from: fromDate || null,
        to: toDate || null,
        unavailableDates
      }
    });
  } catch (error) {
    console.error('Get appointment calendar error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load appointment calendar'
    });
  }
};
