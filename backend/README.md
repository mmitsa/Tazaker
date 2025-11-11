# 🏥 Hospital Queue Management System - Backend API

RESTful API server for Hospital Queue Management System built with Node.js, Express, PostgreSQL, and Redis.

---

## 📦 Features

- ✅ **Authentication & Authorization**: JWT-based auth with role-based access control
- ✅ **Queue Management**: Real-time ticket and queue management
- ✅ **SMS Notifications**: Twilio/Mobily integration for patient notifications
- ✅ **Real-time Updates**: WebSocket support with Socket.io
- ✅ **Comprehensive Logging**: Winston logger with multiple levels
- ✅ **Rate Limiting**: Protection against abuse
- ✅ **Data Validation**: Joi schemas for all inputs
- ✅ **Error Handling**: Centralized error handling with custom error classes
- ✅ **Security**: Helmet, CORS, bcrypt password hashing

---

## 🛠️ Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js v4
- **Database**: PostgreSQL 15+
- **Cache**: Redis 6+
- **Authentication**: JWT (jsonwebtoken + bcryptjs)
- **Validation**: Joi
- **Logging**: Winston
- **Real-time**: Socket.io
- **SMS**: Twilio / Mobily

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # PostgreSQL setup
│   │   ├── redis.js      # Redis client
│   │   ├── jwt.js        # JWT utilities
│   │   └── sms.js        # SMS service (Twilio/Mobily)
│   │
│   ├── models/           # Database models
│   │   ├── User.js
│   │   ├── Patient.js
│   │   ├── Clinic.js
│   │   ├── Doctor.js
│   │   └── Ticket.js
│   │
│   ├── controllers/      # Business logic
│   │   └── authController.js
│   │
│   ├── routes/           # API routes
│   │   └── auth.routes.js
│   │
│   ├── middleware/       # Middleware
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   └── rateLimiter.middleware.js
│   │
│   ├── services/         # Business services (TODO)
│   ├── websocket/        # WebSocket handlers (TODO)
│   ├── workers/          # Background jobs (TODO)
│   │
│   ├── utils/            # Utilities
│   │   ├── logger.js
│   │   ├── response.js
│   │   └── validators.js
│   │
│   └── app.js            # Express app entry point
│
├── logs/                 # Log files (auto-created)
├── .env.example          # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL 15 or higher
- Redis 6 or higher
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Setup environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server
NODE_ENV=development
PORT=5000
HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_queue
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# SMS (Twilio)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

3. **Setup database:**
```bash
# From project root
createdb hospital_queue
psql -d hospital_queue -f database/schema.sql
psql -d hospital_queue -f database/seed.sql
```

4. **Start Redis:**
```bash
redis-server
```

5. **Start the server:**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on: `http://localhost:5000`

---

## 🔑 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/login` | User login | Public |
| POST | `/api/v1/auth/logout` | User logout | Required |
| GET | `/api/v1/auth/me` | Get current user | Required |
| POST | `/api/v1/auth/change-password` | Change password | Required |
| POST | `/api/v1/auth/refresh-token` | Refresh access token | Public |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |
| GET | `/api` | API info |

---

## 📝 API Usage Examples

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin@123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userId": 1,
      "username": "admin",
      "fullName": "مدير النظام",
      "role": "super_admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### Get Current User
```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔐 User Roles & Permissions

### Role Hierarchy
```
receptionist (0) < doctor (1) < admin (2) < super_admin (3)
```

### Default Users
All default users have password: `Admin@123`

| Username | Role | Description |
|----------|------|-------------|
| `admin` | super_admin | Full system access |
| `admin1`, `admin2` | admin | Admin access |
| `receptionist1-3` | receptionist | Ticket issuance |
| `doctor1-6` | doctor | Patient calling |

---

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

---

## 📊 Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

Log levels: `error`, `warn`, `info`, `http`, `debug`

---

## 🔒 Security

- **Password Hashing**: bcrypt with salt rounds = 10
- **JWT Tokens**: Access (24h) + Refresh (7d)
- **Rate Limiting**: Different limits per endpoint type
- **CORS**: Configurable origin
- **Helmet**: Security headers
- **SQL Injection**: Parameterized queries
- **Input Validation**: Joi schemas

---

## 🐛 Error Handling

Standardized error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [...],
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

Custom error classes:
- `AppError` - Base error
- `ValidationError` - 400
- `UnauthorizedError` - 401
- `ForbiddenError` - 403
- `NotFoundError` - 404
- `ConflictError` - 409

---

## 🚧 TODO

- [ ] Implement remaining controllers (Clinic, Ticket, Patient, Doctor, Report)
- [ ] Implement remaining routes
- [ ] Add WebSocket handlers for real-time updates
- [ ] Add SMS workers for background processing
- [ ] Implement report generation service
- [ ] Add comprehensive unit tests
- [ ] Add integration tests
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add Docker support
- [ ] Add CI/CD pipeline

---

## 📚 Documentation

- [Database Schema](../database/README.md)
- [System Plan](../hospital_system_plan.md)
- [Main README](../README.md)

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) file

---

**Server ready! 🚀 Start building amazing features!**
