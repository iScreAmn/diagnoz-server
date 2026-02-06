import pkg from 'nodemailer';
const { createTransport } = pkg;
import { getEmailConfig, getAdminEmail, getEmailSender } from '../config/email.js';

const createTransporter = () => {
  const config = getEmailConfig();
  return createTransport(config);
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
      <h1>Заявка на обратный звонок — МЦ «Диагноз»</h1>
      <div class="field">
        <span class="label">Имя:</span>
        <span>${data.name}</span>
      </div>
      <div class="field">
        <span class="label">Телефон:</span>
        <span>${data.phone}</span>
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
Заявка на обратный звонок — МЦ «Диагноз»
${'='.repeat(40)}
Имя: ${data.name}
Телефон: ${data.phone}
Согласие: ${data.consent ? 'Да' : 'Нет'}

Отправлено: ${data.submitted_at}
${data.ip ? `IP: ${data.ip}\n` : ''}${data.userAgent ? `User Agent: ${data.userAgent}` : ''}
`.trim();

export const sendCallbackAdminEmail = async (data) => {
  const transporter = createTransporter();
  const sender = getEmailSender();
  const mailOptions = {
    from: `"${sender.name}" <${sender.email}>`,
    to: getAdminEmail(),
    subject: 'Заявка на обратный звонок — Диагноз',
    html: generateEmailHTML(data),
    text: generatePlainText(data)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Callback admin email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Callback admin email failed:', error.message);
    throw error;
  }
};

export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error.message);
    return false;
  }
};
