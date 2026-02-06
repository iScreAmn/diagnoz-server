import pkg from 'nodemailer';
const { createTransport } = pkg;
import { getEmailConfig, getAdminEmail, getEmailSender } from '../config/email.js';

const createTransporter = () => createTransport(getEmailConfig());

const formatPrice = (value) => `${Number(value).toLocaleString('ru-RU')} ₾`;

const generateEmailHTML = (data) => {
  const rows = (data.analyses || []).map(
    (a) => `
    <tr>
      <td>${a.title || a.id}</td>
      <td>${formatPrice(a.price || 0)}</td>
    </tr>`
  ).join('');
  const total = (data.analyses || []).reduce((s, a) => s + (Number(a.price) || 0), 0);

  return `
  <!DOCTYPE html>
  <html lang="ru">
  <head><meta charset="UTF-8"><style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#222;}
    .container{max-width:640px;margin:0 auto;padding:20px;}
    h1{font-size:20px;margin-bottom:16px;}
    .field{margin-bottom:10px;}
    .label{font-weight:600;}
    table{border-collapse:collapse;width:100%;margin:12px 0;}
    th,td{border:1px solid #ddd;padding:8px;text-align:left;}
    th{background:#f5f5f5;}
    .meta{margin-top:16px;font-size:12px;color:#666;}
  </style></head>
  <body>
    <div class="container">
      <h1>Заявка с калькулятора анализов — МЦ «Диагноз»</h1>
      <div class="field"><span class="label">Имя:</span> ${data.firstName}</div>
      <div class="field"><span class="label">Фамилия:</span> ${data.lastName}</div>
      <div class="field"><span class="label">Телефон:</span> ${data.phone}</div>
      <div class="field"><span class="label">Email:</span> ${data.email || '—'}</div>
      <h2 style="font-size:16px;margin-top:20px;">Выбранные анализы</h2>
      <table>
        <thead><tr><th>Название</th><th>Цена</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p><strong>Итого: ${formatPrice(total)}</strong></p>
      <div class="meta">
        Отправлено: ${data.submitted_at}<br />
        ${data.ip ? `IP: ${data.ip}<br />` : ''}
        ${data.userAgent ? `User-Agent: ${data.userAgent}` : ''}
      </div>
    </div>
  </body>
  </html>`;
};

const generatePlainText = (data) => {
  const lines = (data.analyses || []).map((a) => `  ${a.title || a.id} | ${formatPrice(a.price || 0)}`);
  const total = (data.analyses || []).reduce((s, a) => s + (Number(a.price) || 0), 0);
  return `
Заявка с калькулятора анализов — МЦ «Диагноз»
${'='.repeat(50)}
Имя: ${data.firstName}
Фамилия: ${data.lastName}
Телефон: ${data.phone}
Email: ${data.email || '—'}

Выбранные анализы:
${lines.join('\n')}

Итого: ${formatPrice(total)}

Отправлено: ${data.submitted_at}
${data.ip ? `IP: ${data.ip}\n` : ''}${data.userAgent ? `User-Agent: ${data.userAgent}` : ''}
`.trim();
};

export const sendCalculatorAdminEmail = async (data) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const err = new Error('SMTP not configured.');
    console.error(err.message);
    throw err;
  }
  const transporter = createTransporter();
  const sender = getEmailSender();
  const mailOptions = {
    from: `"${sender.name}" <${sender.email}>`,
    to: getAdminEmail(),
    subject: 'Заявка с калькулятора анализов — Диагноз',
    html: generateEmailHTML(data),
    text: generatePlainText(data),
    replyTo: data.email ? `"${data.firstName} ${data.lastName}" <${data.email}>` : undefined
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Calculator admin email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Calculator admin email failed:', error.message);
    throw error;
  }
};

export const verifyEmailConfig = async () => {
  try {
    await createTransporter().verify();
    return true;
  } catch (error) {
    console.error('Calculator email config error:', error.message);
    return false;
  }
};
