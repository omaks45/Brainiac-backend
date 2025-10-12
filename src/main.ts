// src/main.ts
import 'reflect-metadata'; // <-- ADD THIS LINE AT THE TOP
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000',
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

  // Swagger Configuration - Only in development
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Brainiac Quiz API')
      .setDescription(
        'Complete API documentation for Brainiac Quiz Application. ' +
        'This API provides endpoints for user authentication, quiz generation, ' +
        'quiz attempts, challenges, leaderboards, and badge management.',
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
      .addServer('http://localhost:5000', 'Development Server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Brainiac API Documentation',
      customCss: `
        .swagger-ui .topbar { 
          background-color: #2c3e50; 
        }
        .swagger-ui .info { 
          margin: 50px 0; 
        }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
      },
    });

    console.log('Swagger documentation: http://localhost:5000/api/docs');
  }

  const port = configService.get<number>('PORT') || 5000;
  await app.listen(port);
  
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Environment: ${configService.get<string>('NODE_ENV')}`);
}

bootstrap();