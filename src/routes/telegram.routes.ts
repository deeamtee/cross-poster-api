import express from 'express';
import {
  sendMessage,
  sendPhoto,
  sendMediaGroup,
  validateSendMessage,
  validateSendPhoto,
  validateSendMediaGroup
} from '../controllers/telegram.controller';

const router = express.Router();
/**
 * POST /api/telegram/sendMessage
 * Send a text message to Telegram
 */
router.post('/sendMessage', validateSendMessage, sendMessage);

/**
 * POST /api/telegram/sendPhoto
 * Send a photo to Telegram
 */
router.post('/sendPhoto', validateSendPhoto, sendPhoto);

/**
 * POST /api/telegram/sendMediaGroup
 * Send a media group to Telegram
 */
router.post('/sendMediaGroup', validateSendMediaGroup, sendMediaGroup);

export default router;