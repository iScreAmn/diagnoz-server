export const getEmailConfig = () => {
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
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
    throw new Error('ADMIN_EMAIL is not configured.');
  }
  return email.trim();
};

export const getEmailSender = () => ({
  name: 'Diagnoz Clinic',
  email: process.env.SMTP_USER || process.env.ADMIN_EMAIL
});
