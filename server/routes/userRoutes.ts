import { Router } from 'express';
import { UserController } from '../controllers/userController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';

const router = Router();

router.get('/me', requireAuth, UserController.getProfile);
router.patch('/me', requireAuth, UserController.updateProfile);

export default router;
