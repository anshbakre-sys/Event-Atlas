import { Router } from 'express';
import { EventController } from '../controllers/eventController.ts';
import { BookingController } from '../controllers/sourceAndBookingController.ts';
import { optionalAuth } from '../middleware/authMiddleware.ts';

const router = Router();

router.get('/', optionalAuth, EventController.getEvents);
router.get('/nearby', optionalAuth, EventController.getNearby);
router.post('/sync', optionalAuth, EventController.syncSources);
router.get('/:eventId', optionalAuth, EventController.getEventById);
router.post('/:eventId/handoff', optionalAuth, BookingController.getHandoff);

export default router;
