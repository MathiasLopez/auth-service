import jwt from 'jsonwebtoken';
import UserService from './userService.js';

class AuthService {
  async login(username, password) {
    let user = await UserService.getUserByUsername(username);
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    if (!user.isActive) {
      return { success: false, message: 'You must validate your email address before you can log in.' };
    }

    if (await UserService.checkPassword({ user: { password: user.password }, password })) {
      const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN, algorithm: process.env.JWT_ALGORITHM });
      return { success: true, token };
    }
    return { success: false, message: 'Invalid credentials' };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, { algorithms: [process.env.JWT_ALGORITHM] });
    } catch (err) {
      console.error(err)
      return null;
    }
  }

  extractToken(req) {
    if (req.cookies?.sso_token) {
      return req.cookies.sso_token;
    }

    const authHeader = req.headers["authorization"];
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.split(" ")[1];
    }

    return null;
  }
}

export default new AuthService();