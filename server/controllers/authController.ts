import { Response } from 'express';
import { AuthService } from '../services/authService.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export class AuthController {
  public static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, password, dateOfBirth, phone, preferredCity } = req.body;
      const result = await AuthService.register({
        name,
        email,
        password,
        dateOfBirth,
        phone,
        preferredCity,
      });

      // Set HTTP-only cookie for secure session
      res.cookie('event_atlas_token', result.token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      res.status(400).json({ error: message });
    }
  }

  public static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      res.cookie('event_atlas_token', result.token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials.';
      res.status(401).json({ error: message });
    }
  }

  public static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const token =
        req.cookies?.event_atlas_token ||
        (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

      if (token) {
        AuthService.revokeToken(token);
      }

      res.clearCookie('event_atlas_token');
      res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Logout failed.' });
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      res.status(200).json({ authenticated: false, user: null });
      return;
    }
    res.status(200).json({ authenticated: true, user: req.user });
  }
}
