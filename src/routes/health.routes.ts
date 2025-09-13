import express from 'express';
import { ApiError } from '../middleware/errorHandler';

const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

export default router;