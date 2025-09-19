import express from 'express';
import {
  sendMessage,
  sendPhoto,
  sendMediaGroup,
  validateSendMessage,
  validateSendPhoto,
  validateSendMediaGroup,
  upload
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
router.post('/sendPhoto', upload.single('photo'), sendPhoto);

/**
 * POST /api/telegram/sendMediaGroup
 * Send a media group to Telegram
 */
router.post('/sendMediaGroup', upload.any(), validateSendMediaGroup, sendMediaGroup);

export default router;
