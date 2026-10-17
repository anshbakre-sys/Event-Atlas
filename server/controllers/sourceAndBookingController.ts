import { Response } from 'express';
import { EventService } from '../services/eventService.ts';
import { BookingService } from '../services/bookingService.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export class SourceController {
  public static async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const statuses = await EventService.getSourceStatuses();
      res.status(200).json({ sources: statuses });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve source statuses.' });
    }
  }
}

export class BookingController {
  public static async getHandoff(req: AuthenticatedRequest, res: Response) {
    try {
      const { eventId } = req.params;
      const handoff = await BookingService.prepareHandoff(eventId, req.user);
      res.status(200).json(handoff);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to prepare booking handoff.';
      res.status(404).json({ error: msg });
    }
  }
}
