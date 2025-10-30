# Brainiac Quiz Application - Backend

A comprehensive quiz application backend built with NestJS, featuring AI-powered quiz generation, real-time challenges, and social gaming features.

## Current Status

**Completed Features:**
- Phase 1: User Authentication System (JWT + Google OAuth)
- Phase 2: AI-Powered Quiz Generation & Management
- API Documentation (Swagger)
- Database Integration (MongoDB)
- Security Features (Guards, Validation)
- WebSocket Infrastructure (Real-time events)

---

## Table of Contents

- [Features](#features)
  - [Authentication & User Management](#authentication--user-management)
  - [Quiz Generation & Management](#quiz-generation--management)
  - [Quiz Attempts & Grading](#quiz-attempts--grading)
  - [Security Features](#security-features)
  - [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Phase 1: Authentication System](#phase-1-authentication-system)
- [Phase 2: Quiz Generation System](#phase-2-quiz-generation-system)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Testing](#testing)

---

## Features

### Authentication & User Management
- **Email/Password Authentication** - Secure registration and login
- **Google OAuth 2.0** - One-click sign-in with Google
- **JWT Tokens** - Access and refresh token system
- **Password Security** - Bcrypt hashing with salt rounds
- **Token Refresh** - Automatic token renewal
- **Protected Routes** - JWT guard for secure endpoints
- **User Profiles** - Personalized user data and stats

### Quiz Generation & Management
- **AI-Powered Quiz Creation** - Google Gemini 2.5 Flash integration
- **9 Quiz Categories** - Software Engineering, Mathematics, Data Science, and more
- **3 Difficulty Levels** - Easy, Medium, Hard with adaptive complexity
- **Customizable Question Count** - 5-20 questions per quiz
- **Intelligent Question Generation** - Context-aware prompts for quality content
- **CRUD Operations** - Full quiz management capabilities
- **Pagination & Filtering** - Efficient quiz browsing by category/difficulty

### Quiz Attempts & Grading
- **Automated Grading** - Instant feedback on submissions
- **Detailed Explanations** - Learn from every answer
- **Time Tracking** - Per-question and total duration monitoring
- **Score Calculation** - Points and percentage tracking
- **Attempt History** - Complete review of past attempts
- **User Statistics** - Track progress, averages, and best scores

### Security Features
- **Global Validation** - Request payload validation with class-validator
- **CORS Protection** - Configured for frontend communication
- **Secure Headers** - HTTP security best practices
- **Environment Variables** - Sensitive data protection
- **Token Expiration** - Automatic session management
- **Answer Protection** - Server-side grading only, answers hidden from clients
- **Input Validation** - Comprehensive DTO validation for all endpoints

### Documentation
- **Swagger UI** - Interactive API documentation at `/api/docs`
- **Request/Response Examples** - Complete API reference
- **Authentication Testing** - Test endpoints directly from browser

---

## Tech Stack

### Core Framework
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **Express** - HTTP server

### Database
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **MongoDB Atlas** - Cloud database hosting

### Authentication
- **Passport.js** - Authentication middleware
- **JWT** - JSON Web Tokens
- **Google OAuth 2.0** - Social authentication
- **Bcrypt** - Password hashing

### AI Integration
- **Google Gemini AI** - Quiz question generation
- **@google/generative-ai** - Official Gemini SDK
- **Intelligent Prompting** - Context-aware question creation

### Real-time Communication
- **Socket.io** - WebSocket implementation
- **@nestjs/websockets** - NestJS WebSocket support
- **JWT WebSocket Guard** - Secure WebSocket connections

### Documentation
- **Swagger/OpenAPI** - API documentation
- **@nestjs/swagger** - NestJS Swagger integration

### Validation
- **class-validator** - Decorator-based validation
- **class-transformer** - Object transformation

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Google Cloud Console account (for OAuth)
- Google Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd brainiac-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory (see [Environment Variables](#environment-variables) section)

4. **Start development server**
```bash
npm run start:dev
```

5. **Verify installation**
- Server: http://localhost:5000
- Swagger Docs: http://localhost:5000/api/docs
- Health Check: http://localhost:5000/health

---

## Phase 1: Authentication System

### Endpoints

#### Public Endpoints

**Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe"
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Google OAuth Login**
```http
GET /api/auth/google
# Redirects to Google OAuth consent screen
```

**Refresh Token**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Protected Endpoints

**Get User Profile**
```http
GET /api/auth/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

**Logout**
```http
POST /api/auth/logout
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Phase 2: Quiz Generation System

### Overview

Phase 2 implements the core quiz functionality powered by Google Gemini AI, enabling dynamic quiz generation across multiple categories with intelligent question creation, automated grading, and comprehensive attempt tracking.

### Quiz Categories

| Category | ID | Description | Icon |
|----------|----|-----------  |------|
| Software Engineering | `software-engineering` | Programming, algorithms, design patterns | 💻 |
| Mathematics | `mathematics` | Algebra, calculus, geometry, statistics | 🔢 |
| Data Science | `data-science` | ML, statistics, data analysis | 📊 |
| UI/UX Design | `ui-ux-design` | Design principles, prototyping | 🎨 |
| Data Analytics | `data-analytics` | SQL, BI, visualization | 📈 |
| Biological Science | `biological-science` | Biology, genetics, ecology | 🧬 |
| Physical Science | `physical-science` | Physics, chemistry, astronomy | ⚛️ |
| Art & Humanities | `art-humanities` | History, literature, philosophy | 🎭 |
| Economics | `economics` | Micro/macroeconomics, markets | 💰 |

### Difficulty Levels

| Difficulty | Points | Time Limit | Characteristics |
|------------|--------|-----------|-----------------|
| **Easy** | 10 pts | 30 seconds | Basic concepts, definitions, straightforward |
| **Medium** | 15 pts | 45 seconds | Applied knowledge, scenarios, understanding |
| **Hard** | 20 pts | 60 seconds | Advanced concepts, critical thinking |

### Endpoints

#### Categories

**Get All Categories**
```http
GET /api/categories
# No authentication required
```

**Get Category by ID**
```http
GET /api/categories/:id
# No authentication required
```

#### Quizzes

**Generate Quiz**
```http
POST /api/quizzes/generate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "category": "software-engineering",
  "difficulty": "medium",
  "numberOfQuestions": 10
}
```

**Get All Quizzes**
```http
GET /api/quizzes?category=software-engineering&difficulty=easy&page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

Query Parameters:
- `category` (optional) - Filter by category
- `difficulty` (optional) - Filter by difficulty (easy, medium, hard)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 50)

**Get Quiz by ID**
```http
GET /api/quizzes/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Quiz Attempts

**Submit Quiz Answers**
```http
POST /api/quiz-attempts/submit
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "quizId": "690230ef10266586c59ca5e8",
  "answers": [
    {
      "questionIndex": 0,
      "selectedAnswer": 2,
      "timeSpent": 25
    },
    {
      "questionIndex": 1,
      "selectedAnswer": 1,
      "timeSpent": 30
    }
  ]
}
```

**Get User Attempt History**
```http
GET /api/quiz-attempts?page=1&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

**Get User Statistics**
```http
GET /api/quiz-attempts/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

**Get Specific Attempt**
```http
GET /api/quiz-attempts/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

### Request/Response Examples

#### Generate Quiz Response
```json
{
  "_id": "690230ef10266586c59ca5e8",
  "title": "Software Engineering Quiz - Medium",
  "category": "software-engineering",
  "difficulty": "medium",
  "questions": [
    {
      "questionText": "What is the primary purpose of a variable in programming?",
      "options": [
        "To declare a constant value",
        "To define a function's return type",
        "To reserve a named storage location",
        "To create a loop"
      ],
      "points": 15,
      "timeLimit": 45
    }
  ],
  "totalPoints": 150,
  "estimatedDuration": 8,
  "createdAt": "2025-10-29T15:21:19.045Z"
}
```

#### Submit Quiz Response
```json
{
  "_id": "690230ef10266586c59ca5f0",
  "quizId": "690230ef10266586c59ca5e8",
  "score": 50,
  "percentage": 83,
  "totalQuestions": 6,
  "correctAnswers": 5,
  "duration": 190,
  "answers": [
    {
      "questionIndex": 0,
      "questionText": "What is the primary purpose of a variable?",
      "selectedAnswer": 2,
      "correctAnswer": 2,
      "isCorrect": true,
      "explanation": "A variable is a named memory location that stores data...",
      "pointsEarned": 10,
      "timeSpent": 25
    }
  ],
  "completedAt": "2025-10-29T15:30:00.000Z"
}
```

#### User Statistics Response
```json
{
  "totalAttempts": 24,
  "averageScore": 78,
  "averagePercentage": 82,
  "totalTimeSpent": 4320,
  "bestScore": 150,
  "bestPercentage": 100
}
```

### AI Integration Details

**Model:** Google Gemini 2.5 Flash (or gemini-1.5-flash)

**Generation Settings:**
```typescript
{
  temperature: 0.7,      // Balanced creativity
  topP: 0.95,           // Nucleus sampling
  topK: 40,             // Top-k sampling
  maxOutputTokens: 8192 // Maximum response length
}
```

**Features:**
- Context-aware prompts based on category
- Difficulty-appropriate question complexity
- Structured JSON output validation
- Automatic quality checks
- Detailed explanations for each answer

### Database Schemas

#### Quiz Schema
```typescript
{
  title: String,
  category: String,
  difficulty: String,
  questions: [{
    questionText: String,
    options: [String],
    correctAnswerIndex: Number,  // Hidden from GET responses
    explanation: String,
    points: Number,
    timeLimit: Number
  }],
  totalPoints: Number,
  estimatedDuration: Number,
  createdBy: String,
  isPublic: Boolean,
  metadata: {
    timesAttempted: Number,
    averageScore: Number,
    aiModel: String
  }
}
```

#### Quiz Attempt Schema
```typescript
{
  userId: ObjectId,
  quizId: ObjectId,
  answers: [{
    questionIndex: Number,
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeSpent: Number,
    pointsEarned: Number
  }],
  score: Number,
  percentage: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  duration: Number,
  isCompleted: Boolean,
  completedAt: Date
}
```

---

## API Documentation

### Interactive Documentation
Access the full interactive API documentation at:
```
http://localhost:5000/api/docs
```

Features:
- Try out all endpoints directly from the browser
- See request/response schemas
- Test authentication flows
- View all available parameters

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Response Format
All API responses follow a consistent format:

**Success Response:**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message"
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

---

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/brainiac?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Getting API Keys

**MongoDB Atlas:**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string from "Connect" button

**Google OAuth:**
1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

**Google Gemini AI:**
1. Visit https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy the key to your `.env` file

---

## Project Structure

```
brainiac-backend/
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   │   └── get-user.decorator.ts
│   │   ├── gateways/
│   │   │   └── events.gateway.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── ws-jwt.guard.ts
│   │
│   ├── config/
│   │   ├── ai.config.ts
│   │   ├── database.config.ts
│   │   └── swagger.config.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── register.dto.ts
│   │   │   ├── schemas/
│   │   │   │   └── user.schema.ts
│   │   │   ├── strategies/
│   │   │   │   ├── google.strategy.ts
│   │   │   │   └── jwt.strategy.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── categories/
│   │   │   ├── categories.constants.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   └── categories.module.ts
│   │   │
│   │   ├── quizzes/
│   │   │   ├── dto/
│   │   │   │   ├── generate-quiz.dto.ts
│   │   │   │   └── query-quizzes.dto.ts
│   │   │   ├── schemas/
│   │   │   │   └── quiz.schema.ts
│   │   │   ├── services/
│   │   │   │   └── ai-quiz-generator.service.ts
│   │   │   ├── quizzes.controller.ts
│   │   │   ├── quizzes.service.ts
│   │   │   └── quizzes.module.ts
│   │   │
│   │   └── quiz-attempts/
│   │       ├── dto/
│   │       │   ├── submit-quiz.dto.ts
│   │       │   └── submit-answer.dto.ts
│   │       ├── schemas/
│   │       │   └── quiz-attempt.schema.ts
│   │       ├── quiz-attempts.controller.ts
│   │       ├── quiz-attempts.service.ts
│   │       └── quiz-attempts.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── .env
├── .gitignore
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## Testing

### Manual Testing with cURL

#### Test Quiz Generation
```bash
# Generate a quiz
curl -X POST http://localhost:5000/api/quizzes/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "software-engineering",
    "difficulty": "medium",
    "numberOfQuestions": 5
  }'
```

#### Test Quiz Submission
```bash
# Submit quiz answers
curl -X POST http://localhost:5000/api/quiz-attempts/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quizId": "QUIZ_ID_HERE",
    "answers": [
      {"questionIndex": 0, "selectedAnswer": 2, "timeSpent": 25},
      {"questionIndex": 1, "selectedAnswer": 1, "timeSpent": 30}
    ]
  }'
```

#### Test User Stats
```bash
curl http://localhost:5000/api/quiz-attempts/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Swagger UI

1. Navigate to http://localhost:5000/api/docs
2. Click "Authorize" button
3. Enter your JWT token
4. Test any endpoint interactively

---

## Common Issues & Solutions

### AI Generation Fails

**Error:** `AI model not found (404)`

**Solution:**
- Update `GEMINI_MODEL` to `gemini-2.5-flash`
- Verify your API key is valid
- Check API quota hasn't been exceeded

### Quiz Submission Validation Error

**Error:** `Expected 10 answers, got 5`

**Solution:**
- Ensure all questions are answered
- Answer array length must match quiz question count

### MongoDB Connection Error

**Error:** `MongoServerError: bad auth`

**Solution:**
- Verify MongoDB URI is correct
- Check username/password
- Ensure IP address is whitelisted in MongoDB Atlas

### Google OAuth Error

**Error:** `redirect_uri_mismatch`

**Solution:**
- Add the callback URL to authorized redirect URIs in Google Console
- Ensure `GOOGLE_CALLBACK_URL` matches exactly

---

## Performance Optimizations

### Database
- Indexed queries for fast filtering
- Lean queries for list endpoints
- Selective projection (hide sensitive data)
- Pagination for large datasets

### API
- Response compression
- Request validation
- Rate limiting (future implementation)
- Caching strategies (future implementation)

---

## Security Best Practices

- All passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with short expiration (15 minutes)
- Refresh tokens for extended sessions
- CORS configured for specific origins
- Input validation on all endpoints
- Quiz answers hidden from client responses
- Server-side grading only

---

## Future Enhancements (Phase 3)

- [ ] Challenge System (Real-time quiz battles)
- [ ] Leaderboard System (Rankings & competitions)
- [ ] Badge System (Achievements & rewards)
- [ ] Real-time notifications (WebSocket events)
- [ ] Social features (Friends, sharing)
- [ ] Quiz bookmarking
- [ ] Custom quiz creation by users
- [ ] Quiz recommendations based on performance

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Support

For issues and questions:
- Open an issue on GitHub
- Check Swagger documentation at `/api/docs`
- Review this README

---

**Last Updated:** Phase 2 Complete - October 2025  
**Version:** 2.0.0  
**Status:** Authentication Complete | Quiz Generation Complete | Challenges In Progress
