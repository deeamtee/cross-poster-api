import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { VkService } from '../services/vk.service';
import { ApiError } from '../middleware/errorHandler';
import { VkPostRequest, VkGroupsRequest } from '../types';

const vkService = new VkService();
const mapVkErrorCodeToHttpStatus = (code?: number): number => {
  if (!code) {
    return 500;
  }

  const ACCESS_DENIED_CODES = new Set([15, 214, 219, 220, 221, 222]);
  const TOO_MANY_REQUESTS_CODES = new Set([6, 9]);

  if (code === 5 || code === 17) {
    return 401;
  }

  if (ACCESS_DENIED_CODES.has(code)) {
    return 403;
  }

  if (TOO_MANY_REQUESTS_CODES.has(code)) {
    return 429;
  }

  const normalized = Math.trunc(code);
  if (normalized >= 400 && normalized <= 599) {
    return normalized;
  }

  return 500;
};


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
  body('access_token').notEmpty().withMessage('Access token is required'),
  body('owner_id')
    .notEmpty().withMessage('Owner ID is required')
    .custom(value => {
      const num = Number(value);
      if (Number.isNaN(num)) {
        throw new Error('Owner ID must be a number');
      }
      return true;
    }),
  body('message').optional().isString().withMessage('Message must be a string'),
  body('attachments').optional().custom(value => {
    if (typeof value === 'string') {
      return true;
    }
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      return true;
    }
    throw new Error('Attachments must be a string or an array of strings');
  }),
  body('from_group').optional().isInt({ min: 0, max: 1 }).withMessage('from_group must be 0 or 1'),
  body('signed').optional().isInt({ min: 0, max: 1 }).withMessage('signed must be 0 or 1')
];

export const validateGroupsRequest = [
  body('access_token').notEmpty().withMessage('Access token is required'),
  body('filter').optional().isString(),
  body('fields').optional().isString(),
  body('extended').optional().isInt({ min: 0, max: 1 }),
  body('offset').optional().isInt({ min: 0 }),
  body('count').optional().isInt({ min: 0 })
];

/**
 * Fetch VK communities where the user is an admin
 */
export const getAdminGroups = async (req: Request, res: Response): Promise<Response> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed: ' + JSON.stringify(errors.array()));
    }

    const params = req.body as VkGroupsRequest;
    const result = await vkService.getAdminGroups(params);

    if (!result.success) {
      const status = mapVkErrorCodeToHttpStatus(result.error?.code);
      return res.status(status).json(result);
    }

    return res.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Internal server error');
  }
};

/**
 * Create a post in VK
 */
export const createPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed: ' + JSON.stringify(errors.array()));
    }

    const data = req.body as VkPostRequest;

    if (Array.isArray(data.attachments)) {
      data.attachments = data.attachments.filter(item => typeof item === 'string');
    }

    const result = await vkService.createPost(data);

    if (!result.success) {
      const status = mapVkErrorCodeToHttpStatus(result.error?.code);
      return res.status(status).json(result);
    }

    return res.json(result);
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
export const uploadPhoto = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

    const { access_token, owner_id } = req.body;

    if (!access_token) {
      throw new ApiError(400, 'Access token is required');
    }

    if (!owner_id) {
      throw new ApiError(400, 'Owner ID is required');
    }

    const result = await vkService.uploadPhoto({
      photoBuffer: req.file.buffer,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      access_token,
      owner_id
    });

    if (!result.success) {
      const status = mapVkErrorCodeToHttpStatus(result.error?.code);
      return res.status(status).json(result);
    }

    return res.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Internal server error');
  }
};
