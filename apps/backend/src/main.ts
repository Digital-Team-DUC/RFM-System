import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Set Global API Prefix starting at /api/v1
  const apiPrefix = process.env.BACKEND_API_PREFIX || '/api/v1';
  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''));

  // CORS Configuration
  const corsOriginEnv = process.env.CORS_ORIGIN;
  const allowedOrigins = corsOriginEnv
    ? corsOriginEnv === '*'
      ? true
      : corsOriginEnv.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  // OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('RFM System API')
    .setDescription(
      'Enterprise Real Estate & Financial Management System REST API — Property inventory, CRM, contracts, installments, double-entry accounting, and analytics.'
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.BACKEND_PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`========================================================================`);
  logger.log(`🚀 RFM Enterprise Backend running on: http://localhost:${port}/${apiPrefix.replace(/^\//, '')}`);
  logger.log(`📖 OpenAPI / Swagger Docs available on: http://localhost:${port}/api/docs`);
  logger.log(`⚡ WebSocket Events Gateway active on port: ${port}`);
  logger.log(`========================================================================`);
}

bootstrap();
