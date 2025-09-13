import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { TelegramService } from '../services/telegram.service';
import { ApiError } from '../middleware/errorHandler';
import { TelegramSendMessageRequest, TelegramSendPhotoRequest, TelegramSendMediaGroupRequest } from '../types';

const telegramService = new TelegramService();

/**
 * Validate Telegram sendMessage request
 */
export const validateSendMessage = [
  body('chat_id').notEmpty().withMessage('Chat ID is required'),
  body('text').notEmpty().withMessage('Text is required')
];

/**
 * Validate Telegram sendPhoto request
 */
export const validateSendPhoto = [
  body('chat_id').notEmpty().withMessage('Chat ID is required'),
  body('photo').notEmpty().withMessage('Photo is required')
];

/**
 * Validate Telegram sendMediaGroup request
 */
export const validateSendMediaGroup = [
  body('chat_id').notEmpty().withMessage('Chat ID is required'),
  body('media').isArray({ min: 2 }).withMessage('Media must be an array with at least 2 items')
];

/**
 * Send a text message to Telegram
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed: ' + JSON.stringify(errors.array()));
    }

    const data: TelegramSendMessageRequest = req.body;
    const result = await telegramService.sendMessage(data);

    if (!result.success) {
      throw new ApiError(result.error?.code || 500, result.error?.message || 'Failed to send message');
    }

    res.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Internal server error');
  }
};

/**
 * Send a photo to Telegram
 */
export const sendPhoto = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed: ' + JSON.stringify(errors.array()));
    }

    const data: TelegramSendPhotoRequest = req.body;
    const result = await telegramService.sendPhoto(data);

    if (!result.success) {
      throw new ApiError(result.error?.code || 500, result.error?.message || 'Failed to send photo');
    }

    res.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Internal server error');
  }
};

/**
 * Send a media group to Telegram
 */
export const sendMediaGroup = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed: ' + JSON.stringify(errors.array()));
    }

    const data: TelegramSendMediaGroupRequest = req.body;
    const result = await telegramService.sendMediaGroup(data);

    if (!result.success) {
      throw new ApiError(result.error?.code || 500, result.error?.message || 'Failed to send media group');
    }

    res.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Internal server error');
  }
};