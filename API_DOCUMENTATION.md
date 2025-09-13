# Cross-Poster API Documentation

This API provides endpoints for cross-posting content to Telegram and VKontakte (VK) social networks.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints except the health check require authentication using an API key in the header:

```
x-api-key: YOUR_SECRET_API_KEY
```

You can set your API key in the `.env` file using the `API_KEY` variable.

## Rate Limiting

The API implements rate limiting:
- Maximum 100 requests per IP address per 15 minutes

## Common Response Format

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Error description"
  }
}
```

## Endpoints

### Health Check

#### `GET /api/health`

Health check endpoint to verify if the service is running.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2023-10-01T12:00:00.000Z",
    "uptime": 123.456
  }
}
```

### Telegram Endpoints

#### `POST /api/telegram/sendMessage`

Send a text message to a Telegram chat.

**Headers:**
```
Content-Type: application/json
x-api-key: YOUR_SECRET_API_KEY
```

**Request Body:**
```json
{
  "chat_id": "123456789",  // Required: Chat ID or username
  "text": "Hello, world!", // Required: Message text
  "parse_mode": "HTML",    // Optional: "Markdown" or "HTML"
  "disable_web_page_preview": false, // Optional
  "disable_notification": false,     // Optional
  "reply_to_message_id": 123,        // Optional
  "allow_sending_without_reply": true // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Telegram API response
  }
}
```

#### `POST /api/telegram/sendPhoto`

Send a photo to a Telegram chat.

**Headers:**
```
Content-Type: application/json
x-api-key: YOUR_SECRET_API_KEY
```

**Request Body:**
```json
{
  "chat_id": "123456789",  // Required: Chat ID or username
  "photo": "https://example.com/photo.jpg", // Required: Photo URL or file_id
  "caption": "Photo caption", // Optional
  "parse_mode": "HTML",       // Optional: "Markdown" or "HTML"
  "disable_notification": false, // Optional
  "reply_to_message_id": 123,    // Optional
  "allow_sending_without_reply": true // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Telegram API response
  }
}
```

#### `POST /api/telegram/sendMediaGroup`

Send a group of media (photos, videos, etc.) to a Telegram chat.

**Headers:**
```
Content-Type: application/json
x-api-key: YOUR_SECRET_API_KEY
```

**Request Body:**
```json
{
  "chat_id": "123456789",  // Required: Chat ID or username
  "media": [               // Required: Array of media objects (min 2)
    {
      "type": "photo",     // Required: "photo", "video", "audio", or "document"
      "media": "https://example.com/photo1.jpg", // Required: URL or file_id
      "caption": "Caption 1", // Optional
      "parse_mode": "HTML"    // Optional: "Markdown" or "HTML"
    },
    {
      "type": "photo",
      "media": "https://example.com/photo2.jpg",
      "caption": "Caption 2"
    }
  ],
  "disable_notification": false, // Optional
  "reply_to_message_id": 123,    // Optional
  "allow_sending_without_reply": true // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Telegram API response
  }
}
```

### VK Endpoints

#### `POST /api/vk/uploadPhoto`

Upload a photo to VK.

**Headers:**
```
Content-Type: multipart/form-data
x-api-key: YOUR_SECRET_API_KEY
```

**Form Data:**
```
photo: [file] // Required: Photo file to upload
```

**Response:**
```json
{
  "success": true,
  "data": {
    // VK upload response
  }
}
```

#### `POST /api/vk/post`

Create a post in VK.

**Headers:**
```
Content-Type: application/json
x-api-key: YOUR_SECRET_API_KEY
```

**Request Body:**
```json
{
  "message": "Hello, VK!", // Optional: Post text
  "attachments": "photo123456_789012", // Optional: Comma-separated attachment IDs
  "owner_id": 123456789,   // Required: Group or user ID
  "from_group": 1,         // Optional: 1 to post from group name
  "signed": 0              // Optional: 1 to add signature
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // VK API response
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Missing or invalid API key |
| 403 | Forbidden - API key provided but invalid |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Something went wrong on the server |

## Environment Variables

The following environment variables should be set in your `.env` file:

```
PORT=3000                           # Server port
TELEGRAM_BOT_TOKEN=your_token_here  # Telegram bot token
VK_GROUP_TOKEN=your_token_here      # VK group token
VK_GROUP_ID=your_group_id_here      # VK group ID
API_KEY=your_secret_key_here        # API authentication key
NODE_ENV=development                # Environment (development/production)
```

## Usage Examples

### Sending a Telegram Message

```bash
curl -X POST http://localhost:3000/api/telegram/sendMessage \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_SECRET_API_KEY" \
  -d '{
    "chat_id": "123456789",
    "text": "Hello from Cross-Poster API!"
  }'
```

### Uploading a Photo to VK

```bash
curl -X POST http://localhost:3000/api/vk/uploadPhoto \
  -H "x-api-key: YOUR_SECRET_API_KEY" \
  -F "photo=@/path/to/photo.jpg"
```

### Creating a VK Post

```bash
curl -X POST http://localhost:3000/api/vk/post \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_SECRET_API_KEY" \
  -d '{
    "message": "Check out this photo!",
    "owner_id": 123456789
  }'
```