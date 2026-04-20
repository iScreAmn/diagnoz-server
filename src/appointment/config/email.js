/**
 * Email configuration for nodemailer (shared with callback/calculator)
 */
const parseBoolean = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return undefined;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
};

export const getEmailConfig = () => {
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const host = (process.env.SMTP_HOST || process.env.SMTP_SERVER || 'notify.diagnoz.ge').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const authMethod = (process.env.SMTP_AUTH_METHOD || '').trim() || undefined;
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
    tls: { rejectUnauthorized: false, servername: host }
  };
};

export const getAdminEmail = () => {
  const email = process.env.ADMIN_EMAIL;
  if (!email || !email.trim()) {
    throw new Error('ADMIN_EMAIL is not configured. Set it in Vercel → Settings → Environment Variables.');
  }
  return email.trim();
};

export const getEmailSender = () => ({
  name: process.env.SMTP_FROM_NAME || 'Diagnoz Clinic',
  email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.ADMIN_EMAIL
});
