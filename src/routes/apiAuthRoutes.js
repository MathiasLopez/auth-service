import express from 'express';
import { login, register, checkSsoToken, refresh, logout, logoutAll, resendVerificationEmail } from '../controllers/apiAuthController.js';
import { users } from '../controllers/apiUserController.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout/all', logoutAll);
router.post('/verification/email/resend', resendVerificationEmail);
router.get('/users', users);
router.get('/check-sso-token', checkSsoToken);

export default router;
