// src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
}));