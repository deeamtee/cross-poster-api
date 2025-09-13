import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import {
  VkPostRequest,
  VkUploadPhotoResponse,
  VkSavePhotoResponse,
  VkApiResponse,
  ApiResponse
} from '../types';

const VK_API_BASE = 'https://api.vk.com/method';
const VK_API_VERSION = '5.199';

/**
 * VK API service
 */
export class VkService {
  private readonly groupToken: string;
  private readonly groupId: string;
  private readonly apiUrl: string;

  constructor() {
    this.groupToken = process.env.VK_GROUP_TOKEN || '';
    this.groupId = process.env.VK_GROUP_ID || '';
    this.apiUrl = VK_API_BASE;
  }

  /**
   * Create a post in VK group
   */
  async createPost(data: VkPostRequest): Promise<ApiResponse> {
    try {
      // Set default values
      const postData = {
        ...data,
        owner_id: -Math.abs(parseInt(this.groupId)),
        from_group: 1,
        v: VK_API_VERSION,
        access_token: this.groupToken
      };

      const response: AxiosResponse<VkApiResponse> = await axios.post(
        `${this.apiUrl}/wall.post`,
        postData
      );

      if (response.data.error) {
        return {
          success: false,
          error: {
            code: response.data.error.error_code,
            message: response.data.error.error_msg
          }
        };
      }

      return {
        success: true,
        data: response.data.response
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Upload a photo to VK
   */
  async uploadPhoto(photoBuffer: Buffer, filename: string): Promise<ApiResponse> {
    try {
      // Step 1: Get upload URL
      const uploadUrlResponse: AxiosResponse<VkApiResponse> = await axios.get(
        `${this.apiUrl}/photos.getWallUploadServer`,
        {
          params: {
            group_id: this.groupId,
            v: VK_API_VERSION,
            access_token: this.groupToken
          }
        }
      );

      if (uploadUrlResponse.data.error) {
        return {
          success: false,
          error: {
            code: uploadUrlResponse.data.error.error_code,
            message: uploadUrlResponse.data.error.error_msg
          }
        };
      }

      const uploadUrl = uploadUrlResponse.data.response.upload_url;

      // Step 2: Upload photo to VK server
      const formData = new FormData();
      formData.append('photo', photoBuffer, {
        filename: filename,
        contentType: 'image/jpeg'
      });

      const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: formData.getHeaders()
      });

      const uploadData: VkUploadPhotoResponse = uploadResponse.data;

      // Step 3: Save photo to VK
      const saveResponse: AxiosResponse<VkApiResponse> = await axios.post(
        `${this.apiUrl}/photos.saveWallPhoto`,
        {
          group_id: this.groupId,
          photo: uploadData.photo,
          server: uploadData.server,
          hash: uploadData.hash,
          v: VK_API_VERSION,
          access_token: this.groupToken
        }
      );

      if (saveResponse.data.error) {
        return {
          success: false,
          error: {
            code: saveResponse.data.error.error_code,
            message: saveResponse.data.error.error_msg
          }
        };
      }

      const savedPhotos: VkSavePhotoResponse[] = saveResponse.data.response;

      return {
        success: true,
        data: {
          id: savedPhotos[0].id,
          owner_id: savedPhotos[0].owner_id,
          attachment: `photo${savedPhotos[0].owner_id}_${savedPhotos[0].id}`
        }
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): ApiResponse {
    console.error('VK API Error:', error.response?.data || error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      return {
        success: false,
        error: {
          code: error.response.status,
          message: error.response.data?.error?.error_msg || 'VK API error'
        }
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        success: false,
        error: {
          code: 503,
          message: 'No response from VK API'
        }
      };
    } else {
      // Something happened in setting up the request
      return {
        success: false,
        error: {
          code: 500,
          message: error.message || 'Failed to send request to VK API'
        }
      };
    }
  }
}