import AuthService from "../services/authService.js";
import UserService from "../services/userService.js"
import EmailService from "../services/emailService.js";
import UrlUtils from "../utils/urlUtils.js";
import TokenService from '../services/tokenService.js';

export const renderLogin = (req, res) => {
    res.send(getLoginHtmlForm(req));
};

export const login = async (req, res) => {
    const { username, password } = req.body;

    const result = await AuthService.login(username, password);

    if (result.success) {
        res.cookie('sso_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            domain: process.env.COOKIE_SHARING_KEY,
            sameSite: 'lax'
        });
        if (req.query.redirect) {
            return res.redirect(req.query.redirect);
        } else {
            return res.send(`<h2>Login successful</h2>`);
        }
    }

    return res.send(getLoginHtmlForm(req, result.message));
}

export const renderRegister = (req, res) => {
    res.send(getRegisterHtmlForm(req));
}

export const register = async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.send(getRegisterHtmlForm(req, "Passwords do not match."));
    }

    const redirect = req.query.redirect;
    const result = await UserService.register({ username, email, password });
    if (result.success) {
        const sendResult = await EmailService.sendVerificationEmail({ user: result.user, query: { redirect } });
        if (sendResult) {
            return res.redirect(UrlUtils.buildUrlWithQuery('/login', { redirect }));
        } else {
            // TODO: Log error and try to resend email again or show button to resend.
            return res.send(getRegisterHtmlForm(req, 'An error occurred while attempting to send the confirmation email. Please try sending another one.'));
        }
    } else {
        res.send(getRegisterHtmlForm(req, result.message));
    }
}

export const verificationEmailController = async (req, res) => {
    const { token } = req.query;

    try {
        if (!token)
            return res.status(400).send(getVerifyHtml({ message: 'Token is missing', success: false, req: req }));

        const payload = await TokenService.verifyEmailVerificationToken(token);
        if (!payload) {
            throw new Error();
        }
        const verificationResult = await UserService.emailVerification(payload.sub);
        if (verificationResult.alreadyActive) {
            return res.status(200).send(getVerifyHtml({ message: 'Your account was already verified', success: true, req: req }));
        }

        return res.status(200).send(getVerifyHtml({ message: 'Your account has been successfully verified', success: true, req: req }));
    } catch (err) {
        if (err.message === 'User not found') {
            return res.status(404).send(getVerifyHtml({ message: err.message, success: false, req: req }));
        }
        if (err.message == 'Token Expired') {
            return res.status(401).send(getVerifyHtml({ message: err.message, success: false, req: req, tokenExpired: true }));
        }
        console.error(err);
        return res.status(400).send(getVerifyHtml({ message: 'The verification link is invalid', success: false, req: req }));
    }
}


function getLoginHtmlForm(request, message) {
    const redirect = request.query.redirect;
    let authFormHtml = `<h2>Login</h2>
        <form method="POST" action="${UrlUtils.buildUrlWithQuery('/login', { redirect })}">
        <input type="text" name="username" placeholder="User" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Log in</button>
        </form>`;

    if (message) {
        authFormHtml += `<p style="color: red; margin-top: 10px;">${message}</p>`
    } else {
        authFormHtml += `<a href="${UrlUtils.buildUrlWithQuery('/register', { redirect })}"><button type="button">Create Account</button></a>`;
    }
    return authFormHtml;
}

function getRegisterHtmlForm(request, message) {
    const redirect = request.query.redirect;
    let registerFormHtml = `
        <h2>Create Account</h2>
        <form method="POST" action="${UrlUtils.buildUrlWithQuery('/register', { redirect })}">
            <input type="text" name="username" placeholder="User" required />
            <input type="email" name="email" placeholder="Email" required />
            <input type="password" name="password" placeholder="Password" required />
            <input type="password" name="confirmPassword" placeholder="Confirm Password" required />
            <button type="submit">Register</button>
        </form>
        `;

    if (message) {
        registerFormHtml += `<p style="color: red; margin-top: 10px;">${message}</p>`
    }

    return registerFormHtml;
}

function getVerifyHtml({ req, message, success, tokenExpired }) {
    const color = success ? '#28a745' : '#dc3545';
    const redirect = req.query.redirect;
    const redirectUrl = UrlUtils.buildUrlWithQuery('/login', { redirect });
    const redirectRegisterUrl = UrlUtils.buildUrlWithQuery('/verification/email/resend', { redirect });

    let page = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Verificación de cuenta</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 50px; }
        .message { color: ${color}; font-size: 1.2em; margin-bottom: 20px; }
        .button {
          background: #007bff; color: white; border: none;
          padding: 10px 20px; border-radius: 5px; text-decoration: none;
        }
      </style>
    </head>
    <body>`;
    if (tokenExpired) {
        page += `  <div class="message">${message}</div>
        <a href="${redirectUrl}" class="button">Ir al login</a>
        <a href="${redirectRegisterUrl}" class="button">Solicitar otro</a>
        </body>
        </html>
    `;
    } else {
        page += `  <div class="message">${message}</div>
            <a href="${redirectUrl}" class="button">Ir al login</a>
            </body>
            </html>
        `;
    }
    return page;
}

/**
 * Genera el HTML del formulario para reenviar el correo de verificación.
 * @param {string} [message] - Mensaje de éxito o error.
 * @param {boolean} [isError=false] - Indica si el mensaje es de error.
 * @returns {string} HTML del formulario.
 */
export const resendVerificationEmailController = (req, res) => {
    return res.send(resendVerificationEmailHtml(req));
}

export const handlerResendVerificationEmailController = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).send(resendVerificationEmailHtml(req, 'Email is required.', true));
        }

        const user = await UserService.getUserByEmail(email);
        if (!user) {
            return res.status(400).send(resendVerificationEmailHtml(req, 'No user found with that email.', true));
        }

        if (user.isActive) {
            return res.send(resendVerificationEmailHtml(req, 'This account is already verified.', true));
        }
        const redirect = req.query.redirect;
        const sendResult = await EmailService.sendVerificationEmail({ user, redirect });
        if (sendResult) {
            return res.send(resendVerificationEmailHtml(req, 'A new verification email has been sent.'));
        } else {
            return res.status(400).send(resendVerificationEmailHtml(req, 'Try again.', true));
        }
    } catch (error) {
        console.error('Error resending verification email:', error);
        return res.send(resendVerificationEmailHtml(req, 'An unexpected error occurred.', true));
    }
}

function resendVerificationEmailHtml(request, message, isError = false) {
    const redirect = request.query.redirect;
    let html = `
        <h2>Resend Verification Email</h2>
        <form method="POST" action="${UrlUtils.buildUrlWithQuery('/verification/email/resend', { redirect })}">
            <input type="email" name="email" placeholder="Enter your email" required />
            <button type="submit">Send Verification Email</button>
        </form>
        `;

    if (message) {
        const color = isError ? 'red' : 'green';
        html += `<p style="color: ${color}; margin-top: 10px;">${message}</p>`;
    }

    html += `<a href="${UrlUtils.buildUrlWithQuery('/login', { redirect })}"><button type="button">Back to Login</button></a>`;
    return html;
}
