import { MailtrapClient } from "mailtrap"
import jwt from 'jsonwebtoken';

const client = new MailtrapClient({ token: process.env.MAILTRAP_TOKEN });

const sender = { name: process.env.APP_NAME, email: process.env.MAIL_SENDER };

class EmailService {
    async sendVerificationEmail({ user }) {
        try {
            const token = generateToken(user);
            const verifyUrl = `${process.env.AUTH_URL}/verify?token=${token}`;
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
}

function generateToken(user) {
    return jwt.sign({ sub: user.id }, process.env.JWT_EMAIL_SECRET, { expiresIn: process.env.JWT_EMAIL_VERIFY_EXPIRATION, algorithm: process.env.JWT_ALGORITHM });
}

function decodeToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_EMAIL_SECRET, { algorithms: [process.env.JWT_ALGORITHM] });
    } catch (err) {
        //TODO: Improve, return if the token has expired or the type of error.
        console.error(err)
        return null;
    }
}

export default new EmailService();