import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { getLogger } from '../utils/logger';

const logger = getLogger('rate-limiter');

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res, _next, options) => {
    logger.warn('Rate limit exceeded', { 
      ip: _req.ip, 
      path: _req.path 
    });
    res.status(options.statusCode).json({
      error: 'RateLimitError',
      message: 'Too many requests, please try again later',
    });
  },
  keyGenerator: (req: any) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip || 'unknown';
  },
});

// Stricter rate limit for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res, _next, options) => {
    logger.warn('Auth rate limit exceeded', { 
      ip: _req.ip, 
      path: _req.path 
    });
    res.status(options.statusCode).json({
      error: 'RateLimitError',
      message: 'Too many login attempts, please try again later',
    });
  },
});
