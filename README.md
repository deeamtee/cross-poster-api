# Cross-Poster API

Backend proxy server for cross-posting content to Telegram and VK.

## Features

- Proxy requests to Telegram Bot API to bypass CORS restrictions
- VK posting endpoints that accept per-request access tokens from the frontend
- API key authentication for security
- Rate limiting and request validation
- Structured logging for all API interactions
- Health check endpoint

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Telegram Bot Token
- VK access token with the required scopes will be provided by the frontend at request time

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd cross-poster-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your credentials:
   ```env
   PORT=3000
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   API_KEY=your_secret_api_key_here
   NODE_ENV=development
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (if available)

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Telegram Proxy
- `POST /api/telegram/sendMessage` - Send text message
- `POST /api/telegram/sendPhoto` - Send photo
- `POST /api/telegram/sendMediaGroup` - Send media group

### VK Integration
- `POST /api/vk/post` - Create post in VK using the provided access token
- `POST /api/vk/uploadPhoto` - Upload wall photo in VK and obtain attachment id

## Usage

### Authentication
All API requests (except health check) require an `x-api-key` header with your API key.

### Telegram Endpoints

#### Send Message
```bash
curl -X POST http://localhost:3000/api/telegram/sendMessage \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "123456789",
    "text": "Hello from Cross-Poster!"
  }'
```

#### Send Photo
```bash
curl -X POST http://localhost:3000/api/telegram/sendPhoto \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "123456789",
    "photo": "https://example.com/image.jpg",
    "caption": "Beautiful image"
  }'
```

#### Send Media Group
```bash
curl -X POST http://localhost:3000/api/telegram/sendMediaGroup \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "123456789",
    "media": [
      {
        "type": "photo",
        "media": "https://example.com/image1.jpg"
      },
      {
        "type": "photo",
        "media": "https://example.com/image2.jpg"
      }
    ]
  }'
```

### VK Endpoints

#### Create Post
```bash
curl -X POST http://localhost:3000/api/vk/post \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "vk_user_or_group_access_token",
    "owner_id": -123456789,
    "message": "Hello from Cross-Poster!",
    "attachments": ["photo123456789_987654321"]
  }'
```

- `owner_id` should be negative for communities and positive for user walls.
- `attachments` can be a string or an array of attachment identifiers.

#### Upload Photo
```bash
curl -X POST http://localhost:3000/api/vk/uploadPhoto \
  -H "x-api-key: your_api_key" \
  -F "photo=@/path/to/image.jpg" \
  -F "access_token=vk_user_or_group_access_token" \
  -F "owner_id=-123456789"
```

The upload response contains an `attachment` value that can be forwarded to `POST /api/vk/post`.

## Security Features

- API key authentication for all endpoints
- Rate limiting (100 requests per 15 minutes per IP)
- Input validation and sanitization
- Helmet.js for HTTP security headers
- CORS restricted to frontend origin in development

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 3000) | No |
| TELEGRAM_BOT_TOKEN | Telegram bot token | Yes |
| API_KEY | Secret API key for authentication | Yes |
| NODE_ENV | Environment (development/production) | No |

## Development

The project is written in TypeScript and follows a standard Express.js structure:

```
src/
controllers/     # Request handlers
middleware/      # Custom middleware
routes/          # API route definitions
services/        # Business logic and API integrations
types/           # TypeScript interfaces and types
index.ts         # Application entry point
```

## Error Handling

All endpoints return consistent JSON responses with the following structure:

```json
{
  "success": true,
  "data": {}
}

// Or in case of error:
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Error description"
  }
}
```

## License

MIT
