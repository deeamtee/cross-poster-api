import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth';

/**
 * Middleware to authenticate API requests using bearer tokens
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/health') || req.path.startsWith('/api/auth')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: { code: 401, message: 'Authorization header missing' } });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, error: { code: 401, message: 'Invalid authorization header format' } });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    console.error('Token verification failed', error);
    return res.status(401).json({ success: false, error: { code: 401, message: 'Invalid or expired token' } });
  }
};
