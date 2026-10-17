import { Request, Response, NextFunction } from 'express';
import { AuthService, SafeUser } from '../services/authService.ts';

export interface AuthenticatedRequest extends Request {
  user?: SafeUser | null;
}

export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.event_atlas_token ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

    if (token) {
      const session = AuthService.verifyToken(token);
      if (session) {
        const user = await AuthService.getUserById(session.userId);
        req.user = user;
      }
    }
  } catch (err) {
    // optional auth failure does not abort request
    req.user = null;
  }
  next();
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.event_atlas_token ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    const session = AuthService.verifyToken(token);
    if (!session) {
      res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
      return;
    }

    const user = await AuthService.getUserById(session.userId);
    if (!user) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Authentication processing failed.' });
  }
}
