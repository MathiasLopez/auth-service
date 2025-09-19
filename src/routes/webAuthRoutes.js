import express from 'express';
import { renderLogin, login } from '../controllers/webAuthController.js';

const router = express.Router();

router.get('/login', renderLogin);
router.post('/login', login);

export default router;