import jwt from 'jsonwebtoken';

const readBearerToken = (req) => {
  const bearer = req.get('authorization');
  if (!bearer?.startsWith('Bearer ')) return '';
  return bearer.slice('Bearer '.length).trim();
};

export const requireAdminAuth = (req, res, next) => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret) {
    return res.status(500).json({
      success: false,
      message: 'JWT auth is not configured on server.'
    });
  }

  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.admin = payload;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
};

/** owner + developer: полный доступ к панели (пользователи, конфликты и т.д.) */
export const requireServiceAdmin = (req, res, next) => {
  const role = req.admin?.role;
  if (role === 'owner' || role === 'developer') return next();
  return res.status(403).json({
    success: false,
    message: 'Forbidden'
  });
};

