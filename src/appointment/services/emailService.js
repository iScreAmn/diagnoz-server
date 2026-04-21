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
      <h1>Запись к врачу — МЦ «Диагноз»</h1>
      <div class="field">
        <span class="label">Врач:</span>
        <span>${data.doctor}</span>
      </div>
      <div class="field">
        <span class="label">Имя пациента:</span>
        <span>${data.name}</span>
      </div>
      <div class="field">
        <span class="label">Телефон:</span>
        <span>${data.phone}</span>
      </div>
      <div class="field">
        <span class="label">Email:</span>
        <span>${data.email || '-'}</span>
      </div>
      <div class="field">
        <span class="label">Дата приёма:</span>
        <span>${data.appointmentDate || '-'}</span>
      </div>
      <div class="field">
        <span class="label">Согласие на обработку данных:</span>
        <span>${data.consent ? 'Да' : 'Нет'}</span>
      </div>
      <div class="meta">
        Отправлено: ${data.submitted_at}<br />
        ${data.ip ? `IP: ${data.ip}<br />` : ''}
        ${data.userAgent ? `User Agent: ${data.userAgent}` : ''}
      </div>
    </div>
  </body>
  </html>
`;

const generatePlainText = (data) => `
Запись к врачу — МЦ «Диагноз»
${'='.repeat(40)}
Врач: ${data.doctor}
Имя пациента: ${data.name}
Телефон: ${data.phone}
Email: ${data.email || '-'}
Дата приёма: ${data.appointmentDate || '-'}
Согласие: ${data.consent ? 'Да' : 'Нет'}

Отправлено: ${data.submitted_at}
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
    subject: `Запись к врачу — ${data.doctor} — Диагноз`,
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
