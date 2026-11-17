import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { PinoLoggerService } from './common/logger/pino-logger.service.js';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const logger = new PinoLoggerService();
  const app = await NestFactory.create(AppModule, {
    logger,
  });

  app.enableShutdownHooks();

  // Middleware: Request ID
  const requestIdMiddleware = new RequestIdMiddleware();
  app.use((req: Request, res: Response, next: NextFunction) => {
    requestIdMiddleware.use(req, res, next);
  });

  // Cookie parser
  app.use(cookieParser());

  // URL rewrite for backward compatibility: rewrite non-prefix routes to /api/v1
  // while preserving /health, /health/ready, /
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (
      !req.url.startsWith('/api/v1') &&
      !req.url.startsWith('/health') &&
      req.url !== '/' &&
      req.url !== ''
    ) {
      req.url = `/api/v1${req.url}`;
    }
    next();
  });

  // Global API Prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['', 'health', 'health/ready'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Global Standard Exception Filter (SDD 6.7)
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(
    `Aplikasi berjalan di port ${port} dengan prefix /api/v1`,
    'Bootstrap',
  );
}
await bootstrap();
