import express from 'express';
import { renderLogin, login, renderRegister, register, verificationEmailController, resendVerificationEmailController, handlerResendVerificationEmailController } from '../controllers/webAuthController.js';
import { getForgotPasswordController, postForgotPasswordController, getResetPasswordController, postResetPasswordController } from '../controllers/webAuthController.js';

const router = express.Router();

router.get('/login', renderLogin);
router.post('/login', login);
router.get('/register', renderRegister);
router.post('/register', register);
router.get('/verification/email', verificationEmailController)
router.get('/verification/email/resend', resendVerificationEmailController)
router.post('/verification/email/resend', handlerResendVerificationEmailController)
router.get('/forgot-password', getForgotPasswordController)
router.post('/forgot-password', postForgotPasswordController)
router.get('/reset-password', getResetPasswordController)
router.post('/reset-password', postResetPasswordController)


export default router;