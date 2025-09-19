import AuthService from "../services/authService.js";

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
            const url = new URL(req.query.redirect);
            url.searchParams.set('successful_authentication', true);

            return res.redirect(url.toString());
        } else {
            return res.send(`<h2>Login successful</h2>`);
        }
    }

    return res.send(getLoginHtmlForm(req.query.redirect, result.message));
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
    }
    return authFormHtml;
}