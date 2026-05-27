import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { pool, testConnection } from './config/database';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import todoRoutes from './routes/todoRoutes';
import userRoutes from './routes/userRoutes';
import { getLogger } from './utils/logger';

const logger = getLogger('app');
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - allow frontend origin
const corsOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:80', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use(apiRateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (before auth)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
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

// Start server
async function startServer(): Promise<void> {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`, {
        environment: env.NODE_ENV,
        port: env.PORT,
      });
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await pool.end();
          logger.info('Database pool closed');
        } catch (error) {
          logger.error('Error closing database pool', { error: (error as Error).message });
        }
        
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

startServer();
