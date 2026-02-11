import crypto from 'crypto';

const readTokenFromHeaders = (req) => {
  const bearer = req.get('authorization');
  if (bearer?.startsWith('Bearer ')) {
    return bearer.slice('Bearer '.length).trim();
  }
  return req.get('x-admin-token')?.trim() || '';
};

const secureEqual = (left, right) => {
  const a = Buffer.from(left, 'utf8');
  const b = Buffer.from(right, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

export const requireAdminAuth = (req, res, next) => {
  const configuredToken = String(process.env.ADMIN_API_TOKEN || '').trim();
  if (!configuredToken) {
    return res.status(500).json({
      success: false,
      message: 'Admin auth is not configured on server.'
    });
  }

  const providedToken = readTokenFromHeaders(req);
  if (!providedToken || !secureEqual(providedToken, configuredToken)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  return next();
};
