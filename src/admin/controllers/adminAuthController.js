import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const buildJwt = (login) => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      sub: 'admin',
      login
    },
    secret,
    { expiresIn: '12h' }
  );
};

export const loginAdmin = async (req, res) => {
  try {
    const login = String(req.body?.login || '').trim();
    const password = String(req.body?.password || '');
    const configuredLogin = String(process.env.ADMIN_LOGIN || '').trim();
    const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '').trim();

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Login and password are required'
      });
    }

    if (!configuredLogin || !passwordHash) {
      return res.status(500).json({
        success: false,
        message: 'Admin credentials are not configured on server'
      });
    }

    if (login !== configuredLogin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login or password'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login or password'
      });
    }

    const token = buildJwt(login);

    return res.status(200).json({
      success: true,
      data: {
        token,
        expiresIn: '12h'
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
