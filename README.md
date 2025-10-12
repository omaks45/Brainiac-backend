# Brainiac Quiz Application - Backend

A comprehensive quiz application backend built with NestJS, featuring AI-powered quiz generation, real-time challenges, and social gaming features.


**Completed Features:**
- User Authentication System (JWT + Google OAuth)
- API Documentation (Swagger)
- Database Integration (MongoDB)
- Security Features (Guards, Validation)

---

## Table of Contents

- [Brainiac Quiz Application - Backend](#brainiac-quiz-application---backend)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
    - [Authentication \& User Management](#authentication--user-management)
    - [Security Features](#security-features)
    - [Documentation](#documentation)
  - [Tech Stack](#tech-stack)
    - [Core Framework](#core-framework)
    - [Database](#database)
    - [Authentication](#authentication)
    - [Documentation](#documentation-1)
    - [Validation](#validation)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [npm install](#npm-install)
    - [Start development server](#start-development-server)

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

### Security Features
- **Global Validation** - Request payload validation with class-validator
- **CORS Protection** - Configured for frontend communication
- **Secure Headers** - HTTP security best practices
- **Environment Variables** - Sensitive data protection
- **Token Expiration** - Automatic session management

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

---

2.  **Install dependencies**
```bash
npm install
---

Create an env file

Configure environment variables (see Environment Variables)

---

### Start development server

bashnpm run start:dev

Verify installation


Server: http://localhost:5000

Swagger Docs: http://localhost:5000/api/docs