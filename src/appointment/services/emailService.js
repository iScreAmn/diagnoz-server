import pkg from 'nodemailer';
const { createTransport } = pkg;
import { getEmailConfig, getAdminEmail, getEmailSender } from '../config/email.js';

const createTransporter = () => {
  const config = getEmailConfig();
  return createTransport(config);
};

const toVerificationError = (error) => ({
  message: error?.message || 'Unknown SMTP error',
  code: error?.code || null,
  responseCode: error?.responseCode || null,
  command: error?.command || null
});

const formatAppointmentDateTime = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '-';
  return normalized.replace('T', ' ');
};

const generateEmailHTML = (data) => `
  <!DOCTYPE html>
  <html lang="ru">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #222; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      h1 { font-size: 20px; margin-bottom: 16px; }
      .field { margin-bottom: 12px; }
      .label { font-weight: 600; display: block; margin-bottom: 4px; }
      .meta { margin-top: 16px; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Новая запись пациента</h1>
      <div class="field">
        <span class="label">Врач:</span>
        <span>${data.doctor}</span>
      </div>
      <div class="field">
        <span class="label">Имя и фамилия:</span>
        <span>${data.name}</span>
      </div>
      <div class="field">
        <span class="label">Телефон:</span>
        <span>${data.phone}</span>
      </div>
      <div class="field">
        <span class="label">Дата и время приёма:</span>
        <span>${formatAppointmentDateTime(data.appointmentDate)}</span>
      </div>
      <div class="field">
        <span class="label">Почта:</span>
        <span>${data.email || 'не указана'}</span>
      </div>
      <div class="meta" style="margin-top: 24px; font-size: 14px; color: #222;">
        Для управления записью, перейдите в панель управления
        <a href="https://diagnoz.ge/controls" target="_blank" rel="noopener noreferrer">https://diagnoz.ge/controls</a>
      </div>
      ${data.submitted_at ? `<div class="meta">Отправлено: ${data.submitted_at}</div>` : ''}
      ${data.ip ? `<div class="meta">IP: ${data.ip}</div>` : ''}
      ${data.userAgent ? `<div class="meta">User Agent: ${data.userAgent}</div>` : ''}
    </div>
  </body>
  </html>
`;

const generatePlainText = (data) => `
Новая запись пациента
${'='.repeat(40)}
Врач: ${data.doctor}
Имя и фамилия: ${data.name}
Телефон: ${data.phone}
Дата и время приёма: ${formatAppointmentDateTime(data.appointmentDate)}
Почта: ${data.email || 'не указана'}

Для управления записью, перейдите в панель управления https://diagnoz.ge/controls

${data.submitted_at ? `Отправлено: ${data.submitted_at}` : ''}
${data.ip ? `IP: ${data.ip}\n` : ''}${data.userAgent ? `User Agent: ${data.userAgent}` : ''}
`.trim();

export const sendAppointmentAdminEmail = async (data) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const err = new Error('SMTP not configured. Set SMTP_USER and SMTP_PASS in Vercel Environment Variables.');
    console.error(err.message);
    throw err;
  }
  const transporter = createTransporter();
  const sender = getEmailSender();
  const mailOptions = {
    from: `"${sender.name}" <${sender.email}>`,
    to: getAdminEmail(),
    subject: 'Новая запись пациента',
    html: generateEmailHTML(data),
    text: generatePlainText(data)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Appointment admin email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Appointment admin email failed:', error.message, error?.responseCode || '', error?.response || '');
    throw error;
  }
};

export const verifyEmailConfigDetailed = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { ok: true };
  } catch (error) {
    console.error('Appointment email config error:', error.message);
    return { ok: false, error: toVerificationError(error) };
  }
};

export const verifyEmailConfig = async () => {
  const result = await verifyEmailConfigDetailed();
  return result.ok;
};
