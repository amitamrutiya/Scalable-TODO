import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { pool } from '../config/database';
import { User } from '../types';
import { AuthenticationError, ForbiddenError } from '../utils/errors';
import { getLogger } from '../utils/logger';

const logger = getLogger('auth-middleware');

export async function authenticateToken(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new AuthenticationError('Token not provided');
    }

    // Verify JWT
    const payload = verifyToken(token);

    // Look up user in database to ensure they still exist
    const result = await pool.query<User>(
      'SELECT id, email, password_hash, display_name, created_at, updated_at FROM users WHERE id = $1',
      [payload.sub]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('User no longer exists');
    }

    (req as any).user = result.rows[0];
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
      return;
    }

    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
      return;
    }

    if (error instanceof Error && error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token expired'));
      return;
    }

    logger.error('Auth middleware error', { error: (error as Error).message });
    next(new AuthenticationError());
  }
}
