import TokenService from "../services/tokenService.js";

const publicPaths = ['/login', '/api/login', '/register', '/verification/email', '/verification/email/resend', '/forgot-password', '/reset-password'];

export const authMiddleware = (req, res, next) => {
    try {
        if (publicPaths.includes(req.path)) return next();

        const token = TokenService.extractTokenFromRequest(req);
        if (token) {
            const payload = TokenService.verifyAuthToken(token);
            if (!payload) {
                return res.status(401).json();
            }
            req.userId = payload.sub;
            next();
        } else {
            return res.status(401).json({ error: "Token not provided" });
        }
    } catch (error) {
        return res.status(401).json({ error: error.message });
    }
}