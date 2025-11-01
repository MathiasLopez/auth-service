import TokenService from "../services/tokenService.js";

const publicPaths = ['/login', '/api/login', '/register'];

export const authMiddleware = (req, res, next) => {
    if (publicPaths.includes(req.path)) return next();

    const token = TokenService.extractTokenFromRequest(req);
    if (!token) {
        return res.status(401).json({ error: "Token not provided" });
    }

    const payload = TokenService.verifyAuthToken(token);
    if (!payload) {
        return res.status(401).json();
    }
    req.userId = payload.sub;
    next();
}