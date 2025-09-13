import axios, { AxiosResponse } from 'axios';
import {
  TelegramSendMessageRequest,
  TelegramSendPhotoRequest,
  TelegramSendMediaGroupRequest,
  TelegramResponse,
  ApiResponse
} from '../types';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/**
 * Telegram API service
 */
export class TelegramService {
  private readonly botToken: string;
  private readonly apiUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.apiUrl = `${TELEGRAM_API_BASE}${this.botToken}`;
  }

  /**
   * Send a text message
   */
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

  /**
   * Send a photo
   */
  async sendPhoto(data: TelegramSendPhotoRequest): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<TelegramResponse> = await axios.post(
        `${this.apiUrl}/sendPhoto`,
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

  /**
   * Send a media group
   */
  async sendMediaGroup(data: TelegramSendMediaGroupRequest): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<TelegramResponse> = await axios.post(
        `${this.apiUrl}/sendMediaGroup`,
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

  /**
   * Handle API errors
   */
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
      // Something happened in setting up the request
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