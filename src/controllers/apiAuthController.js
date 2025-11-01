import AuthService from "../services/authService.js";
import TokenService from "../services/tokenService.js";

export const login = async (req, res) => {
    const { username, password } = req.body;
    const result = AuthService.login(username, password);
    if (result.success) {
        return res.json({ sso_token: result.token });
    } else {
        return res.status(401).json({ message: result.message });
    }
};

export function checkSsoToken(req, res) {
    const token = TokenService.extractTokenFromRequest(req);
    if (!token) {
        return res.status(401).json({ error: "Token not provided" });
    }

    const payload = TokenService.verifyAuthToken(token);
    if (!payload) {
        return res.status(401).json();
    }
    
    const diffSec = Math.floor(Math.max(new Date(payload.exp * 1000) - new Date(), 0) / 1000);
    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    return res.status(200).json({ user: payload.user, exp: `${hours}h ${minutes % 60}m ${seconds % 60}s` });
}