import { sendCallbackAdminEmail } from '../services/emailService.js';

const phoneRegex = /^\+?[0-9]{7,15}$/;

const normalizePhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length >= 10 && !cleaned.startsWith('+')) return `+${cleaned}`;
  return cleaned;
};

export const submitCallback = async (req, res) => {
  try {
    const { name, phone, consent } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['name', 'phone']
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

    await sendCallbackAdminEmail(emailData);

    return res.status(200).json({
      success: true,
      message: 'Заявка успешно отправлена!',
      data: { timestamp: emailData.submitted_at }
    });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error('Callback submission error:', errMsg);
    if (error?.stack) console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при отправке заявки. Пожалуйста, попробуйте позже.',
      error: errMsg
    });
  }
};
