import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { signup, login, logout } from '../services/authService';
import { validateBody } from '../middleware/validation';
import { getLogger } from '../utils/logger';

const logger = getLogger('auth-controller');

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one digit'),
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or less')
    .transform((val) => val.trim()),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const validateSignup = validateBody(signupSchema);
export const validateLogin = validateBody(loginSchema);

export async function signupHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await signup(req.body);
    res.status(201).json({
      success: true,
      data: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await login(req.body);
    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    await logout(userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
