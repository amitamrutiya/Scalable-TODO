import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiRateLimiter } from '@/middleware/rateLimiter';
import { errorHandler } from '@/middleware/errorHandler';
import authRoutes from '@/routes/authRoutes';
import todoRoutes from '@/routes/todoRoutes';
import userRoutes from '@/routes/userRoutes';

/**
 * Creates an Express app configured identically to the production app
 * but without starting the server. Used for supertest-based integration tests.
 */
export function createTestApp(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: '*',
    credentials: true,
  }));

  // Rate limiting (use generous limits in tests)
  app.use(apiRateLimiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint (before auth)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: 'test',
    });
  });

  // API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/todos', todoRoutes);
  app.use('/api/v1/users', userRoutes);

  // 404 handler
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    const error = new Error('Route not found');
    (error as any).statusCode = 404;
    next(error);
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
