import express from 'express';
import { login, checkSsoToken } from '../controllers/apiAuthController.js';

const router = express.Router();

router.post('/login', login);
router.get('/check-sso-token', checkSsoToken);

export default router;
