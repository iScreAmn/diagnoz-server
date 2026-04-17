import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';

const JWT_EXPIRES_IN = '12h';

const buildJwt = (user) => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      sub: user.id,
      login: user.login,
      role: user.role
    },
    secret,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const loginAdmin = async (req, res) => {
  try {
    const login = userRepository.normalizeLogin(req.body?.login);
    const password = String(req.body?.password || '');

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Login and password are required'
      });
    }

    const user = await userRepository.findByLogin(login);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login or password'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login or password'
      });
    }

    const token = buildJwt(user);

    return res.status(200).json({
      success: true,
      data: {
        token,
        expiresIn: JWT_EXPIRES_IN,
        user: {
          login: user.login,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Unable to login'
    });
  }
};

export const changeAdminPassword = async (req, res) => {
  try {
    const currentAdmin = req.admin || {};
    const oldPassword = String(req.body?.oldPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    const confirmNewPassword = String(req.body?.confirmNewPassword || '');

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'oldPassword, newPassword and confirmNewPassword are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      });
    }

    let user = null;
    if (currentAdmin.sub) {
      user = await userRepository.findById(currentAdmin.sub);
    }
    if (!user && currentAdmin.login) {
      user = await userRepository.findByLogin(currentAdmin.login);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Old password is incorrect'
      });
    }

    const nextPasswordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePasswordHash(user.id, nextPasswordHash);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change admin password error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Unable to change password'
    });
  }
};
