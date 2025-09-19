import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { TelegramService } from '../services/telegram.service';
import { ApiError } from '../middleware/errorHandler';
import { TelegramSendMessageRequest, TelegramSendPhotoRequest, TelegramSendMediaGroupRequest } from '../types';

const telegramService = new TelegramService();

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

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
  body('chat_id').notEmpty().withMessage('Chat ID is required')
  // Note: We're removing the photo validation because it might be a file upload
];

/**
 * Validate Telegram sendMediaGroup request
 */
export const validateSendMediaGroup = [
  body('chat_id').notEmpty().withMessage('Chat ID is required'),
  body('media')
    .custom((value, { req }) => {
      let mediaValue = value;

      if (typeof mediaValue === 'string') {
        try {
          mediaValue = JSON.parse(mediaValue);
          req.body.media = mediaValue;
        } catch (error) {
          throw new Error('Media must be a valid JSON array');
        }
      }

      if (!Array.isArray(mediaValue) || mediaValue.length < 2) {
        throw new Error('Media must be an array with at least 2 items');
      }

      return true;
    })
];

/**
 * Send a text message to Telegram
 */
export const sendMessage = async (req: Request, res: Response) => {
    console.log(req.body);
    
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
    // For file uploads, we need to handle validation differently
    // Check if required fields are present
    if (!req.body.chat_id) {
      throw new ApiError(400, 'Validation failed: Chat ID is required');
    }

    // If we have a file upload, we need to create FormData for Telegram API
    if (req.file) {
      // We need to modify the service to handle FormData
      // For now, let's create a compatible object
      const data: any = {
        chat_id: req.body.chat_id,
        photo: req.file.buffer,
        caption: req.body.caption,
        parse_mode: req.body.parse_mode
      };

      const result = await telegramService.sendPhoto(data);

      if (!result.success) {
        throw new ApiError(result.error?.code || 500, result.error?.message || 'Failed to send photo');
      }

      res.json(result);
    } else if (req.body.photo) {
      // Handle URL or file_id
      const data: TelegramSendPhotoRequest = {
        chat_id: req.body.chat_id,
        photo: req.body.photo,
        caption: req.body.caption,
        parse_mode: req.body.parse_mode
      };

      const result = await telegramService.sendPhoto(data);

      if (!result.success) {
        throw new ApiError(result.error?.code || 500, result.error?.message || 'Failed to send photo');
      }

      res.json(result);
    } else {
      throw new ApiError(400, 'Validation failed: Photo is required');
    }
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

    const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];

    let rawMedia = req.body.media;

    if (typeof rawMedia === 'string') {
      try {
        rawMedia = JSON.parse(rawMedia);
      } catch (error) {
        throw new ApiError(400, 'Validation failed: Media must be a valid JSON array');
      }
    }

    if (!Array.isArray(rawMedia)) {
      throw new ApiError(400, 'Validation failed: Media must be an array with at least 2 items');
    }

    const mediaItems = rawMedia.map((item: any, index: number) => {
      if (typeof item === 'string') {
        try {
          item = JSON.parse(item);
        } catch (error) {
          throw new ApiError(400, `Validation failed: Media item at index ${index} must be a valid JSON object`);
        }
      }

      if (!item || typeof item !== 'object') {
        throw new ApiError(400, `Validation failed: Media item at index ${index} must be an object`);
      }

      if (!item.type || !item.media) {
        throw new ApiError(400, `Validation failed: Media item at index ${index} must include type and media fields`);
      }

      const mediaEntry: TelegramSendMediaGroupRequest['media'][number] = {
        type: item.type,
        media: item.media,
        caption: item.caption,
        parse_mode: item.parse_mode
      };

      if (item.has_spoiler !== undefined) {
        mediaEntry.has_spoiler = item.has_spoiler;
      }

      if (item.disable_content_type_detection !== undefined) {
        mediaEntry.disable_content_type_detection = item.disable_content_type_detection;
      }

      return mediaEntry;
    });

    const replyToMessageId = typeof req.body.reply_to_message_id !== 'undefined'
      ? Number(req.body.reply_to_message_id)
      : undefined;

    const data: TelegramSendMediaGroupRequest = {
      chat_id: req.body.chat_id,
      media: mediaItems,
      disable_notification: typeof req.body.disable_notification !== 'undefined'
        ? req.body.disable_notification === true || req.body.disable_notification === 'true'
        : undefined,
      reply_to_message_id: typeof replyToMessageId === 'number' && !Number.isNaN(replyToMessageId)
        ? replyToMessageId
        : undefined,
      allow_sending_without_reply: typeof req.body.allow_sending_without_reply !== 'undefined'
        ? req.body.allow_sending_without_reply === true || req.body.allow_sending_without_reply === 'true'
        : undefined
    };

    const result = await telegramService.sendMediaGroup(data, files);

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
