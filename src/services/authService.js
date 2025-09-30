import jwt from 'jsonwebtoken';
import UserService from './userService.js';
const adminHash = '$2b$05$R9IA8U/Ebki0CesrWZlJQ.BRV3Z9xUKnsnVdr6.3JsImMqDNq/5Pi'; // Pass: Admin123!
class AuthService {
  login(username, password) {
    if (username === 'admin' && UserService.checkPassword({ user: { password: adminHash }, password})) {
      const token = jwt.sign({ sub: "1" }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN, algorithm: process.env.JWT_ALGORITHM });
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