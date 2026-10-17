import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { optionalAuth } from '../middleware/authMiddleware.ts';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', optionalAuth, AuthController.logout);
router.get('/me', optionalAuth, AuthController.me);

export default router;
