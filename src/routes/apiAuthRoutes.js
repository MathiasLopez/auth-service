import express from 'express';
import { login, checkSsoToken, refresh, logout, logoutAll } from '../controllers/apiAuthController.js';
import { users } from '../controllers/apiUserController.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout/all', logoutAll);
router.get('/users', users);
router.get('/check-sso-token', checkSsoToken);

export default router;
