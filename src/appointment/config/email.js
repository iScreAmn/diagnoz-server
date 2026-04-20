/**
 * Email configuration for nodemailer (shared with callback/calculator)
 */
export const getEmailConfig = () => {
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  return {
    host: process.env.SMTP_HOST || 'myitcloudsrvv1.myit-cloud.ge',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: { rejectUnauthorized: false }
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
