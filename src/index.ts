import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import telegramRoutes from './routes/telegram.routes';
import vkRoutes from './routes/vk.routes';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import configRoutes from './routes/config.routes';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import { connectMongo, disconnectMongo } from './database/mongo';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Public routes
app.use('/api/auth', authRoutes);

// Authentication middleware
app.use(authenticateToken);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/config', configRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/vk', vkRoutes);

// Error handling middleware
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectMongo();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

const gracefulShutdown = async () => {
  await disconnectMongo();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default app;
