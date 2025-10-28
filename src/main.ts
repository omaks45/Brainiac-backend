
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Check environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Parse multiple CORS origins
  const corsOrigins = configService
    .get<string>('CORS_ORIGIN', 'http://localhost:3001')
    .split(',')
    .map(origin => origin.trim());

  // Enable CORS with multiple origins (includes WebSocket support)
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Configuration - Available in both development and production
  const swaggerEnabled = configService.get<string>('SWAGGER_ENABLED', 'true') === 'true';
  
  if (swaggerEnabled) {
    const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const port = configService.get<number>('PORT', 5000);
    
    // Determine server URLs based on environment
    const servers = isProduction
      ? [
          { url: configService.get<string>('BACKEND_URL') || 'https://your-api.vercel.app', description: 'Production Server' },
          { url: `http://localhost:${port}`, description: 'Local Development' },
        ]
      : [
          { url: `http://localhost:${port}`, description: 'Development Server' },
        ];

    const config = new DocumentBuilder()
      .setTitle('Brainiac Quiz API')
      .setDescription(
        'Complete API documentation for Brainiac Quiz Application. ' +
        'This API provides endpoints for user authentication, quiz generation, ' +
        'quiz attempts, challenges, leaderboards, and badge management.\n\n' +
        '**WebSocket Support:**\n' +
        '- Real-time quiz challenges\n' +
        '- Live leaderboard updates\n' +
        '- Challenge notifications\n\n' +
        '**WebSocket Connection:**\n' +
        `- Development: ws://localhost:${port}\n` +
        '- Production: wss://your-api.vercel.app\n\n' +
        '**Authentication:**\n' +
        'WebSocket connections support JWT authentication via connection query parameters or handshake headers.',
      )
      .setVersion('1.0')
      .addTag('auth', 'Authentication endpoints - Register, Login, OAuth')
      .addTag('users', 'User management endpoints - Profile, Stats, Preferences')
      .addTag('quizzes', 'Quiz management endpoints - Generate, Retrieve, Filter')
      .addTag('quiz-attempts', 'Quiz attempt endpoints - Submit, History, Results')
      .addTag('challenges', 'Challenge endpoints - Create, Accept, Decline')
      .addTag('leaderboard', 'Leaderboard endpoints - Rankings, Filters')
      .addTag('badges', 'Badge endpoints - User Badges, Achievements')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .setExternalDoc('Frontend Application', frontendUrl)
      .build();

    // Add servers dynamically
    servers.forEach(server => {
      config.servers = config.servers || [];
      config.servers.push(server);
    });

    const document = SwaggerModule.createDocument(app, config);
    
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Brainiac API Documentation',
      customfavIcon: 'https://nestjs.com/img/logo-small.svg',
      customCss: `
        .swagger-ui .topbar { 
          background-color: #2c3e50; 
        }
        .swagger-ui .info { 
          margin: 50px 0; 
        }
        .swagger-ui .info .title {
          color: #2c3e50;
        }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    if (!isProduction) {
      logger.log(`Swagger documentation: http://localhost:${port}/api/docs`);
    } else {
      logger.log('Swagger documentation available at /api/docs');
    }
  }

  const port = configService.get<number>('PORT') || 5000;
  await app.listen(port);
  
  if (!isProduction) {
    logger.log(`Application running on: http://localhost:${port}`);
    logger.log(`WebSocket available at: ws://localhost:${port}`);
    logger.log(`Environment: ${configService.get<string>('NODE_ENV')}`);
    logger.log(`CORS enabled for: ${corsOrigins.join(', ')}`);
  } else {
    logger.log('Application started successfully in production mode');
    logger.log('WebSocket support enabled');
  }
}

bootstrap();