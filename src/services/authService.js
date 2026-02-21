import UserService from './userService.js';
import TokenService from './tokenService.js';
import RefreshTokenService from './refreshTokenService.js';
import { v4 as uuidv4 } from 'uuid';

class AuthService {
  async login({ username, password, tenantId, ip, userAgent, deviceId }) {
    let user = await UserService.getUserByUsername(username);
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    if (!user.isActive) {
      return { success: false, message: 'You must validate your email address before you can log in.' };
    }

    if (await UserService.checkPassword({ user: { password: user.password }, password })) {
      const sessionId = uuidv4();
      const accessToken = TokenService.createAuthToken({
        sub: user.id,
        tenantId: tenantId ?? user.tenantId,
        sid: sessionId,
      });
      const { rawToken: refreshToken } = await RefreshTokenService.issueRefreshToken({
        tenantId: tenantId ?? user.tenantId,
        userId: user.id,
        sessionId,
        deviceId,
        createdByIp: ip,
        createdByUserAgent: userAgent,
      });
      return { success: true, accessToken, refreshToken, user };
    }
    return { success: false, message: 'Invalid credentials' };
  }
}

export default new AuthService();
