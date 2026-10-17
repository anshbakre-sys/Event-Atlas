import { Router } from 'express';
import { SourceController } from '../controllers/sourceAndBookingController.ts';
import { optionalAuth } from '../middleware/authMiddleware.ts';

const router = Router();

router.get('/status', optionalAuth, SourceController.getStatus);

export default router;
