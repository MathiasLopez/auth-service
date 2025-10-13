import express from 'express';
import { login, checkSsoToken } from '../controllers/apiAuthController.js';
import { users } from '../controllers/apiUserController.js';

const router = express.Router();

router.post('/login', login);
router.get('/users', users);
router.get('/check-sso-token', checkSsoToken);

export default router;
