import express from 'express';
import { renderLogin, login, renderRegister, register, verificationEmailController, resendVerificationEmailController, handlerResendVerificationEmailController } from '../controllers/webAuthController.js';

const router = express.Router();

router.get('/login', renderLogin);
router.post('/login', login);
router.get('/register', renderRegister);
router.post('/register', register);
router.get('/verification/email', verificationEmailController)
router.get('/verification/email/resend', resendVerificationEmailController)
router.post('/verification/email/resend', handlerResendVerificationEmailController)


export default router;