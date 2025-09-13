import express from 'express';
import {
  createPost,
  uploadPhoto,
  validatePost,
  upload
} from '../controllers/vk.controller';

const router = express.Router();

/**
 * POST /api/vk/post
 * Create a post in VK
 */
router.post('/post', validatePost, createPost);

/**
 * POST /api/vk/uploadPhoto
 * Upload a photo to VK
 */
router.post('/uploadPhoto', upload.single('photo'), uploadPhoto);

export default router;