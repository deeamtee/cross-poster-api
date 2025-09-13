import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { VkService } from '../services/vk.service';
import { ApiError } from '../middleware/errorHandler';
import { VkPostRequest } from '../types';

const vkService = new VkService();

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * Validate VK post request
 */
export const validatePost = [
  body('message').optional().isString().withMessage('Message must be a string')
];

/**
 * Create a post in VK
 */
export const createPost = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed: ' + JSON.stringify(errors.array()));
    }

    const data: VkPostRequest = req.body;
    const result = await vkService.createPost(data);

    if (!result.success) {
      throw new ApiError(result.error?.code || 500, result.error?.message || 'Failed to create post');
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
 * Upload a photo to VK
 */
export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

    const result = await vkService.uploadPhoto(req.file.buffer, req.file.originalname);

    if (!result.success) {
      throw new ApiError(result.error?.code || 500, result.error?.message || 'Failed to upload photo');
    }

    res.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Internal server error');
  }
};