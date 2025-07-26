# Component Generator Backend

A Node.js Express backend for the AI-driven component generator platform.

## 🚀 Features

- **Authentication**: JWT-based auth with refresh tokens
- **Session Management**: Persistent chat sessions with auto-save
- **AI Integration**: OpenRouter API for component generation
- **Redis Caching**: Session and user data caching
- **Rate Limiting**: Protect AI endpoints from abuse
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Helmet, CORS, input validation

## 📦 Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Authentication**: JWT
- **AI**: OpenRouter API (GPT-4, Llama, Gemini)
- **Validation**: Express-validator
- **Security**: Helmet, bcryptjs

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- Redis (local or cloud)
- OpenRouter API key

### Installation

1. **Clone and setup**

   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**

   ```bash
   cp .env.example .env
   ```

3. **Configure Environment Variables**
   Edit `.env` file with your settings:

   ```env
   NODE_ENV=development
   PORT=5000

   # Database
   MONGODB_URI=mongodb://localhost:27017/component-generator

   # Redis
   REDIS_URL=redis://localhost:6379

   # JWT
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret

   # AI
   OPENROUTER_API_KEY=your-openrouter-key
   AI_MODEL=openai/gpt-4o-mini

   # CORS
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start Services**

   **MongoDB** (if running locally):

   ```bash
   mongod
   ```

   **Redis** (if running locally):

   ```bash
   redis-server
   ```

5. **Start the Server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout user
- `DELETE /api/auth/account` - Delete account

### Sessions

- `GET /api/sessions` - List user sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/active` - Get active session
- `POST /api/sessions/:id/auto-save` - Auto-save session

### AI

- `POST /api/ai/generate` - Generate component
- `POST /api/ai/refine` - Refine component
- `POST /api/ai/chat` - Chat with AI
- `GET /api/ai/models` - Get available models
- `GET /api/ai/usage` - Get usage statistics

### Utility

- `GET /health` - Health check
- `GET /` - API information

## 🔧 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js              # Environment configuration
│   │   ├── database.js         # MongoDB connection
│   │   └── redis.js            # Redis connection
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── sessionController.js # Session management
│   │   └── aiController.js     # AI integration
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── rateLimit.js        # Rate limiting
│   │   └── errorHandler.js     # Error handling
│   ├── models/
│   │   ├── User.js             # User schema
│   │   └── Session.js          # Session schema
│   ├── routes/
│   │   ├── auth.js             # Auth routes
│   │   ├── sessions.js         # Session routes
│   │   └── ai.js               # AI routes
│   ├── services/
│   │   └── aiService.js        # AI API integration
│   ├── utils/
│   │   ├── jwt.js              # JWT utilities
│   │   └── validation.js       # Input validation
│   └── app.js                  # Express app setup
├── server.js                   # Server entry point
├── package.json
└── README.md
```

## 🧪 Testing

### Health Check

```bash
curl http://localhost:5000/health
```

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "name": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

## 🚀 Deployment

### Railway/Render

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=production-secret
OPENROUTER_API_KEY=your-key
FRONTEND_URL=https://your-frontend-domain.com
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Password Hashing** with bcrypt (12 rounds)
- **Rate Limiting** per endpoint and user
- **Input Validation** with express-validator
- **CORS Protection** with whitelist
- **Helmet Security** headers
- **Token Blacklisting** for logout
- **Error Sanitization** in production

## 📊 Monitoring

### Logs

- Development: Console logging with colors
- Production: JSON formatted logs

### Health Monitoring

```bash
GET /health
```

Returns:

```json
{
  "status": "healthy",
  "timestamp": "2025-07-25T10:00:00.000Z",
  "environment": "development",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start with nodemon
npm start        # Production start
npm test         # Run tests
```

### Adding New Features

1. Create controller in `src/controllers/`
2. Add routes in `src/routes/`
3. Add validation in `src/utils/validation.js`
4. Test endpoints
5. Update documentation

## ⚠️ Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**

   - Check MongoDB is running
   - Verify connection string
   - Check network connectivity

2. **Redis Connection Failed**

   - Check Redis is running
   - Verify Redis URL
   - Check authentication

3. **AI API Errors**

   - Verify OpenRouter API key
   - Check rate limits
   - Monitor API usage

4. **CORS Errors**
   - Check FRONTEND_URL in .env
   - Verify CORS configuration

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and stack traces.

## 📈 Performance

### Optimizations

- **Redis Caching** for sessions and user data
- **Database Indexing** on frequently queried fields
- **Response Compression** with gzip
- **Request Rate Limiting** to prevent abuse
- **Connection Pooling** for MongoDB

### Monitoring

- Response times logged in development
- Error tracking with stack traces
- Resource usage monitoring available

## 🤝 Contributing

1. Follow existing code patterns
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test all endpoints

## 📝 License

MIT License - see LICENSE file for details.
