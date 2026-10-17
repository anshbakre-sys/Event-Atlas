import { Response } from 'express';
import { GeminiService } from '../services/geminiService.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export class AssistantController {
  public static async search(req: AuthenticatedRequest, res: Response) {
    try {
      const { prompt, userLat, userLng, currentCity } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        res.status(400).json({ error: 'A query prompt is required.' });
        return;
      }

      const result = await GeminiService.searchEventsWithAI(prompt.trim(), {
        userAge: req.user?.userAge ?? null,
        userLat: typeof userLat === 'number' ? userLat : undefined,
        userLng: typeof userLng === 'number' ? userLng : undefined,
        currentCity: currentCity || req.user?.preferredCity,
      });

      res.status(200).json(result);
    } catch (err: unknown) {
      console.error('Assistant search error:', err);
      res.status(500).json({
        error: 'Failed to process AI event search. Please try rephrasing your query.',
      });
    }
  }
}
