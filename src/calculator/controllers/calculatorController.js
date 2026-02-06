import { sendCalculatorAdminEmail } from '../services/emailService.js';

const phoneRegex = /^\+?[0-9]{7,15}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizePhone = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length >= 10) return `+${cleaned}`;
  return cleaned;
};

const ensureAnalysesArray = (analyses) => {
  if (Array.isArray(analyses)) return analyses;
  if (analyses && typeof analyses === 'object') return [analyses];
  return [];
};

export const submitCalculator = async (req, res) => {
  try {
    const { analyses, firstName, lastName, phone, email } = req.body;

    if (!firstName || !String(firstName).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Имя обязательно.',
        required: ['firstName']
      });
    }
    if (!lastName || !String(lastName).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Фамилия обязательна.',
        required: ['lastName']
      });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Телефон обязателен.',
        required: ['phone']
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный формат телефона. Ожидается 7–15 цифр (можно с +).'
      });
    }

    const emailVal = email ? String(email).trim() : '';
    if (emailVal && !emailRegex.test(emailVal)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный формат email.'
      });
    }

    const analysesList = ensureAnalysesArray(analyses).map((a) => ({
      id: a.id,
      title: a.title || a.id,
      code: a.code || '',
      price: Number(a.price) || 0,
      eta: a.eta || ''
    }));

    const emailData = {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      phone: normalizedPhone,
      email: emailVal || undefined,
      analyses: analysesList,
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

    await sendCalculatorAdminEmail(emailData);

    console.log('Calculator submission:', {
      name: `${emailData.firstName} ${emailData.lastName}`,
      phone: emailData.phone,
      analysesCount: emailData.analyses.length,
      timestamp: emailData.submitted_at
    });

    return res.status(200).json({
      success: true,
      message: 'Заявка успешно отправлена!',
      data: { timestamp: emailData.submitted_at }
    });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error('Calculator submission error:', errMsg);
    if (error?.stack) console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при отправке заявки. Пожалуйста, попробуйте позже.',
      error: errMsg
    });
  }
};
