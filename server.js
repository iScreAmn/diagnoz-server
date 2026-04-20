import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import callbackRoutes from './src/callback/routes/callback.js';
import calculatorRoutes from './src/calculator/routes/calculator.js';
import appointmentRoutes from './src/appointment/routes/appointment.js';
import adminAppointmentsRoutes from './src/admin/routes/adminAppointments.js';
import { createAppointment } from './src/appointment/controllers/appointmentController.js';
import { createAdminAppointment } from './src/admin/controllers/adminAppointmentsController.js';
import { requireAdminAuth } from './src/admin/middleware/adminAuth.js';
import { connectDB } from './src/config/db.js';
import { verifyEmailConfig as verifyCallbackEmail } from './src/callback/services/emailService.js';
import { verifyEmailConfig as verifyCalculatorEmail } from './src/calculator/services/emailService.js';
import { verifyEmailConfig as verifyAppointmentEmail } from './src/appointment/services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('WARNING: SMTP credentials not found in .env file!');
  console.error('Please create .env file with SMTP_USER and SMTP_PASS');
}

if (!process.env.ADMIN_EMAIL) {
  console.error('WARNING: ADMIN_EMAIL not found in .env file!');
  console.error('Emails will not be sent until ADMIN_EMAIL is configured');
}

const smtpHostForLog = (process.env.SMTP_HOST || process.env.SMTP_SERVER || 'notify.diagnoz.ge').trim();
const smtpPortForLog = parseInt(process.env.SMTP_PORT, 10) || 587;
const smtpSecureForLog = String(process.env.SMTP_SECURE || '').trim()
  ? ['1', 'true', 'yes', 'on'].includes(String(process.env.SMTP_SECURE).trim().toLowerCase())
  : smtpPortForLog === 465;
const smtpUserForLog = (process.env.SMTP_USER || '').trim();
const maskedSmtpUser = smtpUserForLog
  ? `${smtpUserForLog.slice(0, 3)}***${smtpUserForLog.includes('@') ? smtpUserForLog.slice(smtpUserForLog.indexOf('@')) : ''}`
  : 'not-set';
console.log(`[SMTP] host=${smtpHostForLog} port=${smtpPortForLog} secure=${smtpSecureForLog} user=${maskedSmtpUser}`);

if (!process.env.ADMIN_LOGIN || (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD)) {
  console.error('WARNING: ADMIN_LOGIN with ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD) not found in .env file!');
  console.error('Initial users seed may fail if users collection is empty');
}

if (!process.env.JWT_SECRET) {
  console.error('WARNING: JWT_SECRET not found in .env file!');
  console.error('Admin API JWT auth will be inaccessible until JWT_SECRET is configured');
}

const app = express();
const PORT = process.env.PORT || 3001;

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:3000',
  'https://diagnoz.ge',
  'https://www.diagnoz.ge',
  'https://diagnoz-clinic.vercel.app',
  'https://www.diagnoz-clinic.vercel.app'
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    const whitelist = allowedOrigins.length ? allowedOrigins : defaultOrigins;
    if (!origin) return callback(null, true);
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    if (whitelist.includes(origin) || isLocal) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map();

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

const rateLimit = (req, res, next) => {
  const requestPath = req.originalUrl || req.url || req.path || '';
  if (requestPath.startsWith('/api/admin') || req.path.startsWith('/admin')) {
    return next();
  }
  const ip = getClientIp(req);
  const now = Date.now();
  const current = rateLimitStore.get(ip);

  if (!current || now > current.expiresAt) {
    rateLimitStore.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.'
    });
  }

  current.count += 1;
  rateLimitStore.set(ip, current);
  return next();
};

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Diagnoz Server',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Diagnoz Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health/email', async (req, res) => {
  const [callbackOk, calculatorOk, appointmentOk] = await Promise.all([
    verifyCallbackEmail(),
    verifyCalculatorEmail(),
    verifyAppointmentEmail()
  ]);
  res.json({
    success: callbackOk && calculatorOk && appointmentOk,
    callback: callbackOk,
    calculator: calculatorOk,
    appointment: appointmentOk,
    timestamp: new Date().toISOString()
  });
});

app.use('/api', rateLimit);
app.post('/appointments', createAppointment);
app.post('/admin/appointments', requireAdminAuth, createAdminAppointment);
app.use('/api/callback', callbackRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/appointment', appointmentRoutes);
app.use('/api/admin', adminAppointmentsRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  const origin = req.headers.origin;
  const allowed = [
    'https://diagnoz.ge',
    'https://www.diagnoz.ge',
    'https://diagnoz-clinic.vercel.app',
    'https://www.diagnoz-clinic.vercel.app'
  ];
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

console.log('[SERVER] VERCEL=', process.env.VERCEL, '| NODE_ENV=', process.env.NODE_ENV);

(async () => {
  try {
    await connectDB();
    console.log('[SERVER] MongoDB connected');
  } catch (err) {
    console.error('[SERVER] MongoDB connection failed:', err?.message);
  }
})();

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`Diagnoz Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(50));
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
  });
} else {
  console.log('[SERVER] running on Vercel (no listen)');
}

export default app;
