import { Router } from 'express';
import { register, login, getMe, activateAccount, activateWithOTP } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/activate/:token', activateAccount);
router.post('/activate-otp', activateWithOTP);

export default router;
