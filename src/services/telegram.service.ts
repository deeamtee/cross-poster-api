import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import type { Express } from 'express';
import {
  TelegramSendMessageRequest,
  TelegramSendPhotoRequest,
  TelegramSendMediaGroupRequest,
  TelegramResponse,
  ApiResponse
} from '../types';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

export class TelegramService {
  private get botToken(): string {
    return process.env.TELEGRAM_BOT_TOKEN || '';
  }
  
  private get apiUrl(): string {
    return `${TELEGRAM_API_BASE}${this.botToken}`;
  }

  async sendMessage(data: TelegramSendMessageRequest): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<TelegramResponse> = await axios.post(
        `${this.apiUrl}/sendMessage`,
        data
      );

      return {
        success: response.data.ok,
        data: response.data.result,
        error: response.data.ok ? undefined : {
          code: response.data.error_code || 500,
          message: response.data.description || 'Telegram API error'
        }
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async sendPhoto(data: TelegramSendPhotoRequest): Promise<ApiResponse> {
    try {
      let response: AxiosResponse<TelegramResponse>;
      
      // Check if we're dealing with a file buffer (uploaded file)
      // Using 'Buffer.isBuffer' instead of 'instanceof Buffer' for better compatibility
      if (Buffer.isBuffer(data.photo)) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('chat_id', data.chat_id.toString());
        formData.append('photo', data.photo, {
          filename: 'photo.jpg',
          contentType: 'image/jpeg'
        });
        
        if (data.caption) {
          formData.append('caption', data.caption);
        }
        
        if (data.parse_mode) {
          formData.append('parse_mode', data.parse_mode);
        }

        response = await axios.post(
          `${this.apiUrl}/sendPhoto`,
          formData,
          {
            headers: {
              ...formData.getHeaders()
            }
          }
        );
      } else {
        // Regular request with URL or file_id
        response = await axios.post(
          `${this.apiUrl}/sendPhoto`,
          data
        );
      }

      return {
        success: response.data.ok,
        data: response.data.result,
        error: response.data.ok ? undefined : {
          code: response.data.error_code || 500,
          message: response.data.description || 'Telegram API error'
        }
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async sendMediaGroup(
    data: TelegramSendMediaGroupRequest,
    files: Express.Multer.File[] = []
  ): Promise<ApiResponse> {
    try {
      let response: AxiosResponse<TelegramResponse>;

      if (files.length > 0) {
        const formData = new FormData();
        formData.append('chat_id', data.chat_id.toString());
        formData.append('media', JSON.stringify(data.media));

        files.forEach((file) => {
          formData.append(file.fieldname, file.buffer, {
            filename: file.originalname || `${file.fieldname}.jpg`,
            contentType: file.mimetype
          });
        });

        if (typeof data.disable_notification !== 'undefined') {
          formData.append('disable_notification', String(data.disable_notification));
        }
        if (typeof data.reply_to_message_id !== 'undefined') {
          formData.append('reply_to_message_id', String(data.reply_to_message_id));
        }
        if (typeof data.allow_sending_without_reply !== 'undefined') {
          formData.append('allow_sending_without_reply', String(data.allow_sending_without_reply));
        }

        response = await axios.post(
          `${this.apiUrl}/sendMediaGroup`,
          formData,
          {
            headers: {
              ...formData.getHeaders()
            }
          }
        );
      } else {
        response = await axios.post(
          `${this.apiUrl}/sendMediaGroup`,
          data
        );
      }

      return {
        success: response.data.ok,
        data: response.data.result,
        error: response.data.ok ? undefined : {
          code: response.data.error_code || 500,
          message: response.data.description || 'Telegram API error'
        }
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse {
    console.error('Telegram API Error:', error.response?.data || error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      return {
        success: false,
        error: {
          code: error.response.status,
          message: error.response.data?.description || 'Telegram API error'
        }
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        success: false,
        error: {
          code: 503,
          message: 'No response from Telegram API'
        }
      };
    } else {
      return {
        success: false,
        error: {
          code: 500,
          message: error.message || 'Failed to send request to Telegram API'
        }
      };
    }
  }
}
