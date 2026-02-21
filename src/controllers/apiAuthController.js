import AuthService from "../services/authService.js";
import TokenService from "../services/tokenService.js";
import RefreshTokenService from "../services/refreshTokenService.js";

function getRefreshTokenFromRequest(req) {
    return req.cookies?.refresh_token || req.body?.refresh_token || req.headers['x-refresh-token'];
}

function getDeviceIdFromRequest(req) {
    return req.headers['x-device-id'] || req.body?.device_id || req.cookies?.device_id;
}

function setRefreshCookie(res, token) {
    res.cookie('refresh_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        domain: process.env.COOKIE_SHARING_KEY,
        sameSite: 'lax',
    });
}

function setAccessCookie(res, token) {
    res.cookie('sso_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        domain: process.env.COOKIE_SHARING_KEY,
        sameSite: 'lax',
    });
}

function clearRefreshCookie(res) {
    res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        domain: process.env.COOKIE_SHARING_KEY,
        sameSite: 'lax',
    });
}

function clearAccessCookie(res) {
    res.clearCookie('sso_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        domain: process.env.COOKIE_SHARING_KEY,
        sameSite: 'lax',
    });
}

export const login = async (req, res) => {
    const { username, password } = req.body;
    const deviceId = getDeviceIdFromRequest(req);
    const result = await AuthService.login({
        username,
        password,
        tenantId: req.headers['x-tenant-id'],
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        deviceId,
    });
    if (result.success) {
        setAccessCookie(res, result.accessToken);
        setRefreshCookie(res, result.refreshToken);
        return res.json({ access_token: result.accessToken, refresh_token: result.refreshToken });
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

    return res.status(200).json({ userId: payload.sub, tenantId: payload.tenantId, exp: `${hours}h ${minutes % 60}m ${seconds % 60}s` });
}

export const refresh = async (req, res) => {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token not provided" });
    }
    const deviceId = getDeviceIdFromRequest(req);

    const result = await RefreshTokenService.rotateRefreshToken({
        rawToken: refreshToken,
        usedByIp: req.ip,
        usedByUserAgent: req.headers['user-agent'],
        deviceId,
    });

    if (result.error) {
        clearRefreshCookie(res);
        clearAccessCookie(res);
        return res.status(401).json({ error: result.error });
    }

    const accessToken = TokenService.createAuthToken({
        sub: result.record.userId,
        tenantId: result.record.tenantId,
        sid: result.record.sessionId,
    });

    setAccessCookie(res, accessToken);
    setRefreshCookie(res, result.rawToken);
    return res.json({ access_token: accessToken, refresh_token: result.rawToken });
};

export const logout = async (req, res) => {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (refreshToken) {
        await RefreshTokenService.revokeByRawToken(refreshToken);
    }
    clearRefreshCookie(res);
    clearAccessCookie(res);
    return res.status(204).send();
};

export const logoutAll = async (req, res) => {
    const authToken = TokenService.extractTokenFromRequest(req);
    let userId = null;
    let tenantId = null;

    if (authToken) {
        const payload = TokenService.verifyAuthToken(authToken);
        if (payload) {
            userId = payload.sub;
            tenantId = payload.tenantId;
        }
    }

    if (!userId) {
        const refreshToken = getRefreshTokenFromRequest(req);
        if (refreshToken) {
            const record = await RefreshTokenService.findByRawToken(refreshToken);
            if (record) {
                userId = record.userId;
                tenantId = record.tenantId;
            }
        }
    }

    if (!userId || !tenantId) {
        clearRefreshCookie(res);
        return res.status(401).json({ error: "Unable to determine session" });
    }

    await RefreshTokenService.revokeAllByUser({ tenantId, userId });
    clearRefreshCookie(res);
    clearAccessCookie(res);
    return res.status(204).send();
};
