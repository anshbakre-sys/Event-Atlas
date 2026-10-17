import { Response } from 'express';
import { AuthService } from '../services/authService.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export class UserController {
  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.status(200).json({ user: req.user });
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const { name, dateOfBirth, phone, preferredCity, preferences } = req.body;
      const updatedUser = await AuthService.updateProfile(req.user.id, {
        name,
        dateOfBirth,
        phone,
        preferredCity,
        preferences,
      });

      res.status(200).json({ user: updatedUser });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      res.status(400).json({ error: msg });
    }
  }
}
