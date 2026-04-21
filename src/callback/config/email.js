/**
 * Email configuration for nodemailer (Gmail)
 */
const parseBoolean = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return undefined;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
};

const normalizeSmtpPass = (pass, host) => {
  const trimmed = String(pass || '').trim();
  if (!trimmed) return '';
  const isGmailHost = /(^|\.)gmail\.com$/i.test(String(host || '').trim());
  return isGmailHost ? trimmed.replace(/\s+/g, '') : trimmed;
};

export const getEmailConfig = () => {
  const port = parseInt(process.env.SMTP_PORT, 10) || 465;
  const host = (process.env.SMTP_HOST || process.env.SMTP_SERVER || 'smtp.gmail.com').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const pass = normalizeSmtpPass(process.env.SMTP_PASS, host);
  const authMethod = (process.env.SMTP_AUTH_METHOD || 'PLAIN').trim().toUpperCase();
  const requireTLS = (process.env.SMTP_REQUIRE_TLS || '').trim().toLowerCase() === 'true';
  const secure = parseBoolean(process.env.SMTP_SECURE) ?? (port === 465);
  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    authMethod,
    requireTLS,
    tls: {
      rejectUnauthorized: false,
      servername: host
    }
  };
};

export const getAdminEmail = () => {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
  const recipients = raw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  if (!recipients.length) {
    throw new Error('ADMIN_EMAIL or ADMIN_EMAILS is not configured. Set it in Vercel → Settings → Environment Variables.');
  }

  return recipients.join(', ');
};

export const getEmailSender = () => ({
  name: process.env.SMTP_FROM_NAME || 'Diagnoz Clinic',
  email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.ADMIN_EMAIL
});
