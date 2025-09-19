import jwt from 'jsonwebtoken';

class AuthService {
  login(username, password) {
    if (username === 'admin' && password === 'admin') {
      const token = jwt.sign({ user: username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      return { success: true, token };
    }
    return { success: false, message: 'Invalid credentials' };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error(err)
      return null;
    }
  }
}

export default new AuthService();