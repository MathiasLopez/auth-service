import express from 'express';
import { renderLogin, login, renderRegister, register } from '../controllers/webAuthController.js';

const router = express.Router();

router.get('/login', renderLogin);
router.post('/login', login);
router.get('/register', renderRegister);
router.post('/register', register);

export default router;