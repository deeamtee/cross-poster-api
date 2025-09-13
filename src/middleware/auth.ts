import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to authenticate API requests using API key
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  // Skip authentication for health check endpoint
  if (req.path === '/api/health' || req.path === '/api/health/') {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: 401,
        message: 'API key is required'
      }
    });
  }

  if (!expectedApiKey || apiKey !== expectedApiKey) {
    return res.status(403).json({
      success: false,
      error: {
        code: 403,
        message: 'Invalid API key'
      }
    });
  }

  next();
};