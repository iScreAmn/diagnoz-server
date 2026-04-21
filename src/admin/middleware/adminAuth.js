import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';

const readBearerToken = (req) => {
  const bearer = req.get('authorization');
  if (!bearer?.startsWith('Bearer ')) return '';
  return bearer.slice('Bearer '.length).trim();
};

export const requireAdminAuth = async (req, res, next) => {
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
    let user = null;
    if (payload?.sub) {
      user = await userRepository.findById(payload.sub);
    }
    if (!user && payload?.login) {
      user = await userRepository.findByLogin(payload.login);
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const tokenPwdAt = String(payload?.pwdAt || '').trim();
    const dbPwdAt = String(user.passwordUpdatedAt || user.updatedAt || '').trim();
    if (!tokenPwdAt || (dbPwdAt && tokenPwdAt !== dbPwdAt)) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    req.admin = {
      ...payload,
      sub: user.id,
      login: user.login,
      role: user.role
    };
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

/** developer only: полный доступ к аналитике */
export const requireDeveloperRole = (req, res, next) => {
  const role = req.admin?.role;
  if (role === 'developer') return next();
  return res.status(403).json({
    success: false,
    message: 'Forbidden: Developer access required'
  });
};

