import { Response } from 'express';
import { EventService } from '../services/eventService.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { EventFilterCriteria } from '../utils/eventFilter.ts';

export class EventController {
  public static async getEvents(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        search,
        platforms,
        categories,
        cities,
        priceType,
        minPrice,
        maxPrice,
        budget,
        startDate,
        endDate,
        userLat,
        userLng,
        sortBy,
      } = req.query;

      // Parse arrays safely
      const parseArray = (val: unknown): string[] | undefined => {
        if (!val) return undefined;
        if (Array.isArray(val)) return val.map(String);
        return String(val)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      };

      const criteria: EventFilterCriteria = {
        searchQuery: search ? String(search) : undefined,
        platforms: parseArray(platforms),
        categories: parseArray(categories),
        cities: parseArray(cities),
        priceType: priceType === 'free' || priceType === 'paid' ? priceType : 'all',
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        budget: budget ? Number(budget) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        userAge: req.user?.userAge ?? null, // Backend age enforcement!
        userLat: userLat ? Number(userLat) : undefined,
        userLng: userLng ? Number(userLng) : undefined,
        sortBy: sortBy === 'distance' ? 'distance' : 'date',
      };

      const result = await EventService.getEvents(criteria);
      res.status(200).json(result);
    } catch (err: unknown) {
      console.error('Error fetching events:', err);
      res.status(500).json({ error: 'Failed to retrieve events.' });
    }
  }

  public static async getEventById(req: AuthenticatedRequest, res: Response) {
    try {
      const { eventId } = req.params;
      const userLat = req.query.userLat ? Number(req.query.userLat) : undefined;
      const userLng = req.query.userLng ? Number(req.query.userLng) : undefined;

      const event = await EventService.getEventById(
        eventId,
        req.user?.userAge ?? null,
        userLat,
        userLng
      );

      if (!event) {
        res.status(404).json({
          error:
            'Event not found or you are not eligible to view this age-restricted event.',
        });
        return;
      }

      res.status(200).json({ event });
    } catch (err: unknown) {
      res.status(500).json({ error: 'Failed to retrieve event details.' });
    }
  }

  public static async getNearby(req: AuthenticatedRequest, res: Response) {
    try {
      const lat = Number(req.query.lat);
      const lng = Number(req.query.lng);

      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({ error: 'Valid lat and lng query parameters required.' });
        return;
      }

      const result = await EventService.getEvents({
        userLat: lat,
        userLng: lng,
        sortBy: 'distance',
        userAge: req.user?.userAge ?? null,
      });

      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve nearby events.' });
    }
  }

  public static async syncSources(req: AuthenticatedRequest, res: Response) {
    try {
      const results = await EventService.syncAllSources();
      res.status(200).json({ success: true, results });
    } catch (err) {
      res.status(500).json({ error: 'Source synchronization failed.' });
    }
  }
}
