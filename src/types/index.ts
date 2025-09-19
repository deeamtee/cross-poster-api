// Telegram Types
export interface TelegramSendMessageRequest {
  chat_id: string | number;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_to_message_id?: number;
  allow_sending_without_reply?: boolean;
}

export interface TelegramSendPhotoRequest {
  chat_id: string | number;
  photo: string;
  caption?: string;
  parse_mode?: 'Markdown' | 'HTML';
  disable_notification?: boolean;
  reply_to_message_id?: number;
  allow_sending_without_reply?: boolean;
}

export interface TelegramSendMediaGroupRequest {
  chat_id: string | number;
  media: Array<{
    type: 'photo' | 'video' | 'audio' | 'document';
    media: string;
    caption?: string;
    parse_mode?: 'Markdown' | 'HTML';
    has_spoiler?: boolean;
    disable_content_type_detection?: boolean;
  }>;
  disable_notification?: boolean;
  reply_to_message_id?: number;
  allow_sending_without_reply?: boolean;
}

export interface TelegramResponse {
  ok: boolean;
  result?: any;
  error_code?: number;
  description?: string;
}

// VK Types
export interface VkPostRequest {
  access_token: string;
  owner_id: string | number;
  message?: string;
  attachments?: string | string[];
  from_group?: 0 | 1;
  signed?: 0 | 1;
}

export interface VkUploadPhotoOptions {
  access_token: string;
  owner_id: string | number;
}

export interface VkUploadPhotoResponse {
  server: number;
  photo: string;
  hash: string;
}

export interface VkSavePhotoResponse {
  id: number;
  owner_id: number;
  album_id: number;
  sizes: Array<{
    type: string;
    url: string;
    width: number;
    height: number;
  }>;
}

export interface VkApiResponse {
  response?: any;
  error?: {
    error_code: number;
    error_msg: string;
    request_params: Array<{
      key: string;
      value: string;
    }>;
  };
}

// Common Types
export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: number;
    message: string;
  };
}
