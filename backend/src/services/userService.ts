import { pool } from '../config/database';
import { User, SanitizedUser, UserStats } from '../types';
import { hashPassword, comparePassword } from '../utils/hash';
import { ValidationError, NotFoundError } from '../utils/errors';
import { getLogger } from '../utils/logger';

const logger = getLogger('user-service');

export interface UpdateProfileData {
  display_name?: string;
  current_password?: string;
  new_password?: string;
}

function sanitizeUser(user: User): SanitizedUser {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    created_at: user.created_at,
  };
}

export async function getUserProfile(userId: string): Promise<SanitizedUser> {
  try {
    const result = await pool.query<User>(
      'SELECT id, email, password_hash, display_name, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    const user = result.rows[0];
    if (!user) {
      throw new NotFoundError('User');
    }

    return sanitizeUser(user);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Failed to get user profile', { error: (error as Error).message, userId });
    throw error;
  }
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_todos,
        COUNT(*) FILTER (WHERE is_completed = true AND deleted_at IS NULL) as completed_todos,
        COUNT(*) FILTER (WHERE is_completed = false AND deleted_at IS NULL) as pending_todos
      FROM todos 
      WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];
    return {
      total_todos: parseInt(row.total_todos, 10),
      completed_todos: parseInt(row.completed_todos, 10),
      pending_todos: parseInt(row.pending_todos, 10),
    };
  } catch (error) {
    logger.error('Failed to get user stats', { error: (error as Error).message, userId });
    throw error;
  }
}

export async function updateProfile(
  userId: string,
  data: UpdateProfileData
): Promise<SanitizedUser> {
  try {
    // Get current user
    const userResult = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User');
    }

    const user = userResult.rows[0];
    if (!user) {
      throw new NotFoundError('User');
    }
    const updates: string[] = [];
    const values: (string | null)[] = [];
    let paramIndex = 1;

    // Update display name
    if (data.display_name !== undefined) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(data.display_name.trim());
    }

    // Update password
    if (data.new_password) {
      if (!data.current_password) {
        throw new ValidationError('Current password is required to change password');
      }

      const isValidPassword = await comparePassword(data.current_password, user.password_hash);
      if (!isValidPassword) {
        throw new ValidationError('Current password is incorrect');
      }

      const newPasswordHash = await hashPassword(data.new_password);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(newPasswordHash);
    }

    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }

    values.push(userId);
    const result = await pool.query<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} 
       RETURNING id, email, password_hash, display_name, created_at, updated_at`,
      values
    );

    const updatedUser = result.rows[0];
    if (!updatedUser) {
      throw new NotFoundError('User');
    }

    logger.info('User profile updated', { userId });

    return sanitizeUser(updatedUser);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
    logger.error('Failed to update profile', { error: (error as Error).message, userId });
    throw error;
  }
}
