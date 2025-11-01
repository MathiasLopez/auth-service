import jwt from 'jsonwebtoken';

class TokenService {
    /**
     * Extracts an authentication token from an HTTP request.
     * 
     * The method first attempts to retrieve the token from the request cookies under the name `sso_token`.  
     * If the cookie is not present, it then checks the `Authorization` header for a Bearer token.  
     * 
     * If no token is found in either source, the method returns `null`.
     *
     * @param {Object} req - The HTTP request object.
     * @returns {string|null} The extracted token if found, otherwise `null`.
     */
    extractTokenFromRequest(req) {
        if (req.cookies?.sso_token) {
            return req.cookies.sso_token;
        }

        const authHeader = req.headers["authorization"];
        if (authHeader?.startsWith("Bearer ")) {
            return authHeader.split(" ")[1];
        }

        return null;
    }

    createAuthToken(payload) {
        return createToken(payload, process.env.JWT_AUTH_SECRET, process.env.JWT_AUTH_EXPIRATION);
    }

    createEmailVerificationToken(payload) {
        return createToken(payload, process.env.JWT_EMAIL_VERIFICATION_SECRET, process.env.JWT_EMAIL_VERIFICATION_EXPIRATION);
    }

    createPasswordResetToken(payload) {
        return "Not yet implemented";//TODO: example: createToken(payload, process.env.JWT_PASSWORD_RESET_SECRET, process.env.JWT_PASSWORD_RESET_EXPIRATION);
    }

    /**
     * Verifies an authentication token.
     * 
     * Uses the authentication secret to validate the provided token.
     * If the token is valid, returns its decoded payload.
     * 
     * @param {string} token - The authentication token to verify.
     * @returns {Object|null} The decoded payload if the token is valid, otherwise `null`.
     */
    verifyAuthToken(token) {
        return verifyToken(token, process.env.JWT_AUTH_SECRET);
    }

    /**
     * Verifies an email verification token.
     * 
     * Uses the email verification secret to validate the provided token.
     * If the token is valid, returns its decoded payload.
     * 
     * @param {string} token - The email verification token to verify.
     * @returns {Object|null} The decoded payload if the token is valid, otherwise `null`.
     */
    verifyEmailVerificationToken(token) {
        return verifyToken(token, process.env.JWT_EMAIL_VERIFICATION_SECRET);
    }

    /**
     * Verifies a password reset token.
     * 
     * Uses the password reset secret to validate the provided token.
     * If the token is valid, returns its decoded payload.
     * 
     * @param {string} token - The password reset token to verify.
     * @returns {Object|null} The decoded payload if the token is valid, otherwise `null`.
     */
    verifyPasswordResetToken(token) {
        return "Not yet implemented";//TODO: example: return verifyToken(token, process.env.JWT_PASSWORD_RESET_SECRET);
    }
}

function createToken(payload, secret, expiresIn) {
    return jwt.sign(payload, secret, {
        algorithm: process.env.JWT_ALGORITHM,
        expiresIn,
    });
}

function verifyToken(token, secret) {
    try {
        return jwt.verify(token, secret, { algorithms: [process.env.JWT_ALGORITHM] });
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return 'Token Expired';
        }
        console.error(err)
        return null;
    }
}

export default new TokenService();