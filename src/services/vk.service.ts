import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import {
  VkPostRequest,
  VkUploadPhotoOptions,
  VkUploadPhotoResponse,
  VkSavePhotoResponse,
  VkApiResponse,
  ApiResponse
} from '../types';

const VK_API_VERSION = '5.199';
const DEFAULT_API_URL = 'https://api.vk.com/method';

type UploadPhotoParams = VkUploadPhotoOptions & {
  photoBuffer: Buffer;
  filename: string;
  contentType?: string;
};

/**
 * VK API service
 */
export class VkService {
  private get apiUrl(): string {
    return process.env.VK_API_BASE || DEFAULT_API_URL;
  }

  private resolveAccessToken(token?: string): string {
    return typeof token === 'string' ? token.trim() : '';
  }

  async createPost(data: VkPostRequest): Promise<ApiResponse> {
    try {
      const accessToken = this.resolveAccessToken(data.access_token);
      if (!accessToken) {
        return {
          success: false,
          error: {
            code: 401,
            message: 'VK access token is required'
          }
        };
      }

      const ownerId = Number(data.owner_id);
      if (Number.isNaN(ownerId)) {
        return {
          success: false,
          error: {
            code: 400,
            message: 'owner_id must be a number'
          }
        };
      }

      const attachments = Array.isArray(data.attachments)
        ? data.attachments.join(',')
        : data.attachments;

      const fromGroup =
        typeof data.from_group === 'number'
          ? data.from_group
          : ownerId < 0
          ? 1
          : 0;

      const payload: Record<string, string> = {
        owner_id: ownerId.toString(),
        from_group: fromGroup.toString(),
        v: VK_API_VERSION,
        access_token: accessToken
      };

      if (data.message) {
        payload.message = data.message;
      }

      if (attachments) {
        payload.attachments = attachments;
      }

      if (typeof data.signed === 'number') {
        payload.signed = data.signed.toString();
      }

      const params = new URLSearchParams(payload);

      const response: AxiosResponse<VkApiResponse> = await axios.post(
        `${this.apiUrl}/wall.post`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.data.error) {
        return {
          success: false,
          error: this.transformVkError(response.data.error)
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

  async uploadPhoto({
    photoBuffer,
    filename,
    contentType,
    access_token,
    owner_id
  }: UploadPhotoParams): Promise<ApiResponse> {
    try {
      const accessToken = this.resolveAccessToken(access_token);
      if (!accessToken) {
        return {
          success: false,
          error: {
            code: 401,
            message: 'VK access token is required'
          }
        };
      }

      const ownerId = Number(owner_id);
      if (Number.isNaN(ownerId)) {
        return {
          success: false,
          error: {
            code: 400,
            message: 'owner_id must be a number'
          }
        };
      }

      const isGroup = ownerId < 0;
      const normalizedGroupId = Math.abs(ownerId);

      const serverParams: Record<string, any> = {
        v: VK_API_VERSION,
        access_token: accessToken
      };

      if (isGroup) {
        serverParams.group_id = normalizedGroupId;
      } else {
        serverParams.user_id = ownerId;
      }

      const uploadUrlResponse: AxiosResponse<VkApiResponse> = await axios.get(
        `${this.apiUrl}/photos.getWallUploadServer`,
        {
          params: serverParams
        }
      );

      if (uploadUrlResponse.data.error) {
        return {
          success: false,
          error: this.transformVkError(uploadUrlResponse.data.error)
        };
      }

      const uploadUrl = uploadUrlResponse.data.response.upload_url;

      const formData = new FormData();
      formData.append('photo', photoBuffer, {
        filename,
        contentType: contentType || 'application/octet-stream'
      });

      const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: formData.getHeaders()
      });

      const uploadData: VkUploadPhotoResponse = uploadResponse.data;

      const savePayload: Record<string, any> = {
        photo: uploadData.photo,
        server: uploadData.server,
        hash: uploadData.hash,
        v: VK_API_VERSION,
        access_token: accessToken
      };

      if (isGroup) {
        savePayload.group_id = normalizedGroupId;
      } else {
        savePayload.user_id = ownerId;
      }

      const saveParams = new URLSearchParams();
      Object.entries(savePayload).forEach(([key, value]) => {
        saveParams.append(key, String(value));
      });

      const saveResponse: AxiosResponse<VkApiResponse> = await axios.post(
        `${this.apiUrl}/photos.saveWallPhoto`,
        saveParams.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (saveResponse.data.error) {
        return {
          success: false,
          error: this.transformVkError(saveResponse.data.error)
        };
      }

      const savedPhotos: VkSavePhotoResponse[] = saveResponse.data.response;

      if (!Array.isArray(savedPhotos) || savedPhotos.length === 0) {
        return {
          success: false,
          error: {
            code: 500,
            message: 'Failed to save photo in VK'
          }
        };
      }

      const photo = savedPhotos[0];

      return {
        success: true,
        data: {
          id: photo.id,
          owner_id: photo.owner_id,
          attachment: `photo${photo.owner_id}_${photo.id}`
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
      const vkError = error.response.data?.error;
      if (vkError) {
        return {
          success: false,
          error: this.transformVkError(vkError)
        };
      }

      return {
        success: false,
        error: {
          code: error.response.status,
          message: 'VK API error'
        }
      };
    } else if (error.request) {
      return {
        success: false,
        error: {
          code: 503,
          message: 'No response from VK API'
        }
      };
    }

    return {
      success: false,
      error: {
        code: 500,
        message: error.message || 'Failed to send request to VK API'
      }
    };
  }

  private transformVkError(vkError: VkApiResponse['error']): { code: number; message: string } {
    const code = vkError?.error_code ?? 500;
    let message = vkError?.error_msg || 'VK API error';

    if (code === 15) {
      message = 'VK API access denied. Ensure the token has permissions wall, photos, groups and that the user can post to this wall.';
    } else if (code === 214) {
      message = 'VK API rejected the request: posting to this wall is restricted or comments are disabled.';
    }

    return { code, message };
  }
}
