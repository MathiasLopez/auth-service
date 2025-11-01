import UserService from './userService.js';
import TokenService from './tokenService.js';

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
      const token = TokenService.createAuthToken({ sub: user.id });
      return { success: true, token };
    }
    return { success: false, message: 'Invalid credentials' };
  }
}

export default new AuthService();