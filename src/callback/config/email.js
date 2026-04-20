/**
 * Email configuration for nodemailer (Gmail)
 */
export const getEmailConfig = () => {
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const host = (process.env.SMTP_HOST || 'myitcloudsrvv1.myit-cloud.ge').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  return {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    },
    authMethod: process.env.SMTP_AUTH_METHOD || 'LOGIN',
    requireTLS: port === 587,
    tls: {
      rejectUnauthorized: false,
      servername: host
    }
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
