# Документация API Cross-Poster

Cross-Poster API позволяет отправлять сообщения и вложения в Telegram и ВКонтакте через единый HTTP-интерфейс.

## Базовый URL

```
http://localhost:3000/api
```

## Аутентификация

Все запросы (кроме проверки состояния) должны содержать заголовок с API-ключом:

```
x-api-key: ВАШ_СЕКРЕТНЫЙ_API_KEY
```

Значение ключа задаётся в переменной `API_KEY` файла `.env`.

## Ограничения по частоте запросов

- не более 100 запросов с одного IP-адреса за 15 минут.

При превышении лимита сервер возвращает ответ `429 Too Many Requests`.

## Формат ответов

API всегда возвращает JSON с признаком успеха запроса.

### Успешный ответ
```json
{
  "success": true,
  "data": {}
}
```

### Ошибочный ответ
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Описание ошибки"
  }
}
```

## Эндпоинты

### Проверка состояния сервиса

#### `GET /api/health`

Позволяет убедиться, что сервис работает и принимает запросы.

**Ответ**
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

### Telegram

#### `POST /api/telegram/sendMessage`

Отправляет текстовое сообщение в указанный чат или канал.

**Заголовки**
```
Content-Type: application/json
x-api-key: ВАШ_СЕКРЕТНЫЙ_API_KEY
```

**Тело запроса**
- `chat_id` — обязателен. Идентификатор чата или @username.
- `text` — обязателен. Текст сообщения.
- `parse_mode` — необязателен. Форматирование `Markdown` или `HTML`.
- `disable_web_page_preview` — необязателен. `true`, если нужно скрыть превью ссылок.
- `disable_notification` — необязателен. `true`, если нужно отправить без звука.
- `reply_to_message_id` — необязателен. ID сообщения, на которое отправляется ответ.
- `allow_sending_without_reply` — необязателен. `true`, чтобы отправить сообщение, даже если исходное удалено.

**Ответ**
```json
{
  "success": true,
  "data": { /* ответ Telegram */ }
}
```

#### `POST /api/telegram/sendPhoto`

Отправляет фотографию в чат. Поддерживаются ссылка/`file_id` или загрузка файла.

**Заголовки**
- для JSON-запроса: `Content-Type: application/json`
- для загрузки файла: `Content-Type: multipart/form-data`
- во всех случаях: `x-api-key: ВАШ_СЕКРЕТНЫЙ_API_KEY`

**Тело запроса**
- `chat_id` — обязателен. Идентификатор чата или @username.
- `photo` — обязателен при JSON-запросе. Ссылка или `file_id`. Для загрузки файла передаётся как поле `photo` формы.
- `caption` — необязателен. Подпись к фото.
- `parse_mode` — необязателен. `Markdown` или `HTML`.
- `disable_notification`, `reply_to_message_id`, `allow_sending_without_reply` — необязательные параметры Telegram.

**Ответ**
```json
{
  "success": true,
  "data": { /* ответ Telegram */ }
}
```

#### `POST /api/telegram/sendMediaGroup`

Публикует группу вложений (фото, видео и т. д.) одним сообщением.

**Заголовки**
```
Content-Type: application/json
x-api-key: ВАШ_СЕКРЕТНЫЙ_API_KEY
```

**Тело запроса**
- `chat_id` — обязателен. Идентификатор чата или @username.
- `media` — обязателен. Массив минимум из двух элементов. Каждый элемент содержит:
  - `type` — тип вложения (`photo`, `video`, `audio`, `document`).
  - `media` — ссылка или `file_id`.
  - `caption` — необязателен. Подпись к элементу.
  - `parse_mode` — необязателен. `Markdown` или `HTML`.
- `disable_notification`, `reply_to_message_id`, `allow_sending_without_reply` — необязательные параметры Telegram.

**Ответ**
```json
{
  "success": true,
  "data": { /* ответ Telegram */ }
}
```

### ВКонтакте (VK)

#### `POST /api/vk/uploadPhoto`

Загружает фотографию на стену ВКонтакте и возвращает данные для прикрепления к посту.

**Заголовки**
```
Content-Type: multipart/form-data
x-api-key: ВАШ_СЕКРЕТНЫЙ_API_KEY
```

**Поля формы**
- `photo` — обязателен. Файл изображения.
- `access_token` — обязателен. Пользовательский или групповой access token с правами `photos` и `wall`.
- `owner_id` — обязателен. ID стены, куда будет публиковаться контент. Для сообщества — отрицательное значение (например, `-123456789`), для пользователя — положительное.

**Ответ**
```json
{
  "success": true,
  "data": {
    "id": 987654321,
    "owner_id": -123456789,
    "attachment": "photo-123456789_987654321"
  }
}
```

Полученное значение `attachment` можно напрямую использовать при создании поста.

#### `POST /api/vk/post`

Создаёт запись на стене сообщества или пользователя ВКонтакте.

**Заголовки**
```
Content-Type: application/json
x-api-key: ВАШ_СЕКРЕТНЫЙ_API_KEY
```

**Тело запроса**
- `access_token` — обязателен. Пользовательский или групповой токен с правами `wall`.
- `owner_id` — обязателен. ID стены (отрицательное для сообщества, положительное для пользователя).
- `message` — необязателен. Текст поста.
- `attachments` — необязателен. Строка или массив ID вложений (например, `"photo123_456"` или `["photo123_456"]`).
- `from_group` — необязателен. `1`, чтобы публиковать от имени сообщества. По умолчанию определяется автоматически: для отрицательного `owner_id` — `1`, иначе `0`.
- `signed` — необязателен. `1`, чтобы добавить подпись автора.

**Ответ**
```json
{
  "success": true,
  "data": { /* ответ VK */ }
}
```

## Коды ошибок

| Код | Описание |
| --- | --- |
| 400 | Неверные данные запроса |
| 401 | Отсутствует или неверный API-ключ/токен VK |
| 403 | Доступ запрещён |
| 429 | Превышен лимит запросов |
| 500 | Внутренняя ошибка сервера |

## Переменные окружения

```
PORT=3000
TELEGRAM_BOT_TOKEN=your_token_here
API_KEY=your_secret_key_here
NODE_ENV=development
```

## Примеры запросов

### Отправка сообщения в Telegram

```bash
curl -X POST http://localhost:3000/api/telegram/sendMessage \
  -H "Content-Type: application/json" \
  -H "x-api-key: ВАШ_СЕКРЕТНЫЙ_API_KEY" \
  -d '{
    "chat_id": "123456789",
    "text": "Привет от Cross-Poster API!"
  }'
```

### Загрузка фотографии во ВКонтакте

```bash
curl -X POST http://localhost:3000/api/vk/uploadPhoto \
  -H "x-api-key: ВАШ_СЕКРЕТНЫЙ_API_KEY" \
  -F "photo=@/path/to/photo.jpg" \
  -F "access_token=VK_ACCESS_TOKEN" \
  -F "owner_id=-123456789"
```

### Создание поста во ВКонтакте

```bash
curl -X POST http://localhost:3000/api/vk/post \
  -H "Content-Type: application/json" \
  -H "x-api-key: ВАШ_СЕКРЕТНЫЙ_API_KEY" \
  -d '{
    "access_token": "VK_ACCESS_TOKEN",
    "owner_id": -123456789,
    "message": "Посмотрите на эту фотографию!",
    "attachments": ["photo-123456789_987654321"]
  }'
```
