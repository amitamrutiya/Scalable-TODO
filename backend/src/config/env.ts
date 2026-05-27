import dotenv from 'dotenv';
import { z } from 'zod';
import { getLogger } from '../utils/logger';

const logger = getLogger('env');

// Load .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  logger.error('Environment validation failed', {
    errors: parsedEnv.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  });
  throw new Error(`Environment validation failed: ${parsedEnv.error.message}`);
}

export const env = parsedEnv.data;
