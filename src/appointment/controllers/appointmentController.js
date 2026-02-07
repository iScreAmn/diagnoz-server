import { sendAppointmentAdminEmail } from '../services/emailService.js';

const phoneRegex = /^\+?[0-9]{7,15}$/;

const normalizePhone = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length >= 10 && !cleaned.startsWith('+')) return `+${cleaned}`;
  return cleaned;
};

export const submitAppointment = async (req, res) => {
  try {
    const { doctor, name, phone, consent } = req.body;

    if (!doctor || !String(doctor).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: doctor',
        required: ['doctor', 'name', 'phone']
      });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: name',
        required: ['doctor', 'name', 'phone']
      });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: phone',
        required: ['doctor', 'name', 'phone']
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone format. Expected 7-15 digits (optionally with +).'
      });
    }

    const emailData = {
      doctor: String(doctor).trim(),
      name: String(name).trim(),
      phone: normalizedPhone,
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

    console.log('Appointment submission:', {
      doctor: emailData.doctor,
      name: emailData.name,
      phone: emailData.phone,
      timestamp: emailData.submitted_at
    });

    return res.status(200).json({
      success: true,
      message: 'Заявка успешно отправлена!',
      data: { timestamp: emailData.submitted_at }
    });
  } catch (error) {
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
