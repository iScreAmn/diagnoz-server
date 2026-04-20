export const getEmailConfig = () => {
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const host = (process.env.SMTP_HOST || 'myitcloudsrvv1.myit-cloud.ge').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const authMethod = (process.env.SMTP_AUTH_METHOD || '').trim() || undefined;
  const requireTLS = (process.env.SMTP_REQUIRE_TLS || '').trim().toLowerCase() === 'true';
  return {
    host,
    port,
    secure: port === 465,
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
    throw new Error('ADMIN_EMAIL is not configured.');
  }
  return email.trim();
};

export const getEmailSender = () => ({
  name: process.env.SMTP_FROM_NAME || 'Diagnoz Clinic',
  email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.ADMIN_EMAIL
});
