import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';

const JWT_EXPIRES_IN = '12h';
const SERVICE_ADMIN_ROLES = ['owner', 'developer'];

const canManageTargetRole = (actorRole, targetRole) => {
  if (actorRole === 'developer') return true;
  if (actorRole === 'owner') return targetRole === 'admin';
  return false;
};

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

export const getAdminUsers = async (req, res) => {
  try {
    const users = await userRepository.findAll();
    const viewerRole = req.admin?.role;
    let list = users;
    if (viewerRole === 'owner') {
      list = users.filter((u) => u.role !== 'developer');
    }

    return res.status(200).json({
      success: true,
      data: list.map((user) => ({
        id: user.id,
        login: user.login,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get admin users error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load users'
    });
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const login = userRepository.normalizeLogin(req.body?.login);
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');

    if (!login || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'login, password and confirmPassword are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirmation do not match'
      });
    }

    const existingUser = await userRepository.findByLogin(login);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this login already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdUser = await userRepository.create({
      login,
      passwordHash,
      role: 'admin'
    });

    return res.status(201).json({
      success: true,
      data: {
        id: createdUser.id,
        login: createdUser.login,
        role: createdUser.role,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User with this login already exists'
      });
    }

    console.error('Create admin user error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Unable to create admin user'
    });
  }
};

export const updateAdminUserLogin = async (req, res) => {
  try {
    const actorRole = String(req.admin?.role || '');
    if (!SERVICE_ADMIN_ROLES.includes(actorRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const targetUserId = String(req.params?.id || '').trim();
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!canManageTargetRole(actorRole, targetUser.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const login = userRepository.normalizeLogin(req.body?.login);
    if (!login) {
      return res.status(400).json({ success: false, message: 'login is required' });
    }

    const duplicate = await userRepository.findByLogin(login);
    if (duplicate && String(duplicate.id) !== String(targetUser.id)) {
      return res.status(409).json({ success: false, message: 'User with this login already exists' });
    }

    const updated = await userRepository.updateLogin(targetUser.id, login);
    if (!updated) {
      return res.status(500).json({ success: false, message: 'Unable to update login' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: updated.id,
        login: updated.login,
        role: updated.role,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'User with this login already exists' });
    }
    console.error('Update admin login error:', error?.message || error);
    return res.status(500).json({ success: false, message: 'Unable to update login' });
  }
};

export const updateAdminUserPassword = async (req, res) => {
  try {
    const actorRole = String(req.admin?.role || '');
    if (!SERVICE_ADMIN_ROLES.includes(actorRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const targetUserId = String(req.params?.id || '').trim();
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!canManageTargetRole(actorRole, targetUser.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');
    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'password and confirmPassword are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirmation do not match' });
    }

    const nextHash = await bcrypt.hash(password, 10);
    const updated = await userRepository.updatePasswordHash(targetUser.id, nextHash);
    if (!updated) {
      return res.status(500).json({ success: false, message: 'Unable to update password' });
    }

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update admin password error:', error?.message || error);
    return res.status(500).json({ success: false, message: 'Unable to update password' });
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    const actorRole = String(req.admin?.role || '');
    if (!SERVICE_ADMIN_ROLES.includes(actorRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const targetUserId = String(req.params?.id || '').trim();
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!canManageTargetRole(actorRole, targetUser.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const deleted = await userRepository.deleteById(targetUser.id);
    if (!deleted) {
      return res.status(500).json({ success: false, message: 'Unable to delete user' });
    }

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete admin user error:', error?.message || error);
    return res.status(500).json({ success: false, message: 'Unable to delete user' });
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
      return res.status(403).json({
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
