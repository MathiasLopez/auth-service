import TokenService from "../services/tokenService.js";
import UserService from "../services/userService.js";

const publicPaths = [
    '/login',
    '/api/login',
    '/api/refresh',
    '/api/logout',
    '/api/logout/all',
    '/register',
    '/verification/email',
    '/verification/email/resend',
    '/forgot-password',
    '/reset-password',
];

export const authMiddleware = async (req, res, next) => {
    try {
        if (publicPaths.includes(req.path)) return next();

        const token = TokenService.extractTokenFromRequest(req);
        if (token) {
            const payload = TokenService.verifyAuthToken(token);
            if (!payload) {
                return res.status(401).json();
            }
            const userRecord = await UserService.getUserById(payload.sub);
            if (!userRecord) {
                return res.status(401).json();
            }
            if (payload.iat && userRecord.passwordChangedAt) {
                const tokenIssuedAt = new Date(payload.iat * 1000);
                if (userRecord.passwordChangedAt > tokenIssuedAt) {
                    return res.status(401).json({ error: "Token expired" });
                }
            }
            req.userId = payload.sub;
            req.tenantId = payload.tenantId ?? userRecord.tenantId;
            next();
        } else {
            return res.status(401).json({ error: "Token not provided" });
        }
    } catch (error) {
        return res.status(401).json({ error: error.message });
    }
}
