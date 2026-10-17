import { Router } from 'express';
import { AssistantController } from '../controllers/assistantController.ts';
import { optionalAuth } from '../middleware/authMiddleware.ts';

const router = Router();

router.post('/search', optionalAuth, AssistantController.search);

export default router;
