import { MailtrapClient } from "mailtrap"
import TokenService from "./tokenService.js";
import UrlUtils from "../utils/urlUtils.js";

const client = new MailtrapClient({ token: process.env.MAILTRAP_TOKEN });

const sender = { name: process.env.APP_NAME, email: process.env.MAIL_SENDER };

class EmailService {
    async sendVerificationEmail({ user, query }) {
        try {
            const token = TokenService.createEmailVerificationToken({ sub: user.id });
            let verifyUrl = UrlUtils.buildUrlWithQuery(`${process.env.AUTH_URL}/verification/email`, { token });
            verifyUrl = UrlUtils.buildUrlWithQuery(verifyUrl, query);
            const sendResult = await client.send({
                from: sender,
                to: [{ email: user.email }],
                subject: "Verifica tu cuenta",
                html: `
                    <h2>Hola ${user.username},</h2>
                    <p>
                    ¡Gracias por registrarte en <strong>${process.env.APP_NAME}</strong>!  
                    Antes de comenzar a usar tu cuenta, necesitamos confirmar que esta dirección de correo electrónico te pertenece.
                    </p>

                    <p>
                    Por favor, haz clic en el siguiente botón para activar tu cuenta:
                    </p>

                    <p>
                    <a href="${verifyUrl}" style="
                        background: #007bff;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 6px;
                        text-decoration: none;
                        font-weight: bold;
                        display: inline-block;
                    ">
                        Verificar mi cuenta
                    </a>
                    </p>

                    <p>
                    Si no creaste una cuenta en <strong>${process.env.APP_NAME}</strong>, simplemente ignora este mensaje.
                    </p>

                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">

                    <p style="font-size:12px;color:#777;">
                    Este correo fue enviado automáticamente por <strong>${process.env.APP_NAME}</strong>.  
                    No respondas a este mensaje.  
                    </p>
                    `
            })
            console.log(JSON.stringify(sendResult))
            return sendResult.success;
        } catch (error) {
            console.error(error)
            return false;
        }
    }

    async sendRecoverPasswordEmail({ user, query }) {
        try {
            const token = await TokenService.createPasswordResetToken({ sub: user.id });
            let verifyUrl = UrlUtils.buildUrlWithQuery(`${process.env.AUTH_URL}/verification/password/recovery`, { token });
            verifyUrl = UrlUtils.buildUrlWithQuery(verifyUrl, query);
            const sendResult = await client.send({
                from: sender,
                to: [{ email: user.email }],
                subject: "Verifica tu cuenta",
                html: `
                    <h2>Hola ${user.username},</h2>

                    <p>
                        Recibimos una solicitud para restablecer la contraseña de tu cuenta en 
                        <strong>${process.env.APP_NAME}</strong>.
                    </p>

                    <p>
                        Si realizaste esta solicitud, hacé clic en el siguiente botón para crear una nueva contraseña:
                    </p>

                    <p>
                        <a href="${verifyUrl}" style="
                        background: #007bff;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 6px;
                        text-decoration: none;
                        font-weight: bold;
                        display: inline-block;
                        ">
                        Restablecer contraseña
                        </a>
                    </p>

                    <p>
                        Si no solicitaste restablecer tu contraseña, podés ignorar este correo. 
                        Tu cuenta permanecerá segura.
                    </p>

                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">

                    <p style="font-size:12px;color:#777;">
                        Este correo fue enviado automáticamente por <strong>${process.env.APP_NAME}</strong>.<br>
                        No respondas a este mensaje.
                    </p>
                    `
            })
            console.log(JSON.stringify(sendResult))
            return sendResult.success;
        } catch (error) {
            console.error(error)
            return false;
        }
    }
}

export default new EmailService();