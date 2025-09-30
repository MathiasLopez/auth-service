import AuthService from "../services/authService.js";
import UserService from "../services/userService.js"

export const renderLogin = (req, res) => {
    res.send(getLoginHtmlForm(req.query.redirect));
};

export const login = async (req, res) => {
    const { username, password } = req.body;

    const result = AuthService.login(username, password);

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

    return res.send(getLoginHtmlForm(req.query.redirect, result.message));
}

export const renderRegister = (req, res) => {
    res.send(getRegisterHtmlForm(req.query.redirect));
}

export const register = async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.send(getRegisterHtmlForm(req.query.redirect, "Passwords do not match."));
    }

    const result = await UserService.register({ username, email, password });
    const redirect = req.query.redirect ? `?redirect=${encodeURIComponent(req.query.redirect)}` : '';
    if (result.success) {
        res.redirect(`/login${redirect}`);
    } else {
        res.send(getRegisterHtmlForm(redirect, result.message))
    }
}

function getLoginHtmlForm(redirectUrl, message) {
    const redirect = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '';
    let authFormHtml = `<h2>Login</h2>
        <form method="POST" action="/login${redirect}">
        <input type="text" name="username" placeholder="User" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Log in</button>
        </form>`;

    if (message) {
        authFormHtml += `<p style="color: red; margin-top: 10px;">${message}</p>`
    } else {
        authFormHtml += `<a href="/register${redirect}"><button type="button">Create Account</button></a>`;

    }
    return authFormHtml;
}

function getRegisterHtmlForm(redirectUrl, message) {
    const redirect = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '';
    let registerFormHtml = `
        <h2>Create Account</h2>
        <form method="POST" action="/register${redirect}">
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